import mongoose, { Document, Schema } from 'mongoose';

/**
 * A refund is a transaction, not a flag on an order.
 *
 * Orders keep aggregate fields (`refundAmount`, `refundStatus`) for backwards
 * compatibility and quick reads, but this collection is the source of truth
 * for every individual refund. Keeping the ledger separate means we can:
 *  - support multiple partial refunds on one payment,
 *  - reconcile Razorpay dashboard refunds through webhooks,
 *  - keep a manual payout in `processing` without pretending the money has
 *    already left the business,
 *  - make refund creation idempotent and prevent over-refunds.
 */
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export type RefundDestination = 'source' | 'upi' | 'bank';
export type RefundMode = 'razorpay' | 'manual';

export interface IRefund extends Document {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;

  razorpayPaymentId?: string;
  razorpayRefundId?: string;

  amount: number;
  currency: string;
  status: RefundStatus;

  /** How the money is returned. `source` means Razorpay original source. */
  destination: RefundDestination;
  upiId?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;

  notes: string;
  reference?: string;
  providerStatus?: string;
  providerResponse?: Record<string, any>;
  failureReason?: string;

  /** Snapshot of the order's money position when the refund was requested. */
  collectedAtRequest?: number;
  refundedBefore?: number;
  refundedAfter?: number;

  requestedBy?: mongoose.Types.ObjectId;
  processedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;

  /** Idempotency markers for the aggregate order/payment/stock writes. */
  orderAppliedAt?: Date;
  ledgerAppliedAt?: Date;
  effectsAppliedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', index: true },
    razorpayPaymentId: { type: String, trim: true, index: true },
    razorpayRefundId: { type: String, trim: true },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', trim: true },
    status: {
      type: String,
      enum: Object.values(RefundStatus),
      default: RefundStatus.PENDING,
      required: true,
    },

    destination: {
      type: String,
      enum: ['source', 'upi', 'bank'],
      default: 'source',
      required: true,
    },
    upiId: { type: String, trim: true, maxlength: 100 },
    bankAccountName: { type: String, trim: true, maxlength: 100 },
    bankAccountNumber: { type: String, trim: true, maxlength: 30 },
    bankIfsc: { type: String, trim: true, uppercase: true, maxlength: 11 },

    notes: { type: String, trim: true, required: true, maxlength: 500 },
    reference: { type: String, trim: true, maxlength: 100 },
    providerStatus: { type: String, trim: true, maxlength: 60 },
    providerResponse: { type: Schema.Types.Mixed },
    failureReason: { type: String, trim: true, maxlength: 500 },

    collectedAtRequest: { type: Number, min: 0 },
    refundedBefore: { type: Number, min: 0 },
    refundedAfter: { type: Number, min: 0 },

    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date },

    orderAppliedAt: { type: Date },
    ledgerAppliedAt: { type: Date },
    effectsAppliedAt: { type: Date },
  },
  { timestamps: true }
);

RefundSchema.index({ orderId: 1, createdAt: -1 });
RefundSchema.index({ status: 1, createdAt: -1 });
RefundSchema.index({ razorpayRefundId: 1 }, { unique: true, sparse: true });
// One active refund per order at a time. This is a database-level guard against
// double-clicks and two admins refunding the same order simultaneously.
RefundSchema.index(
  { orderId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: [RefundStatus.PENDING, RefundStatus.PROCESSING] } },
  }
);

export const Refund = mongoose.model<IRefund>('Refund', RefundSchema);
