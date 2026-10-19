import { Request, Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { Payment, RazorpayPaymentStatus } from '../models/Payment';
import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import { Settings } from '../models/Settings';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  refundRazorpayPayment,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from '../services/razorpay';
import { emitToUser, emitToAdmins } from '../config/socket';

async function getSettings() {
  let s = await Settings.findOne({ key: 'global' });
  if (!s) {
    const { DEFAULT_SETTINGS } = await import('../models/Settings');
    s = await Settings.create({ ...(DEFAULT_SETTINGS as object) });
  }
  return s;
}

// POST /api/payments/create-order { amount, purpose: full|cod_advance, orderId? }
export const createPaymentOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      amount: Joi.number().min(1).max(1000000).required(),
      purpose: Joi.string().valid('full', 'cod_advance').default('full'),
      orderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
      method: Joi.string().trim().max(30).optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!isRazorpayConfigured()) {
      res.status(503).json({ error: 'Razorpay not configured. Admin must set RAZORPAY_KEY_ID/SECRET in server/.env and enable in Settings.' });
      return;
    }
    let amount = value.amount;
    // If COD advance, recompute server-side to prevent tampering when orderId given
    if (value.orderId) {
      const order = await Order.findById(value.orderId);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      if (order.userId.toString() !== userId.toString()) {
        res.status(403).json({ error: 'Not your order' });
        return;
      }
      if (value.purpose === 'cod_advance') {
        const { getCODQuoteDetailed } = await import('../services/codRules');
        const quote = await getCODQuoteDetailed(order.total, {
          pincode: order.shippingAddress?.zip,
          userId: userId.toString(),
        });
        if (!quote.codAllowed || quote.advance <= 0) {
          res.status(400).json({ error: quote.codAllowed ? 'COD advance not required for this order' : quote.reason });
          return;
        }
        amount = quote.advance;
      } else {
        amount = order.total - (order.codAdvancePaid || 0);
      }
    }
    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const rpOrder = await createRazorpayOrder(amount, receipt, {
      userId: userId.toString(),
      purpose: value.purpose,
      orderId: value.orderId || '',
    });
    const payment = await Payment.create({
      userId: new mongoose.Types.ObjectId(userId),
      orderId: value.orderId ? new mongoose.Types.ObjectId(value.orderId) : undefined,
      amount,
      amountPaise: rpOrder.amount,
      currency: 'INR',
      razorpayOrderId: rpOrder.id,
      purpose: value.purpose,
      method: value.method,
      status: RazorpayPaymentStatus.CREATED,
    });
    res.status(201).json({
      success: true,
      data: {
        keyId: getRazorpayKeyId(),
        razorpayOrderId: rpOrder.id,
        amount,
        amountPaise: rpOrder.amount,
        currency: 'INR',
        paymentDocId: payment._id,
      },
    });
  } catch (err: any) {
    console.error('Create Razorpay order error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.description || 'Failed to create Razorpay order' });
  }
};

