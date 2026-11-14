import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import { Payment } from '../models/Payment';
import { Refund, RefundStatus, type RefundDestination } from '../models/Refund';
import { AuditAction, AuditLog } from '../models/AuditLog';
import { emitToAdmins, emitToUser } from '../config/socket';
import { isValidBankDestination, isValidUpiId } from '../utils/refundValidation';
import { refundRazorpayPayment } from './razorpay';

const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;
const capturedStatuses = ['captured', 'partially_refunded', 'refunded'];

export class RefundError extends Error {
  status: number;
  details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.name = 'RefundError';
    this.status = status;
    this.details = details;
  }
}

export interface RefundContext {
  order: any;
  payments: any[];
  payment: any | null;
  collected: number;
  refunded: number;
  refundable: number;
  online: boolean;
  paymentId?: string;
  mode: 'razorpay' | 'manual';
  activeRefund: any | null;
  canRefund: boolean;
  blocker?: string;
}

export interface CreateRefundInput {
  orderId: string;
  amount?: number;
  notes: string;
  destination?: RefundDestination;
  upiId?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  adminId?: string;
}

/**
 * Work out how much money was actually collected for an order. This is
 * deliberately more conservative than "order total": refunding a ₹948 COD
 * order must never pay out ₹948 when only the ₹99 advance was collected.
 */
