import mongoose, { Document, Schema } from 'mongoose';

export enum RazorpayPaymentStatus {
  CREATED = 'created',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  orderNumber?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number; // paise? store rupees for Mentoos simplicity + paise field
  amountPaise: number;
  currency: string;
  method?: string; // upi, card, netbanking, wallet, cod_advance
  purpose: 'full' | 'cod_advance';
  status: RazorpayPaymentStatus;
  rawPayload?: Record<string, any>;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    orderNumber: { type: String, trim: true, uppercase: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true, trim: true, index: true },
    razorpayPaymentId: { type: String, trim: true, index: true },
    razorpaySignature: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', trim: true },
    method: { type: String, trim: true },
    purpose: { type: String, enum: ['full', 'cod_advance'], default: 'full' },
    status: { type: String, enum: Object.values(RazorpayPaymentStatus), default: RazorpayPaymentStatus.CREATED },
    rawPayload: { type: Schema.Types.Mixed },
    refundId: { type: String, trim: true },
    refundAmount: { type: Number, min: 0 },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ razorpayOrderId: 1 }, { unique: true });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
