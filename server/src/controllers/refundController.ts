import { Request, Response } from 'express';
import Joi from 'joi';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { Refund, RefundStatus } from '../models/Refund';
import {
  RefundError,
  completeManualRefund,
  createOrderRefund,
  getRefundContext,
} from '../services/refunds';

const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

type RefundRow = {
  _id: string;
  orderId: string;
  orderNumber: string;
  customer: string;
  amount: number;
  status: string;
  destination: 'source' | 'upi' | 'bank';
  method: 'razorpay' | 'manual';
  notes: string;
  reference?: string;
  razorpayRefundId?: string;
  razorpayPaymentId?: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
  orderTotal?: number;
  collected?: number;
  refundedBefore?: number;
  refundedAfter?: number;
  legacy?: boolean;
  canComplete?: boolean;
  canRetry?: boolean;
};

function customerName(user: any, order?: any): string {
  const u = user || order?.userId;
  return u?.name || u?.email || order?.shippingAddress?.fullName || order?.shippingAddress?.name || 'Customer';
}

function mapRefund(refund: any): RefundRow {
  const order = refund.orderId && typeof refund.orderId === 'object' ? refund.orderId : null;
  const orderId = String(order?._id || refund.orderId || '');
  const razorpayRefundId = refund.razorpayRefundId || undefined;
  return {
    _id: String(refund._id),
    orderId,
    orderNumber: refund.orderNumber || order?.orderNumber || '',
    customer: customerName(refund.userId, order),
    amount: round2(refund.amount),
    status: refund.status,
    destination: refund.destination || 'source',
    method: razorpayRefundId ? 'razorpay' : 'manual',
    notes: refund.notes || '',
    reference: refund.reference || razorpayRefundId,
    razorpayRefundId,
    razorpayPaymentId: refund.razorpayPaymentId,
    failureReason: refund.failureReason,
    createdAt: refund.createdAt ? new Date(refund.createdAt).toISOString() : new Date().toISOString(),
    completedAt: refund.completedAt ? new Date(refund.completedAt).toISOString() : undefined,
    orderTotal: order?.total,
    collected: refund.collectedAtRequest,
    refundedBefore: refund.refundedBefore,
    refundedAfter: refund.refundedAfter,
    legacy: false,
    canComplete: refund.status === RefundStatus.PROCESSING && !razorpayRefundId,
    canRetry: refund.status === RefundStatus.FAILED,
  };
}

function mapLegacyRefund(order: any, payment?: any, amountOverride?: number): RefundRow {
  const rpRefundId =
    (order.refundReference && String(order.refundReference).startsWith('rfnd_')
      ? String(order.refundReference)
      : String(order.paymentNotes || '').match(/Razorpay refund:\s*(rfnd_[A-Za-z0-9]+)/)?.[1]) ||
    (payment?.refundId && String(payment.refundId).startsWith('rfnd_')
      ? String(payment.refundId)
      : undefined);
  const status = order.refundStatus === 'processing' ? RefundStatus.PROCESSING : RefundStatus.COMPLETED;
  const destination = (order.refundMethod || 'source') as 'source' | 'upi' | 'bank';
  const amount = round2(amountOverride === undefined ? order.refundAmount || 0 : amountOverride);
  const collected =
    String(order.paymentMethod || '').toLowerCase() === 'cod'
      ? Number(order.refundAmount || 0) >= Number(order.total || 0) - 0.01
        ? round2(order.total || 0)
        : Math.max(round2(order.codAdvancePaid || 0), round2(payment?.amount || 0))
      : round2(Math.max(order.total || 0, payment?.amount || 0));

  return {
    _id: `legacy_${String(order._id)}`,
    orderId: String(order._id),
    orderNumber: order.orderNumber || '',
    customer: customerName(order.userId, order),
    amount,
    status,
    destination,
    method: rpRefundId ? 'razorpay' : 'manual',
    notes: order.refundNotes || 'Legacy refund record',
    reference: order.refundReference || rpRefundId,
    razorpayRefundId: rpRefundId || undefined,
    razorpayPaymentId: payment?.razorpayPaymentId || order.razorpayPaymentId || undefined,
    createdAt: new Date(order.refundCompletedAt || order.updatedAt || order.createdAt).toISOString(),
    completedAt: order.refundCompletedAt ? new Date(order.refundCompletedAt).toISOString() : undefined,
    orderTotal: round2(order.total || 0),
    collected,
    refundedBefore: round2(Math.max(0, collected - amount)),
    refundedAfter: amount,
    legacy: true,
    canComplete: status === RefundStatus.PROCESSING && !rpRefundId,
    canRetry: false,
  };
}