export async function getRefundContext(orderOrId: string | any): Promise<RefundContext> {
  const order =
    typeof orderOrId === 'string'
      ? await Order.findById(orderOrId).populate('userId', 'name email phone')
      : orderOrId;

  if (!order) throw new RefundError(404, 'Order not found');

  const orderId = order._id;
  const [payments, refundDocs] = await Promise.all([
    Payment.find({ orderId }).sort({ createdAt: 1 }).lean(),
    Refund.find({ orderId, status: { $in: [RefundStatus.PENDING, RefundStatus.PROCESSING, RefundStatus.COMPLETED] } })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const capturedPayments = payments.filter((p: any) => capturedStatuses.includes(String(p.status)));
  const capturedFromPayments = round2(
    capturedPayments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
  );
  const onlinePayment =
    capturedPayments.find((p: any) => Boolean(p.razorpayPaymentId)) ||
    (order.razorpayPaymentId
      ? capturedPayments.find((p: any) => p.razorpayPaymentId === order.razorpayPaymentId) || null
      : null);
  const paymentId = onlinePayment?.razorpayPaymentId || order.razorpayPaymentId || undefined;
  const online = Boolean(paymentId);

  const legacyRefunded = round2(Number(order.refundAmount) || 0);
  const docsRefunded = round2(
    refundDocs.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0)
  );
  const refunded = round2(Math.max(legacyRefunded, docsRefunded));
  // A completed refund remembers how much was collected when it was requested.
  // This keeps the refundable calculation stable even after the order's
  // paymentStatus changes from confirmed -> partially_refunded.
  const docsCollected = round2(
    refundDocs.reduce((max: number, r: any) => Math.max(max, Number(r.collectedAtRequest) || 0), 0)
  );

  const isCod = String(order.paymentMethod || '').toLowerCase() === 'cod';
  let collected = capturedFromPayments;

  if (isCod) {
    if (order.paymentStatus === PaymentStatus.CONFIRMED) {
      // COD confirmed means the balance was collected on delivery.
      collected = Math.max(capturedFromPayments, round2(Number(order.total) || 0), docsCollected);
    } else if (docsCollected > 0) {
      collected = Math.max(capturedFromPayments, round2(Number(order.codAdvancePaid) || 0), docsCollected);
    } else if (legacyRefunded >= Number(order.total || 0) - 0.01) {
      // Historical full-COD refunds may not have a Payment ledger row.
      collected = round2(Number(order.total) || 0);
    } else {
      collected = Math.max(capturedFromPayments, round2(Number(order.codAdvancePaid) || 0));
    }
  } else if (capturedFromPayments <= 0) {
    if (
      [PaymentStatus.CONFIRMED, PaymentStatus.PARTIALLY_REFUNDED, PaymentStatus.REFUNDED].includes(
        order.paymentStatus as PaymentStatus
      )
    ) {
      collected = Math.max(round2(Number(order.total) || 0), docsCollected);
    }
  } else {
    collected = Math.max(capturedFromPayments, docsCollected);
  }

  const refundable = round2(Math.max(0, collected - refunded));
  const activeRefund =
    refundDocs.find((r: any) => [RefundStatus.PENDING, RefundStatus.PROCESSING].includes(r.status)) || null;

  let blocker: string | undefined;
  if (activeRefund) blocker = 'A refund is already in progress for this order';
  else if (collected <= 0) blocker = 'No money has been collected for this order';
  else if (refundable <= 0) blocker = 'There is no refundable balance left';

  return {
    order,
    payments,
    payment: onlinePayment || capturedPayments[capturedPayments.length - 1] || null,
    collected,
    refunded,
    refundable,
    online,
    paymentId,
    mode: online ? 'razorpay' : 'manual',
    activeRefund,
    canRefund: !activeRefund && refundable > 0.009,
    blocker,
  };
}

function destinationFields(input: CreateRefundInput, online: boolean) {
  const destination: RefundDestination = online ? 'source' : input.destination || 'source';

  if (!online && destination === 'upi' && !isValidUpiId(input.upiId)) {
    throw new RefundError(400, 'Enter a valid UPI ID (for example name@okbank)');
  }
  if (
    !online &&
    destination === 'bank' &&
    !isValidBankDestination({
      bankAccountName: input.bankAccountName,
      bankAccountNumber: input.bankAccountNumber,
      bankIfsc: input.bankIfsc,
    })
  ) {
    throw new RefundError(400, 'Bank account name, account number and a valid IFSC are required');
  }

  return {
    destination,
    upiId: destination === 'upi' ? input.upiId?.trim() : undefined,
    bankAccountName: destination === 'bank' ? input.bankAccountName?.trim() : undefined,
    bankAccountNumber: destination === 'bank' ? input.bankAccountNumber?.trim() : undefined,
    bankIfsc: destination === 'bank' ? input.bankIfsc?.trim().toUpperCase() : undefined,
  };
}

/**
 * Create a refund. Online money is sent to Razorpay first. Manual payouts are
 * recorded as `processing` and only hit order/payment aggregates when an admin
 * confirms settlement.
 */
export async function createOrderRefund(input: CreateRefundInput) {
  const order = await Order.findById(input.orderId).populate('userId', 'name email phone');
  if (!order) throw new RefundError(404, 'Order not found');

  const ctx = await getRefundContext(order);
  if (ctx.activeRefund) {
    throw new RefundError(409, 'A refund is already in progress for this order', {
      refundId: ctx.activeRefund._id,
    });
  }
  if (ctx.collected <= 0) {
    throw new RefundError(400, 'No money has been collected for this order, so it cannot be refunded');
  }

  const amount = round2(input.amount === undefined ? ctx.refundable : Number(input.amount));
  if (amount <= 0) throw new RefundError(400, 'Refund amount must be greater than zero');
  if (amount > ctx.refundable + 0.009) {
    throw new RefundError(400, `Maximum refundable amount is ₹${ctx.refundable.toFixed(2)}`, {
      refundable: ctx.refundable,
      collected: ctx.collected,
      refunded: ctx.refunded,
    });
  }

  const notes = String(input.notes || '').trim();
  if (!notes) throw new RefundError(400, 'Refund notes are required for audit');

  const dest = destinationFields({ ...input, amount, notes }, ctx.online);
  const mode = ctx.online ? 'razorpay' : 'manual';

  let refund: any;
  try {
    refund = await Refund.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: (order.userId as any)?._id || order.userId,
      paymentId: ctx.payment?._id,
      razorpayPaymentId: ctx.paymentId,
      amount,
      currency: 'INR',
      status: RefundStatus.PENDING,
      destination: dest.destination,
      upiId: dest.upiId,
      bankAccountName: dest.bankAccountName,
      bankAccountNumber: dest.bankAccountNumber,
      bankIfsc: dest.bankIfsc,
      notes,
      requestedBy: input.adminId,
      collectedAtRequest: ctx.collected,
      refundedBefore: ctx.refunded,
      refundedAfter: round2(ctx.refunded + amount),
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new RefundError(409, 'A refund is already in progress for this order');
    }
    throw error;
  }

  if (ctx.online && ctx.paymentId) {
    try {
      const provider: any = await refundRazorpayPayment(ctx.paymentId, amount);
      const providerStatus = String(provider?.status || '').toLowerCase();
      const completed = providerStatus === 'processed' || providerStatus === 'completed';
      const reference = String(provider?.id || provider?.refund_id || '');

      refund.razorpayRefundId = reference || undefined;
      refund.providerStatus = providerStatus || 'pending';
      refund.providerResponse = provider;
      refund.reference = reference || undefined;
      refund.status = completed ? RefundStatus.COMPLETED : RefundStatus.PROCESSING;
      if (completed) refund.completedAt = new Date();
      await refund.save();

      if (completed) {
        await applyRefundRecord(refund);
      } else {
        await markOrderRefundProcessing(refund);
      }

      return { refund: await Refund.findById(refund._id).lean(), context: ctx, mode, provider };
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.description ||
        error?.response?.data?.error?.reason ||
        error?.message ||
        'Razorpay refund failed';
      refund.status = RefundStatus.FAILED;
      refund.failureReason = String(message).slice(0, 500);
      refund.providerResponse = error?.response?.data || undefined;
      await refund.save().catch(() => {});
      await markOrderRefundFailed(refund).catch(() => {});
      throw new RefundError(502, 'Razorpay refund failed — no local refund was applied. Safe to retry.', {
        refundId: refund._id,
        reason: message,
      });
    }
  }

  refund.status = RefundStatus.PROCESSING;
  await refund.save();
  await markOrderRefundProcessing(refund);
  return { refund: await Refund.findById(refund._id).lean(), context: ctx, mode, provider: null };
}

