import { Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { ReturnRequest, RmaStatus, RmaType } from '../models/ReturnRequest';
import { Order, OrderStatus } from '../models/Order';
import { emitToUser, emitToAdmins } from '../config/socket';
import { RefundError, createOrderRefund } from '../services/refunds';
import { requireCustomer } from '../utils/requireCustomer';

const itemSchema = Joi.object({
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
  quantity: Joi.number().integer().min(1).max(10).required(),
  reason: Joi.string().trim().max(500).required(),
  size: Joi.string().trim().max(10).optional().allow(''),
  exchangeSize: Joi.string().trim().max(10).optional().allow(''),
});

// POST /api/returns — customer raises return/exchange (order must be theirs + delivered/shipped)
export const createReturnRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      orderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      type: Joi.string().valid('return', 'exchange').required(),
      items: Joi.array().items(itemSchema).min(1).max(20).required(),
      reason: Joi.string().trim().max(1000).required(),
      refundMethod: Joi.string().valid('source', 'upi', 'bank').default('source'),
      upiId: Joi.string().trim().max(100).optional().allow(''),
      bankAccountName: Joi.string().trim().max(100).optional().allow(''),
      bankAccountNumber: Joi.string().trim().max(30).optional().allow(''),
      bankIfsc: Joi.string().trim().max(11).optional().allow(''),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    if (value.refundMethod === 'upi' && !value.upiId) {
      res.status(400).json({ error: 'UPI ID is required for UPI refunds' });
      return;
    }
    if (value.refundMethod === 'bank' && (!value.bankAccountNumber || !value.bankIfsc || !value.bankAccountName)) {
      res.status(400).json({ error: 'Bank account name, number and IFSC are required for bank refunds' });
      return;
    }
    const userId = req.user?.userId;
    if (!requireCustomer(req, res)) return;
    const order = await Order.findById(value.orderId);
    if (!order || order.userId.toString() !== userId) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (![OrderStatus.DELIVERED, OrderStatus.SHIPPED].includes(order.status)) {
      res.status(400).json({ error: 'Returns can be raised only after the order ships (7-day window from delivery).' });
      return;
    }
    const rma = await ReturnRequest.create({
      userId: new mongoose.Types.ObjectId(userId),
      orderId: order._id,
      orderNumber: order.orderNumber,
      type: value.type as RmaType,
      items: value.items.map((i: any) => ({ ...i, productId: new mongoose.Types.ObjectId(i.productId) })),
      reason: value.reason,
      refundMethod: value.refundMethod || 'source',
      upiId: value.upiId || undefined,
      bankAccountName: value.bankAccountName || undefined,
      bankAccountNumber: value.bankAccountNumber || undefined,
      bankIfsc: value.bankIfsc ? String(value.bankIfsc).toUpperCase() : undefined,
    });
    emitToAdmins('returnRequested', { rmaId: rma._id.toString(), orderNumber: order.orderNumber, type: value.type });
    res.status(201).json({ success: true, message: 'Return request raised. We will confirm pickup on WhatsApp.', data: rma });
  } catch (err) {
    console.error('Create return request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/returns/mine — customer list
export const myReturnRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await ReturnRequest.find({ userId: req.user?.userId }).sort({ createdAt: -1 }).populate('orderId', 'orderNumber total').lean();
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('My returns error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/returns/admin — Admin queue
export const listReturnRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const filter: any = {};
    if (status && Object.values(RmaStatus).includes(status as any)) filter.status = status;
    const rows = await ReturnRequest.find(filter).sort({ createdAt: -1 }).limit(200).populate('orderId', 'orderNumber total').lean();
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('List returns error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/returns/admin/:id — Admin update status + note (triggers WhatsApp update + Razorpay refund on refunded)
export const updateReturnRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      status: Joi.string().valid(...Object.values(RmaStatus)).required(),
      adminNote: Joi.string().trim().max(1000).optional().allow(''),
      refundAmount: Joi.number().min(0).optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const rma = await ReturnRequest.findById(req.params.id);
    if (!rma) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }
    const nextStatus = value.status as RmaStatus;
    if (value.adminNote !== undefined) rma.adminNote = value.adminNote;
    if (value.refundAmount !== undefined) rma.refundAmount = value.refundAmount;

    // A return refund is an order refund too. Route it through the same ledger
    // so it is capped at collected money and cannot overwrite previous partial
    // refunds. The amount is based on the returned line items unless the admin
    // supplies an explicit refundAmount.
    if (nextStatus === RmaStatus.REFUNDED && !rma.razorpayRefundId) {
      const order: any = await Order.findById(rma.orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      let computedAmount = 0;
      for (const item of rma.items) {
        const line = order.items.find(
          (orderItem: any) => String(orderItem.productId) === String(item.productId)
        );
        if (!line) continue;
        const unitPrice = Number(line.price ?? (line.subtotal && line.quantity ? line.subtotal / line.quantity : 0)) || 0;
        computedAmount += unitPrice * Number(item.quantity || 0);
      }
      const amount = Math.round(
        (value.refundAmount ?? rma.refundAmount ?? computedAmount) * 100
      ) / 100;
      if (!amount || amount <= 0) {
        res.status(400).json({
          error: 'Add a refundAmount for this return or ensure the returned items have prices.',
        });
        return;
      }

      try {
        const result = await createOrderRefund({
          orderId: rma.orderId.toString(),
          amount,
          notes: `Return ${rma._id.toString()} — ${rma.reason}`.slice(0, 500),
          destination: rma.refundMethod || 'source',
          upiId: rma.upiId,
          bankAccountName: rma.bankAccountName,
          bankAccountNumber: rma.bankAccountNumber,
          bankIfsc: rma.bankIfsc,
          adminId: req.user?.userId,
        });
        const refund: any = result.refund;
        rma.refundAmount = refund?.amount ?? amount;
        rma.razorpayRefundId = refund?.razorpayRefundId || rma.razorpayRefundId;
        rma.refundedAt = new Date();
      } catch (e: any) {
        if (e instanceof RefundError) {
          res.status(e.status).json({ error: e.message, details: e.details });
          return;
        }
        console.error('Return refund failed:', e.response?.data || e.message);
        res.status(502).json({ error: 'Refund failed', details: e.response?.data || e.message });
        return;
      }
    }

    rma.status = nextStatus;
    await rma.save();

    emitToUser(rma.userId.toString(), 'returnUpdated', { rmaId: rma._id.toString(), status: rma.status, orderNumber: rma.orderNumber });
    try {
      const { User } = await import('../models/User');
      const { sendWhatsApp } = await import('../services/whatsapp');
      const buyer: any = await User.findById(rma.userId).select('phone').lean();
      if (buyer?.phone) {
        await sendWhatsApp(buyer.phone, `Mentoos ${rma.type} update: ${rma.orderNumber} is now ${rma.status.replace('_', ' ')}.${rma.adminNote ? ` Note: ${rma.adminNote}` : ''}`);
      }
    } catch { /* notifications optional */ }

    res.status(200).json({ success: true, message: 'Return request updated', data: rma });
  } catch (err) {
    console.error('Update return request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/returns/admin/size-report — Admin: size-issue return rate per product.
// Flags products whose size-related returns suggest a bad size chart.
const SIZE_ISSUE_RE = /size|small|large|tight|loose|fit\b|short|long/i;

export const sizeIssueReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Math.min(Math.max(parseInt((req.query.days as string) || '90', 10) || 90, 7), 365);
    const minReturns = Math.max(parseInt((req.query.minReturns as string) || '3', 10) || 3, 1);
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const rmas = await ReturnRequest.find({ createdAt: { $gte: since } })
      .select('items type status createdAt')
      .lean();
    const byProduct = new Map<string, { total: number; sizeIssues: number; sizes: Record<string, number> }>();
    for (const r of rmas as any[]) {
      for (const it of r.items || []) {
        const pid = String(it.productId);
        let e = byProduct.get(pid);
        if (!e) {
          e = { total: 0, sizeIssues: 0, sizes: {} };
          byProduct.set(pid, e);
        }
        e.total += 1;
        const isSize =
          Boolean(it.exchangeSize) ||
          SIZE_ISSUE_RE.test(it.reason || '') ||
          SIZE_ISSUE_RE.test((r as any).reason || '') ||
          (r as any).type === 'exchange';
        if (isSize) {
          e.sizeIssues += 1;
          const key = [it.size, it.exchangeSize ? `→ ${it.exchangeSize}` : ''].filter(Boolean).join(' ') || 'unknown';
          e.sizes[key] = (e.sizes[key] || 0) + 1;
        }
      }
    }
    const { Product } = await import('../models/Product');
    const rows: Array<{ productId: string; name: string; sku: string; total: number; sizeIssues: number; rate: number; sizes: Record<string, number> }> = [];
    for (const [pid, e] of byProduct) {
      if (e.total < minReturns) continue;
      const p: any = await Product.findById(pid).select('name sku').lean();
      if (!p) continue;
      rows.push({
        productId: pid,
        name: p.name,
        sku: p.sku,
        total: e.total,
        sizeIssues: e.sizeIssues,
        rate: Math.round((e.sizeIssues / e.total) * 100),
        sizes: e.sizes,
      });
    }
    rows.sort((a, b) => b.rate - a.rate || b.sizeIssues - a.sizeIssues);
    res.status(200).json({ success: true, data: { days, minReturns, rows, flagged: rows.filter((r) => r.rate >= 40) } });
  } catch (err) {
    console.error('Size report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