async function loadAllRows(): Promise<RefundRow[]> {
  const [refunds, ordersWithRefunds] = await Promise.all([
    Refund.find({})
      .populate('userId', 'name email')
      .populate('orderId', 'orderNumber total status paymentStatus paymentMethod')
      .sort({ createdAt: -1 })
      .limit(2000)
      .lean(),
    Order.find({ refundAmount: { $gt: 0 } })
      .populate('userId', 'name email')
      .sort({ updatedAt: -1 })
      .limit(2000)
      .lean(),
  ]);

  const completedByOrder = new Map<string, number>();
  for (const refund of refunds as any[]) {
    if (refund.status !== RefundStatus.COMPLETED) continue;
    const key = String(refund.orderId?._id || refund.orderId || '');
    completedByOrder.set(key, round2((completedByOrder.get(key) || 0) + (Number(refund.amount) || 0)));
  }

  const legacyPayments = ordersWithRefunds.length
    ? await Payment.find({ orderId: { $in: ordersWithRefunds.map((order: any) => order._id) } })
        .sort({ createdAt: 1 })
        .lean()
    : [];
  const paymentByOrder = new Map<string, any>();
  for (const payment of legacyPayments) {
    const key = String((payment as any).orderId);
    if (!paymentByOrder.has(key)) paymentByOrder.set(key, payment);
  }

  // Older refunds were stored only as order.refundAmount. If an order later
  // gets a transaction-ledger refund, keep the historical portion visible too.
  const legacy = ordersWithRefunds
    .map((order: any) => {
      const key = String(order._id);
      const alreadyRepresented = completedByOrder.get(key) || 0;
      const legacyAmount = round2((Number(order.refundAmount) || 0) - alreadyRepresented);
      if (legacyAmount <= 0.01) return null;
      return mapLegacyRefund(order, paymentByOrder.get(key), legacyAmount);
    })
    .filter((row): row is RefundRow => Boolean(row));

  return [...refunds.map(mapRefund), ...legacy].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function filterRows(
  rows: RefundRow[],
  opts: { status?: string; search?: string; from?: string; to?: string }
): RefundRow[] {
  const search = String(opts.search || '').trim().toLowerCase();
  const from = opts.from ? new Date(opts.from) : null;
  const to = opts.to ? new Date(opts.to) : null;
  if (to) to.setHours(23, 59, 59, 999);

  return rows.filter((row) => {
    if (opts.status && row.status !== opts.status) return false;
    const created = new Date(row.createdAt);
    if (from && created < from) return false;
    if (to && created > to) return false;
    if (!search) return true;
    return [row.orderNumber, row.customer, row.reference, row.razorpayRefundId, row.razorpayPaymentId, row.notes]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });
}

export const getRefunds = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const all = await loadAllRows();
    const rows = filterRows(all, {
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    const start = (page - 1) * limit;
    const paginated = rows.slice(start, start + limit);

    res.status(200).json({
      success: true,
      data: {
        refunds: paginated,
        pagination: {
          page,
          limit,
          total: rows.length,
          pages: Math.max(1, Math.ceil(rows.length / limit)),
        },
        summary: buildSummary(rows),
      },
    });
  } catch (error) {
    console.error('Get refunds error:', error);
    res.status(500).json({ error: 'Failed to load refunds' });
  }
};

export const getRefundSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await loadAllRows();
    res.status(200).json({ success: true, data: buildSummary(rows) });
  } catch (error) {
    console.error('Get refund summary error:', error);
    res.status(500).json({ error: 'Failed to load refund summary' });
  }
};