async function markOrderRefundProcessing(refund: any) {
  const order = await Order.findById(refund.orderId).populate('userId', 'name email phone');
  if (!order) return;

  const wasProcessing = order.refundStatus === 'processing';
  order.refundStatus = 'processing';
  order.refundMethod = refund.destination;
  order.refundUpiId = refund.upiId;
  order.refundBankName = refund.bankAccountName;
  order.refundBankAccount = refund.bankAccountNumber;
  order.refundBankIfsc = refund.bankIfsc;
  order.refundNotes = refund.notes;

  if (!wasProcessing) {
    order.timeline.push({
      event: 'Refund processing',
      description:
        (refund.destination === 'source'
          ? `₹${refund.amount.toFixed(2)} refund submitted to the original payment source${refund.razorpayRefundId ? ` (${refund.razorpayRefundId})` : ''}.`
          : `₹${refund.amount.toFixed(2)} manual refund queued via ${
              refund.destination === 'upi' ? `UPI ${refund.upiId || ''}` : `bank ${refund.bankAccountNumber || ''}`
            }. Mark it completed after settlement.`
        ).slice(0, 500),
      type: 'payment',
      metadata: { amount: refund.amount, mode: refund.destination === 'source' ? 'razorpay' : 'manual', refundId: refund._id },
      createdAt: new Date(),
    } as any);
  }

  await order.save();
  emitToAdmins('refundProcessing', {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    refundId: refund._id.toString(),
    amount: refund.amount,
    destination: refund.destination,
  });
  const userId = (order.userId as any)?._id?.toString?.() || order.userId?.toString?.();
  if (userId) {
    emitToUser(userId, 'orderRefundProcessing', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      refundAmount: refund.amount,
      timestamp: new Date(),
    });
  }
}

async function markOrderRefundFailed(refund: any) {
  const order = await Order.findById(refund.orderId);
  if (!order) return;
  const [activeOther, completed] = await Promise.all([
    Refund.countDocuments({
      orderId: refund.orderId,
      _id: { $ne: refund._id },
      status: { $in: [RefundStatus.PENDING, RefundStatus.PROCESSING] },
    }),
    Refund.countDocuments({ orderId: refund.orderId, status: RefundStatus.COMPLETED }),
  ]);
  if (!activeOther && completed === 0) order.refundStatus = 'none';
  order.timeline.push({
    event: 'Refund failed',
    description: `Refund of ₹${refund.amount.toFixed(2)} failed: ${String(refund.failureReason || 'provider declined').slice(0, 300)}`.slice(0, 500),
    type: 'payment',
    metadata: { amount: refund.amount, refundId: refund._id, status: 'failed' },
    createdAt: new Date(),
  } as any);
  await order.save();
  emitToAdmins('refundFailed', {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    refundId: refund._id.toString(),
    amount: refund.amount,
    reason: refund.failureReason,
  });
}

/**
 * Apply a completed refund to the order/payment aggregates exactly once.
 */