// POST /api/payments/verify { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId? }
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      razorpayOrderId: Joi.string().required(),
      razorpayPaymentId: Joi.string().required(),
      razorpaySignature: Joi.string().required(),
      orderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const valid = verifyRazorpaySignature(value.razorpayOrderId, value.razorpayPaymentId, value.razorpaySignature);
    if (!valid) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: value.razorpayOrderId },
        { status: RazorpayPaymentStatus.FAILED, razorpayPaymentId: value.razorpayPaymentId }
      );
      res.status(400).json({ error: 'Invalid payment signature' });
      return;
    }
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: value.razorpayOrderId },
      {
        razorpayPaymentId: value.razorpayPaymentId,
        razorpaySignature: value.razorpaySignature,
        status: RazorpayPaymentStatus.CAPTURED,
      },
      { new: true }
    );
    if (value.orderId && payment) {
      const order = await Order.findById(value.orderId);
      // Idempotency: retried verify for an already-captured payment is a no-op.
      if (order && (order as any).razorpayPaymentId === value.razorpayPaymentId) {
        const dup = await Payment.findOne({ razorpayPaymentId: value.razorpayPaymentId, status: RazorpayPaymentStatus.CAPTURED });
        if (dup) {
          res.status(200).json({ success: true, message: 'Payment already verified', data: dup });
          return;
        }
      }
      if (order) {
        (order as any).razorpayOrderId = value.razorpayOrderId;
        (order as any).razorpayPaymentId = value.razorpayPaymentId;
        if (payment.purpose === 'cod_advance') {
          (order as any).codAdvancePaid = payment.amount;
          (order as any).codBalance = Math.max(0, order.total - payment.amount);
          order.paymentMethod = 'cod';
          order.paymentStatus = PaymentStatus.PENDING; // balance due on delivery
          order.status = OrderStatus.PROCESSING;
        } else {
          order.paymentMethod = (payment.method as string) || 'razorpay';
          if ((order as any).paymentMethod === 'razorpay' || !(order as any).paymentMethod) {
            (order as any).paymentMethod = 'razorpay';
          }
          order.paymentStatus = PaymentStatus.CONFIRMED;
          order.status = OrderStatus.PROCESSING;
          (order as any).razorpayPaymentId = value.razorpayPaymentId;
        }
        await order.save();
        emitToUser(order.userId.toString(), 'paymentConfirmed', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          purpose: payment.purpose,
          amount: payment.amount,
        });
        emitToAdmins('paymentReceived', { orderId: order._id.toString(), orderNumber: order.orderNumber, amount: payment.amount });
        // WhatsApp: order confirmed / COD advance paid (fire-and-forget)
        try {
          const { User } = await import('../models/User');
          const { notifyOrderWhatsApp } = await import('../services/whatsapp');
          const buyer: any = await User.findById(order.userId).select('phone').lean();
          if (buyer?.phone) {
            if (payment.purpose === 'cod_advance') {
              notifyOrderWhatsApp(buyer.phone, 'cod_advance_paid', { orderNumber: order.orderNumber, advance: `₹${payment.amount}`, balance: `₹${(order as any).codBalance || 0}` }).catch(() => {});
            } else {
              notifyOrderWhatsApp(buyer.phone, 'order_confirmed', { orderNumber: order.orderNumber, total: `₹${order.total}` }).catch(() => {});
            }
          }
        } catch { /* notifications optional */ }
      }
    }
    res.status(200).json({ success: true, message: 'Payment verified', data: payment });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/webhooks/razorpay — raw body signature check