function buildSummary(rows: RefundRow[]) {
  const completed = rows.filter((r) => r.status === RefundStatus.COMPLETED);
  const processing = rows.filter((r) =>
    [RefundStatus.PENDING, RefundStatus.PROCESSING].includes(r.status as RefundStatus)
  );
  const failed = rows.filter((r) => r.status === RefundStatus.FAILED);
  const byStatus = Object.values(RefundStatus).map((status) => {
    const matching = rows.filter((r) => r.status === status);
    return {
      status,
      count: matching.length,
      amount: round2(matching.reduce((sum, r) => sum + r.amount, 0)),
    };
  });
  const byDestination = (['source', 'upi', 'bank'] as const).map((destination) => {
    const matching = rows.filter((r) => r.destination === destination);
    return {
      destination,
      count: matching.length,
      amount: round2(matching.reduce((sum, r) => sum + r.amount, 0)),
    };
  });

  return {
    count: rows.length,
    completedCount: completed.length,
    completedAmount: round2(completed.reduce((sum, r) => sum + r.amount, 0)),
    processingCount: processing.length,
    processingAmount: round2(processing.reduce((sum, r) => sum + r.amount, 0)),
    needsAction: processing.filter((r) => r.canComplete).length,
    failedCount: failed.length,
    failedAmount: round2(failed.reduce((sum, r) => sum + r.amount, 0)),
    byStatus,
    byDestination,
  };
}

export const getRefundableOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = String(req.query.search || '').trim();
    const query: any = {
      $or: [
        { paymentStatus: { $in: ['confirmed', 'partially_refunded', 'refunded'] } },
        { codAdvancePaid: { $gt: 0 } },
      ],
    };
    if (search) {
      query.$and = [
        {
          $or: [
            { orderNumber: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { 'shippingAddress.fullName': new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            { 'shippingAddress.phone': new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
          ],
        },
      ];
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ updatedAt: -1 })
      .limit(40)
      .lean();

    const rows = [];
    for (const order of orders) {
      try {
        const ctx = await getRefundContext(order);
        if (ctx.refundable <= 0 && !ctx.activeRefund) continue;
        rows.push({
          _id: String(order._id),
          orderNumber: order.orderNumber,
          customer: customerName(order.userId, order),
          total: round2(order.total),
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          createdAt: order.createdAt,
          collected: ctx.collected,
          refunded: ctx.refunded,
          refundable: ctx.refundable,
          online: ctx.online,
          mode: ctx.mode,
          activeRefund: ctx.activeRefund
            ? {
                _id: String(ctx.activeRefund._id),
                status: ctx.activeRefund.status,
                amount: ctx.activeRefund.amount,
              }
            : null,
          blocker: ctx.blocker,
        });
      } catch {
        /* skip malformed order */
      }
    }

    res.status(200).json({ success: true, data: { orders: rows } });
  } catch (error) {
    console.error('Get refundable orders error:', error);
    res.status(500).json({ error: 'Failed to load refundable orders' });
  }
};

export const getOrderRefundContext = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .lean();
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const ctx = await getRefundContext(order);
    const refunds = await Refund.find({ orderId: order._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        order: {
          _id: String(order._id),
          orderNumber: order.orderNumber,
          customer: customerName(order.userId, order),
          total: round2(order.total),
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          createdAt: order.createdAt,
          refundAmount: round2(order.refundAmount || 0),
          refundStatus: order.refundStatus || 'none',
        },
        context: {
          collected: ctx.collected,
          refunded: ctx.refunded,
          refundable: ctx.refundable,
          online: ctx.online,
          mode: ctx.mode,
          paymentId: ctx.paymentId,
          paymentMethod: order.paymentMethod,
          activeRefund: ctx.activeRefund
            ? {
                _id: String(ctx.activeRefund._id),
                status: ctx.activeRefund.status,
                amount: ctx.activeRefund.amount,
              }
            : null,
          canRefund: ctx.canRefund,
          blocker: ctx.blocker,
        },
        refunds: refunds.map(mapRefund),
      },
    });
  } catch (error) {
    if (error instanceof RefundError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    console.error('Get order refund context error:', error);
    res.status(500).json({ error: 'Failed to load refund context' });
  }
};