export async function applyRefundRecord(refund: any) {
  if (!refund) return null;
  if (refund.orderAppliedAt && refund.ledgerAppliedAt) {
    if (refund.status !== RefundStatus.COMPLETED) {
      refund.status = RefundStatus.COMPLETED;
      refund.completedAt = refund.completedAt || new Date();
      await refund.save().catch(() => {});
    }
    return refund;
  }

  const order = await Order.findById(refund.orderId).populate('userId', 'name email phone');
  if (!order) throw new RefundError(404, 'Order not found');

  const amount = round2(Number(refund.amount) || 0);
  if (amount <= 0) throw new RefundError(400, 'Refund amount must be greater than zero');

  const previous = round2(
    Math.max(Number(order.refundAmount) || 0, Number(refund.refundedBefore) || 0)
  );
  const nextRefunded = round2(previous + amount);
  const collected = round2(Number(refund.collectedAtRequest) || 0);
  const orderTotal = round2(Number(order.total) || 0);
  const oldStatus = order.status;
  const now = new Date();

  order.refundAmount = nextRefunded;
  order.refundStatus = 'completed';
  order.refundCompletedAt = now;
  order.refundReference = refund.reference || refund.razorpayRefundId;
  order.refundMethod = refund.destination;
  order.refundUpiId = refund.upiId;
  order.refundBankName = refund.bankAccountName;
  order.refundBankAccount = refund.bankAccountNumber;
  order.refundBankIfsc = refund.bankIfsc;
  order.refundNotes = refund.notes;
  order.paymentStatus =
    collected > 0 && nextRefunded >= collected - 0.01
      ? PaymentStatus.REFUNDED
      : PaymentStatus.PARTIALLY_REFUNDED;
  if (nextRefunded >= orderTotal - 0.01) order.status = OrderStatus.REFUNDED;

  order.timeline.push({
    event: 'Refund completed',
    description:
      (refund.destination === 'source'
        ? `₹${amount.toFixed(2)} refunded to the original payment source${refund.razorpayRefundId ? ` (${refund.razorpayRefundId})` : ''}.`
        : `₹${amount.toFixed(2)} manual refund completed via ${
            refund.destination === 'upi' ? `UPI ${refund.upiId || ''}` : `bank ${refund.bankAccountNumber || ''}`
          }${refund.reference ? `. Ref: ${refund.reference}` : ''}.`
      ).slice(0, 500),
    type: 'payment',
    metadata: {
      amount,
      mode: refund.destination === 'source' ? 'razorpay' : 'manual',
      refundId: refund._id,
      reference: refund.reference || refund.razorpayRefundId,
    },
    createdAt: now,
  } as any);

  // Return stock once, and only when the entire order value has been refunded.
  // A cancelled order already restored stock during cancellation.
  if (
    nextRefunded >= orderTotal - 0.01 &&
    !order.refundStockRestored &&
    oldStatus !== OrderStatus.CANCELLED &&
    oldStatus !== OrderStatus.REFUNDED
  ) {
    try {
      const { restoreStockForOrder } = await import('../utils/stock');
      const { Product } = await import('../models/Product');
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) await restoreStockForOrder(product, item.variations, item.quantity);
      }
      order.refundStockRestored = true;
    } catch (error) {
      console.error('Refund stock restore failed:', error);
    }
  }

  await order.save();

  // Payment ledger aggregation. Keep the latest refund id but never overwrite
  // the cumulative amount with only the newest refund.
  try {
    const payment: any =
      (refund.paymentId && (await Payment.findById(refund.paymentId))) ||
      (refund.razorpayPaymentId &&
        (await Payment.findOne({ razorpayPaymentId: refund.razorpayPaymentId }))) ||
      (await Payment.findOne({ orderId: order._id, status: { $in: capturedStatuses } }).sort({ createdAt: -1 }));
    if (payment && !refund.ledgerAppliedAt) {
      payment.refundAmount = round2((Number(payment.refundAmount) || 0) + amount);
      payment.refundId = refund.razorpayRefundId || refund.reference || payment.refundId;
      payment.status =
        payment.refundAmount >= round2(Number(payment.amount) || 0) - 0.01
          ? 'refunded'
          : 'partially_refunded';
      await payment.save();
      refund.ledgerAppliedAt = now;
    }
  } catch (error) {
    console.error('Refund payment ledger update failed:', error);
  }

  const userId = (order.userId as any)?._id?.toString?.() || order.userId?.toString?.();

  if (!refund.effectsAppliedAt) {
    try {
      const { revokePointsForOrder } = await import('../controllers/loyaltyController');
      if (nextRefunded >= orderTotal - 0.01) {
        await revokePointsForOrder(order._id.toString(), userId || '');
      }
    } catch {
      /* loyalty is best-effort */
    }

    if (userId) {
      emitToUser(userId, 'orderRefunded', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        refundAmount: amount,
        totalRefunded: nextRefunded,
        refundMode: refund.destination === 'source' ? 'razorpay' : 'manual',
        timestamp: now,
      });
      emitToUser(userId, 'orderStatusUpdate', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus: order.status,
        timestamp: now,
      });
    }

    try {
      const { notifyOrderWhatsApp } = await import('../services/whatsapp');
      const buyerPhone = (order.userId as any)?.phone;
      if (buyerPhone) {
        notifyOrderWhatsApp(buyerPhone, 'refund_completed', {
          orderNumber: order.orderNumber,
          amount: `₹${amount.toFixed(2)}`,
        }).catch(() => {});
      }
    } catch {
      /* notifications optional */
    }

    try {
      await AuditLog.create({
        userId: refund.processedBy || refund.requestedBy || undefined,
        action: AuditAction.REFUND,
        resource: 'order',
        resourceId: order._id,
        details: {
          refundId: refund._id,
          amount,
          totalRefunded: nextRefunded,
          destination: refund.destination,
          reference: refund.reference || refund.razorpayRefundId,
        },
      });
    } catch {
      /* audit is best-effort */
    }

    refund.effectsAppliedAt = now;
  }

  refund.status = RefundStatus.COMPLETED;
  refund.completedAt = refund.completedAt || now;
  refund.orderAppliedAt = refund.orderAppliedAt || now;
  await refund.save();
  return refund;
}

