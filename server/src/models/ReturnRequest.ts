import mongoose, { Document, Schema } from 'mongoose';

// Return / Exchange request (RMA) — customer raises from order history,
// admin approves/rejects/completes. Triggers WhatsApp + email updates.
export enum RmaType {
  RETURN = 'return',
  EXCHANGE = 'exchange',
}

export enum RmaStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PICKUP_SCHEDULED = 'pickup_scheduled',
  RECEIVED = 'received',
  REFUNDED = 'refunded',
  EXCHANGED = 'exchanged',
  CANCELLED = 'cancelled',
}

export interface IRmaItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  reason: string;
  size?: string;
  exchangeSize?: string; // for exchange: desired size
}

export interface IReturnRequest extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  type: RmaType;
  items: IRmaItem[];
  reason: string;
  status: RmaStatus;
  adminNote?: string;
  pickupAddress?: string;
  refundAmount?: number;
  refundMethod?: 'source' | 'upi' | 'bank';
  upiId?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  razorpayRefundId?: string;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RmaItemSchema = new Schema<IRmaItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    size: { type: String, trim: true },
    exchangeSize: { type: String, trim: true },
  },
  { _id: false }
);

const ReturnRequestSchema = new Schema<IReturnRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true, trim: true, uppercase: true, index: true },
    type: { type: String, enum: Object.values(RmaType), required: true },
    items: { type: [RmaItemSchema], required: true, validate: [(v: unknown[]) => v.length > 0, 'At least one item is required'] },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: Object.values(RmaStatus), default: RmaStatus.REQUESTED, index: true },
    adminNote: { type: String, trim: true, maxlength: 1000 },
    pickupAddress: { type: String, trim: true, maxlength: 500 },
    refundAmount: { type: Number, min: 0 },
    refundMethod: { type: String, enum: ['source', 'upi', 'bank'], default: 'source' },
    upiId: { type: String, trim: true, maxlength: 100 },
    bankAccountName: { type: String, trim: true, maxlength: 100 },
    bankAccountNumber: { type: String, trim: true, maxlength: 30 },
    bankIfsc: { type: String, trim: true, uppercase: true, maxlength: 11 },
    razorpayRefundId: { type: String, trim: true },
    refundedAt: { type: Date },
  },
  { timestamps: true }
);

ReturnRequestSchema.index({ userId: 1, createdAt: -1 });

export const ReturnRequest = mongoose.model<IReturnRequest>('ReturnRequest', ReturnRequestSchema);