export const createRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      orderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      amount: Joi.number().min(0.01).optional(),
      notes: Joi.string().trim().max(500).required(),
      refundMethod: Joi.string().valid('source', 'upi', 'bank').default('source'),
      upiId: Joi.string().trim().max(100).optional().allow(''),
      bankAccountName: Joi.string().trim().max(100).optional().allow(''),
      bankAccountNumber: Joi.string().trim().max(30).optional().allow(''),
      bankIfsc: Joi.string().trim().max(11).uppercase().optional().allow(''),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }

    const result = await createOrderRefund({
      orderId: value.orderId,
      amount: value.amount,
      notes: value.notes,
      destination: value.refundMethod,
      upiId: value.upiId,
      bankAccountName: value.bankAccountName,
      bankAccountNumber: value.bankAccountNumber,
      bankIfsc: value.bankIfsc,
      adminId: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      message:
        result.mode === 'razorpay'
          ? result.refund?.status === 'completed'
            ? 'Refund processed via Razorpay'
            : 'Refund submitted to Razorpay — tracking until processed'
          : 'Manual refund recorded — mark it completed after settlement',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof RefundError) {
      res.status(error.status).json({ error: error.message, details: error.details });
      return;
    }
    console.error('Create refund error:', error);
    res.status(500).json({ error: 'Failed to create refund' });
  }
};

export const completeRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      reference: Joi.string().trim().max(100).required(),
      notes: Joi.string().trim().max(500).optional().allow(''),
      orderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }

    const result = await completeManualRefund({
      refundId: req.params.id,
      orderId: value.orderId,
      reference: value.reference,
      notes: value.notes,
      adminId: req.user?.userId,
    });

    res.status(200).json({
      success: true,
      message: result.alreadyCompleted ? 'Refund already completed' : 'Manual refund marked completed',
      data: result,
    });
  } catch (error: any) {
    if (error instanceof RefundError) {
      res.status(error.status).json({ error: error.message, details: error.details });
      return;
    }
    console.error('Complete refund error:', error);
    res.status(500).json({ error: 'Failed to complete refund' });
  }
};

export const getPaymentsOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [onlineAgg, failedCount, codAgg, orderPayStatusAgg, refundRows] = await Promise.all([
      Payment.aggregate([
        { $match: { status: { $in: ['captured', 'partially_refunded', 'refunded'] } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
            refunded: { $sum: { $ifNull: ['$refundAmount', 0] } },
          },
        },
      ]),
      Payment.countDocuments({ status: 'failed' }),
      Order.aggregate([
        { $match: { paymentMethod: 'cod' } },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            advancePaid: { $sum: { $ifNull: ['$codAdvancePaid', 0] } },
            balanceDue: { $sum: { $ifNull: ['$codBalance', 0] } },
            toCollect: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$paymentStatus', 'pending'] },
                      { $not: { $in: ['$status', ['cancelled', 'refunded']] } },
                    ],
                  },
                  { $ifNull: ['$codBalance', 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      ]),
      loadAllRows(),
    ]);

    const online = onlineAgg[0] || { count: 0, amount: 0, refunded: 0 };
    const cod = codAgg[0] || { orders: 0, advancePaid: 0, balanceDue: 0, toCollect: 0 };
    const orderPayStatus: Record<string, number> = {};
    for (const row of orderPayStatusAgg) orderPayStatus[row._id || 'unknown'] = row.count;
    const refunds = buildSummary(refundRows);

    res.status(200).json({
      success: true,
      data: {
        online: {
          capturedCount: online.count || 0,
          capturedAmount: round2(online.amount),
          refundedAmount: round2(online.refunded),
          netCollected: round2((online.amount || 0) - (online.refunded || 0)),
          failedCount,
        },
        cod: {
          orders: cod.orders || 0,
          toCollect: round2(cod.toCollect),
          advancePaid: round2(cod.advancePaid),
          balanceDue: round2(cod.balanceDue),
        },
        refunds,
        orders: {
          total: Object.values(orderPayStatus).reduce((sum, n) => sum + n, 0),
          confirmed: orderPayStatus.confirmed || 0,
          pending: orderPayStatus.pending || 0,
          partiallyRefunded: orderPayStatus.partially_refunded || 0,
          refunded: orderPayStatus.refunded || 0,
          failed: orderPayStatus.failed || 0,
        },
      },
    });
  } catch (error) {
    console.error('Payments overview error:', error);
    res.status(500).json({ error: 'Failed to load payments overview' });
  }
};