export async function completeManualRefund(input: {
  refundId?: string;
  orderId?: string;
  reference: string;
  notes?: string;
  adminId?: string;
}) {
  const reference = String(input.reference || '').trim();
  if (!reference) throw new RefundError(400, 'A settlement reference is required');

  let refund: any = null;
  if (input.refundId && /^[0-9a-fA-F]{24}$/.test(input.refundId)) {
    refund = await Refund.findById(input.refundId);
  } else if (input.orderId) {
    refund = await Refund.findOne({
      orderId: input.orderId,
      status: { $in: [RefundStatus.PENDING, RefundStatus.PROCESSING] },
    }).sort({ createdAt: -1 });
  }

  if (refund) {
    if (refund.status === RefundStatus.COMPLETED) {
      return { refund: refund.toObject ? refund.toObject() : refund, alreadyCompleted: true };
    }
    if ([RefundStatus.FAILED, RefundStatus.CANCELLED].includes(refund.status)) {
      throw new RefundError(400, 'This refund is not in a completable state');
    }
    if (refund.razorpayRefundId) {
      throw new RefundError(
        400,
        'Online refunds complete automatically through Razorpay. Use the Razorpay dashboard or wait for the webhook.'
      );
    }
    refund.reference = reference;
    refund.processedBy = input.adminId;
    if (input.notes) refund.notes = input.notes;
    await refund.save();
    // applyRefundRecord marks the transaction completed only after the
    // order/payment aggregates have been written.
    await applyRefundRecord(refund);
    return { refund: await Refund.findById(refund._id).lean(), alreadyCompleted: false };
  }

  // Backwards compatibility with refunds created before the transaction ledger.
  if (!input.orderId) throw new RefundError(404, 'Refund not found');
  const order = await Order.findById(input.orderId).populate('userId', 'name email phone');
  if (!order) throw new RefundError(404, 'Order not found');
  if (order.refundStatus !== 'processing') {
    throw new RefundError(400, 'Only refunds in processing state can be completed');
  }
  if (!order.refundAmount || Number(order.refundAmount) <= 0) {
    throw new RefundError(400, 'This legacy refund has no recorded amount and cannot be completed');
  }

  order.refundStatus = 'completed';
  order.refundReference = reference;
  order.refundCompletedAt = new Date();
  if (input.notes) order.refundNotes = input.notes;
  order.timeline.push({
    event: 'Refund completed',
    description: `₹${(Number(order.refundAmount) || 0).toFixed(2)} manual refund completed. Ref: ${reference}`.slice(0, 500),
    type: 'payment',
    metadata: { amount: order.refundAmount, mode: 'manual', reference },
    createdAt: new Date(),
  } as any);
  await order.save();

  const userId = (order.userId as any)?._id?.toString?.() || order.userId?.toString?.();
  if (userId) {
    emitToUser(userId, 'orderRefunded', {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      refundAmount: order.refundAmount,
      refundMode: 'manual',
      timestamp: new Date(),
    });
  }
  try {
    const { notifyOrderWhatsApp } = await import('../services/whatsapp');
    const buyerPhone = (order.userId as any)?.phone;
    if (buyerPhone) {
      notifyOrderWhatsApp(buyerPhone, 'refund_completed', {
        orderNumber: order.orderNumber,
        amount: `₹${(Number(order.refundAmount) || 0).toFixed(2)}`,
      }).catch(() => {});
    }
  } catch {
    /* optional */
  }

  return { refund: null, order, alreadyCompleted: false };
}