export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const { verifyWebhookSignature } = await import('../services/razorpay');
    // express.raw() gives Buffer in req.body; express.json() gives object.
    let raw: string;
    let parsed: any = req.body;
    if (Buffer.isBuffer(req.body)) {
      raw = req.body.toString('utf8');
      try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    } else if ((req as any).rawBody) {
      raw = (req as any).rawBody.toString();
    } else if (typeof req.body === 'string') {
      raw = req.body;
      try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    } else {
      raw = JSON.stringify(req.body || {});
    }
    // Fail closed: without a configured secret we cannot authenticate the
    // sender, so nothing is applied (previously unsigned events were trusted).
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      res.status(400).json({ error: 'Webhook secret not configured' });
      return;
    }
    const ok = verifyWebhookSignature(raw, signature);
    if (!ok) {
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }
    const event = parsed?.event;
    const paymentEntity = parsed?.payload?.payment?.entity;
    // Order entity is the fallback link when verify never ran (no paymentId stored yet).
    const orderEntity = parsed?.payload?.order?.entity;

    // Shared, idempotent order sync — mirrors verifyPayment so a webhook-only
    // payment still confirms the order. Safe to repeat after verify.
    const syncOrderCaptured = async (ledger: any, gatewayPaymentId: string) => {
      if (!ledger) return;
      const order = ledger.orderId
        ? await Order.findById(ledger.orderId)
        : ledger.razorpayOrderId
          ? await Order.findOne({ razorpayOrderId: ledger.razorpayOrderId })
          : null;
      if (!order) return;
      // Never downgrade an already-settled order.
      if ((order as any).razorpayPaymentId === gatewayPaymentId && order.paymentStatus === PaymentStatus.CONFIRMED) return;
      (order as any).razorpayPaymentId = gatewayPaymentId;
      if (ledger.razorpayOrderId) (order as any).razorpayOrderId = ledger.razorpayOrderId;
      if (ledger.purpose === 'cod_advance') {
        (order as any).codAdvancePaid = ledger.amount;
        (order as any).codBalance = Math.max(0, order.total - ledger.amount);
        order.paymentMethod = 'cod';
        order.paymentStatus = PaymentStatus.PENDING; // balance due on delivery
        order.status = OrderStatus.PROCESSING;
      } else {
        if (!order.paymentMethod || order.paymentMethod === 'razorpay') order.paymentMethod = ledger.method || 'razorpay';
        order.paymentStatus = PaymentStatus.CONFIRMED;
        order.status = OrderStatus.PROCESSING;
      }
      await order.save();
      emitToUser(order.userId.toString(), 'paymentConfirmed', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        purpose: ledger.purpose,
        amount: ledger.amount,
      });
    };

    if (event === 'payment.captured' && paymentEntity) {
      let ledger = await Payment.findOneAndUpdate(
        { razorpayPaymentId: paymentEntity.id },
        { status: RazorpayPaymentStatus.CAPTURED, rawPayload: parsed },
        { new: true }
      );
      if (!ledger && orderEntity?.id) {
        // verify never ran: attach the gateway payment to our created doc.
        ledger = await Payment.findOneAndUpdate(
          { razorpayOrderId: orderEntity.id },
          { razorpayPaymentId: paymentEntity.id, status: RazorpayPaymentStatus.CAPTURED, rawPayload: parsed },
          { new: true }
        );
      }
      await syncOrderCaptured(ledger, paymentEntity.id);
    } else if (event === 'payment.failed' && paymentEntity) {
      const ledger = await Payment.findOneAndUpdate(
        { razorpayPaymentId: paymentEntity.id },
        { status: RazorpayPaymentStatus.FAILED, rawPayload: parsed },
        { new: true }
      );
      // Only ever downgrade PENDING orders — never touch confirmed money.
      const order = ledger?.orderId ? await Order.findById(ledger.orderId) : null;
      if (order && order.paymentStatus === PaymentStatus.PENDING) {
        order.paymentStatus = PaymentStatus.FAILED;
        await order.save();
      }
    } else if (event?.startsWith('refund.') && parsed?.payload?.refund?.entity) {
      const r = parsed.payload.refund.entity;
      const full = r.amount === r.payment_amount;
      const ledger = await Payment.findOneAndUpdate(
        { razorpayPaymentId: r.payment_id },
        { status: full ? RazorpayPaymentStatus.REFUNDED : RazorpayPaymentStatus.PARTIALLY_REFUNDED, refundId: r.id, refundAmount: r.amount / 100 },
        { new: true }
      );
      const order = ledger?.orderId ? await Order.findById(ledger.orderId) : null;
      if (order && order.paymentStatus !== PaymentStatus.REFUNDED) {
        order.paymentStatus = full ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED;
        if (full) order.status = OrderStatus.REFUNDED;
        (order as any).refundAmount = r.amount / 100;
        await order.save();
      }
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
};

// POST /api/payments/refund { orderId, amount? } — Admin
export const refundPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      orderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      amount: Joi.number().min(1).optional(),
      notes: Joi.string().max(500).optional().allow(''),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const order = await Order.findById(value.orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const rpPaymentId = (order as any).razorpayPaymentId;
    if (!rpPaymentId) {
      // Manual/COD order — mark refunded in DB only (partial keeps order alive)
      const amt = value.amount || order.total;
      const isPartial = amt < order.total;
      order.paymentStatus = isPartial ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED;
      if (!isPartial) order.status = OrderStatus.REFUNDED;
      (order as any).refundAmount = amt;
      (order as any).refundNotes = value.notes;
      await order.save();
      res.status(200).json({ success: true, message: isPartial ? 'Partial refund recorded (no Razorpay payment found)' : 'Order marked refunded (no Razorpay payment found)', data: order });
      return;
    }
    const refund = await refundRazorpayPayment(rpPaymentId, value.amount);
    const amt = value.amount || order.total;
    const isPartial = amt < order.total;
    order.paymentStatus = isPartial ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED;
    if (!isPartial) order.status = OrderStatus.REFUNDED;
    (order as any).refundAmount = amt;
    await order.save();
    try {
      const { Payment } = await import('../models/Payment');
      const payment: any = await Payment.findOne({ razorpayPaymentId: rpPaymentId });
      if (payment) {
        const rf: any = refund;
        payment.refundId = String(rf.id || rf.refund_id || '');
        payment.refundAmount = amt;
        payment.status = isPartial ? 'partially_refunded' : 'refunded';
        await payment.save().catch(() => {});
      }
    } catch { /* ledger optional */ }
    res.status(200).json({ success: true, message: isPartial ? 'Partial refund processed via Razorpay' : 'Refund processed via Razorpay', data: { order, refund } });
  } catch (err: any) {
    console.error('Refund error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Refund failed' });
  }
};

