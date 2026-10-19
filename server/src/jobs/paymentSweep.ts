import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import { Payment, RazorpayPaymentStatus } from '../models/Payment';
import { Product } from '../models/Product';
import { runSafeTransaction } from '../utils/safeSession';
import { emitToUser } from '../config/socket';

export interface PaymentSweepResult {
  checked: number;
  expired: number;
  restocked: number;
  failed: number;
}

// Abandoned online payments: a Razorpay order was created (stock decremented
// at order creation) but checkout.js never returned — popup closed, tab died.
// Without a sweep these orders sit PENDING forever holding stock, and the
// Payment ledger keeps orphan `created` rows. Runs on an interval; each run
// only touches ledgers older than the cutoff that still have no gateway
// payment id (i.e. Razorpay was never even attempted/completed).
export async function sweepAbandonedPayments(limit = 50): Promise<PaymentSweepResult> {
  const afterMin = Math.max(parseInt(process.env.PAYMENT_SWEEP_AFTER_MIN || '45', 10) || 45, 5);
  const cutoff = new Date(Date.now() - afterMin * 60 * 1000);
  const out: PaymentSweepResult = { checked: 0, expired: 0, restocked: 0, failed: 0 };

  const stale = await Payment.find({
    status: RazorpayPaymentStatus.CREATED,
    razorpayPaymentId: { $in: [null, undefined, ''] },
    createdAt: { $lt: cutoff },
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
  out.checked = stale.length;

  for (const p of stale) {
    try {
      // If money arrived late (verify/webhook raced us), leave it alone.
      const fresh: any = await Payment.findById(p._id);
      if (!fresh || fresh.status !== RazorpayPaymentStatus.CREATED || fresh.razorpayPaymentId) continue;

      fresh.status = RazorpayPaymentStatus.FAILED;
      await fresh.save();
      out.expired += 1;

      if (!p.orderId) continue;
      const order: any = await Order.findById(p.orderId);
      // Only ever sweep untouched orders — never money or fulfilled work.
      if (!order || order.status !== OrderStatus.PENDING || order.paymentStatus !== PaymentStatus.PENDING) continue;
      if ((order as any).razorpayPaymentId || ((order as any).codAdvancePaid || 0) > 0) continue;

      await runSafeTransaction(async (session) => {
        const o: any = await Order.findById(p.orderId).session(session || null);
        if (!o || o.status !== OrderStatus.PENDING || o.paymentStatus !== PaymentStatus.PENDING) return;
        o.status = OrderStatus.CANCELLED;
        o.cancelledReason = 'Payment not completed in time — auto-cancelled, stock released';
        const { restoreStockForOrder } = await import('../utils/stock');
        for (const item of o.items || []) {
          const product = await Product.findById(item.productId).session(session || null);
          if (product) {
            await restoreStockForOrder(product, item.variations, item.quantity, session);
          }
        }
        await o.save({ session });
      });
      out.restocked += 1;
      try {
        emitToUser(order.userId.toString(), 'orderStatusUpdate', {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          oldStatus: OrderStatus.PENDING,
          newStatus: OrderStatus.CANCELLED,
          reason: 'auto-cancelled: payment not completed',
          timestamp: new Date(),
        });
      } catch { /* socket optional */ }
    } catch {
      out.failed += 1;
    }
  }
  return out;
}

let timer: NodeJS.Timeout | null = null;
let running = false;

// Start interval sweep. No-op if disabled or already started.
export function startPaymentSweep(): void {
  if (timer) return;
  if ((process.env.PAYMENT_SWEEP_ENABLED || 'true').toLowerCase() === 'false') return;
  const intervalMin = Math.min(Math.max(parseInt(process.env.PAYMENT_SWEEP_INTERVAL_MIN || '30', 10) || 30, 5), 720);
  const limit = parseInt(process.env.PAYMENT_SWEEP_LIMIT || '50', 10) || 50;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const r = await sweepAbandonedPayments(limit);
      if (r.checked > 0) console.log(`Payment sweep: checked=${r.checked} expired=${r.expired} restocked=${r.restocked} failed=${r.failed}`);
    } catch (err) {
      console.error('Payment sweep error:', (err as any)?.message || err);
    } finally {
      running = false;
    }
  };
  timer = setInterval(run, intervalMin * 60 * 1000);
  (timer as any)?.unref?.();
}