/**
 * Razorpay can be the source of truth for refunds created in its dashboard.
 * Reconcile those events into the same ledger instead of overwriting amounts.
 */
export async function handleRazorpayRefundWebhook(payload: any) {
  const event = String(payload?.event || '');
  const entity = payload?.payload?.refund?.entity;
  if (!entity) return null;

  const amount = round2(Number(entity.amount || 0) / 100);
  if (amount <= 0) return null;

  const providerStatus = String(entity.status || '').toLowerCase();
  const completed = event === 'refund.processed' || providerStatus === 'processed';
  const failed = event === 'refund.failed' || providerStatus === 'failed';

  let refund: any = await Refund.findOne({ razorpayRefundId: entity.id });
  if (!refund) {
    refund = await Refund.findOne({
      razorpayPaymentId: entity.payment_id,
      amount,
      status: { $in: [RefundStatus.PENDING, RefundStatus.PROCESSING] },
    }).sort({ createdAt: -1 });
  }

  if (!refund) {
    const payment: any = await Payment.findOne({ razorpayPaymentId: entity.payment_id });
    const order = payment?.orderId
      ? await Order.findById(payment.orderId)
      : await Order.findOne({ razorpayPaymentId: entity.payment_id });
    if (!order) return null;

    const ctx = await getRefundContext(order);
    const alreadyApplied =
      round2(Number(order.refundAmount) || 0) >= amount - 0.01 ||
      round2(Number(payment?.refundAmount) || 0) >= amount - 0.01;

    refund = await Refund.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      paymentId: payment?._id,
      razorpayPaymentId: entity.payment_id,
      razorpayRefundId: entity.id,
      amount,
      currency: entity.currency || 'INR',
      status: failed ? RefundStatus.FAILED : completed ? RefundStatus.COMPLETED : RefundStatus.PROCESSING,
      destination: 'source',
      notes: 'Razorpay refund (dashboard/external)',
      reference: entity.id,
      providerStatus: providerStatus || event,
      providerResponse: entity,
      collectedAtRequest: ctx.collected,
      refundedBefore: ctx.refunded,
      refundedAfter: round2(ctx.refunded + amount),
      completedAt: completed ? new Date() : undefined,
      orderAppliedAt: alreadyApplied ? new Date() : undefined,
      ledgerAppliedAt: alreadyApplied ? new Date() : undefined,
      effectsAppliedAt: alreadyApplied ? new Date() : undefined,
    });

    if (completed && !alreadyApplied) await applyRefundRecord(refund);
    return refund;
  }

  refund.providerStatus = providerStatus || event;
  refund.providerResponse = entity;
  if (entity.id) refund.razorpayRefundId = entity.id;

  if (failed) {
    refund.status = RefundStatus.FAILED;
    refund.failureReason = entity.error_description || entity.error_reason || 'Razorpay refund failed';
    await refund.save();
    await markOrderRefundFailed(refund);
    return refund;
  }

  if (completed) {
    refund.status = RefundStatus.COMPLETED;
    refund.completedAt = refund.completedAt || new Date();
    refund.reference = refund.reference || entity.id;
    await refund.save();
    if (!refund.orderAppliedAt) await applyRefundRecord(refund);
    return refund;
  }

  refund.status = RefundStatus.PROCESSING;
  await refund.save();
  await markOrderRefundProcessing(refund);
  return refund;
}