// GET /api/payments/methods — what checkout should show (from Settings)
export const getPaymentMethods = async (_req: Request, res: Response): Promise<void> => {
  const s = await getSettings();
  res.status(200).json({
    success: true,
    data: {
      ...s.payments,
      razorpayConfigured: isRazorpayConfigured(),
      cod: {
        enabled: s.payments.codEnabled && s.codConfirmation.enabled,
        defaultAmount: s.codConfirmation.defaultAmount,
        fixedOptions: s.codConfirmation.fixedOptions,
        mode: s.codConfirmation.mode,
      },
    },
  });
};

// GET /api/payments/ledger — Admin: full Razorpay Payment ledger with order join
export const getPaymentsLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const status = req.query.status as string | undefined;
    const purpose = req.query.purpose as string | undefined;
    const search = (req.query.search as string) || '';

    const filter: any = {};
    if (status && Object.values(RazorpayPaymentStatus).includes(status as any)) filter.status = status;
    if (purpose === 'full' || purpose === 'cod_advance') filter.purpose = purpose;
    if (search) {
      filter.$or = [
        { razorpayOrderId: new RegExp(search, 'i') },
        { razorpayPaymentId: new RegExp(search, 'i') },
        { orderNumber: new RegExp(search.toUpperCase(), 'i') },
      ];
    }

    const [rows, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('orderId', 'orderNumber total status paymentStatus paymentMethod').lean(),
      Payment.countDocuments(filter),
    ]);

    const summaryAgg = await Payment.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]);
    const purposeAgg = await Payment.aggregate([
      { $match: filter },
      { $group: { _id: '$purpose', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: { payments: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) }, summary: { byStatus: summaryAgg, byPurpose: purposeAgg } },
    });
  } catch (err) {
    console.error('Ledger error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/payments/orders-summary — Admin: prepaid vs COD vs advances KPIs from Orders
export const getOrdersPaymentSummary = async (_req: Request, res: Response): Promise<void> => {
  try {
    const byMethod = await Order.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$total' }, advancePaid: { $sum: { $ifNull: ['$codAdvancePaid', 0] } }, balanceDue: { $sum: { $ifNull: ['$codBalance', 0] } } } },
    ]);
    const byPayStatus = await Order.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$total' } } },
    ]);
    res.status(200).json({ success: true, data: { byMethod, byPayStatus } });
  } catch (err) {
    console.error('Orders payment summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ---- Guest payments (no login; phone must match the order's buyer phone) ----

async function getOrderBuyerPhone(order: any): Promise<string | null> {
  const { User } = await import('../models/User');
  const buyer: any = await User.findById(order.userId).select('phone').lean();
  return buyer?.phone || null;
}

async function assertGuestOwnership(orderId: string, phone: string) {
  const { normalizePhone } = await import('../models/OtpCode');
  const clean = normalizePhone(phone);
  if (!clean) return { error: 'Enter a valid 10-digit Indian mobile number' };
  const order = await Order.findById(orderId);
  if (!order) return { error: 'Order not found', status: 404 };
  const buyerPhone = await getOrderBuyerPhone(order);
  if (!buyerPhone || buyerPhone !== clean) return { error: 'Mobile number does not match this order', status: 403 };
  return { order, phone: clean };
}

// POST /api/payments/guest-create-order { orderId, phone, purpose? }
export const guestCreatePaymentOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      orderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      phone: Joi.string().trim().required().max(20),
      purpose: Joi.string().valid('full', 'cod_advance').default('full'),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    if (!isRazorpayConfigured()) {
      res.status(503).json({ error: 'Online payments are temporarily unavailable. Choose COD.' });
      return;
    }
    const own: any = await assertGuestOwnership(value.orderId, value.phone);
    if (own.error) {
      res.status(own.status || 400).json({ error: own.error });
      return;
    }
    let amount: number;
    if (value.purpose === 'cod_advance') {
      const { getCODQuoteDetailed } = await import('../services/codRules');
      const quote = await getCODQuoteDetailed(own.order.total, {
        pincode: own.order.shippingAddress?.zip,
        userId: own.order.userId.toString(),
      });
      if (!quote.codAllowed || quote.advance <= 0) {
        res.status(400).json({ error: quote.codAllowed ? 'COD advance not required for this order' : quote.reason });
        return;
      }
      amount = quote.advance;
    } else {
      amount = own.order.total - ((own.order as any).codAdvancePaid || 0);
    }
    const receipt = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const rpOrder = await createRazorpayOrder(amount, receipt, { purpose: value.purpose, orderId: value.orderId, guest: '1' });
    const payment = await Payment.create({
      userId: own.order.userId,
      orderId: own.order._id,
      amount,
      amountPaise: rpOrder.amount,
      currency: 'INR',
      razorpayOrderId: rpOrder.id,
      purpose: value.purpose,
      status: RazorpayPaymentStatus.CREATED,
    });
    res.status(201).json({
      success: true,
      data: { keyId: getRazorpayKeyId(), razorpayOrderId: rpOrder.id, amount, amountPaise: rpOrder.amount, currency: 'INR', paymentDocId: payment._id },
    });
  } catch (err: any) {
    console.error('Guest create Razorpay order error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};

// POST /api/payments/guest-verify { orderId, phone, razorpayOrderId, razorpayPaymentId, razorpaySignature }
export const guestVerifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      orderId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
      phone: Joi.string().trim().required().max(20),
      razorpayOrderId: Joi.string().required(),
      razorpayPaymentId: Joi.string().required(),
      razorpaySignature: Joi.string().required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const own: any = await assertGuestOwnership(value.orderId, value.phone);
    if (own.error) {
      res.status(own.status || 400).json({ error: own.error });
      return;
    }
    if (!verifyRazorpaySignature(value.razorpayOrderId, value.razorpayPaymentId, value.razorpaySignature)) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: value.razorpayOrderId },
        { status: RazorpayPaymentStatus.FAILED, razorpayPaymentId: value.razorpayPaymentId }
      );
      res.status(400).json({ error: 'Invalid payment signature' });
      return;
    }
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: value.razorpayOrderId },
      { razorpayPaymentId: value.razorpayPaymentId, razorpaySignature: value.razorpaySignature, status: RazorpayPaymentStatus.CAPTURED },
      { new: true }
    );
    const order = own.order;
    // Idempotency: a retried verify for an already-captured payment is a no-op.
    const alreadyDone = await Payment.findOne({ razorpayPaymentId: value.razorpayPaymentId, status: RazorpayPaymentStatus.CAPTURED });
    if (alreadyDone && (order as any).razorpayPaymentId === value.razorpayPaymentId) {
      res.status(200).json({ success: true, message: 'Payment already verified', data: alreadyDone });
      return;
    }
    (order as any).razorpayOrderId = value.razorpayOrderId;
    (order as any).razorpayPaymentId = value.razorpayPaymentId;
    if (payment && payment.purpose === 'cod_advance') {
      (order as any).codAdvancePaid = payment.amount;
      (order as any).codBalance = Math.max(0, order.total - payment.amount);
      order.paymentMethod = 'cod';
      order.paymentStatus = PaymentStatus.PENDING;
      order.status = OrderStatus.PROCESSING;
    } else {
      if (!['upi', 'card', 'netbanking', 'wallet'].includes(order.paymentMethod)) order.paymentMethod = 'razorpay';
      order.paymentStatus = PaymentStatus.CONFIRMED;
      order.status = OrderStatus.PROCESSING;
    }
    await order.save();
    emitToUser(order.userId.toString(), 'paymentConfirmed', { orderId: order._id.toString(), orderNumber: order.orderNumber });
    emitToAdmins('paymentReceived', { orderId: order._id.toString(), orderNumber: order.orderNumber, amount: payment?.amount });
    // Parity with logged-in verify: WhatsApp + Shiprocket auto-push.
    try {
      const { User } = await import('../models/User');
      const { notifyOrderWhatsApp } = await import('../services/whatsapp');
      const buyer: any = await User.findById(order.userId).select('phone').lean();
      if (buyer?.phone) {
        if (payment?.purpose === 'cod_advance') {
          notifyOrderWhatsApp(buyer.phone, 'cod_advance_paid', { orderNumber: order.orderNumber, advance: `₹${payment.amount}`, balance: `₹${(order as any).codBalance || 0}` }).catch(() => {});
        } else {
          notifyOrderWhatsApp(buyer.phone, 'order_confirmed', { orderNumber: order.orderNumber, total: `₹${order.total}` }).catch(() => {});
        }
      }
    } catch { /* notifications optional */ }
    try {
      const { tryAutoShipToShiprocket } = await import('./orderController');
      tryAutoShipToShiprocket(order._id.toString()).catch(() => {});
    } catch { /* shipping optional */ }
    res.status(200).json({ success: true, message: 'Payment verified', data: payment });
  } catch (err) {
    console.error('Guest verify payment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
