import mongoose, { Document, Schema } from 'mongoose';

// Customer wants an alert when a product's price drops below the price at subscribe time.
export interface IPriceAlert extends Document {
  productId: mongoose.Types.ObjectId;
  productName?: string;
  targetPrice: number; // alert when current price < targetPrice
  contact?: string;
  contactType?: 'email' | 'phone';
  userId?: mongoose.Types.ObjectId;
  lastNotifiedPrice?: number;
  active: boolean;
  createdAt: Date;
}

const PriceAlertSchema = new Schema<IPriceAlert>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, trim: true },
    targetPrice: { type: Number, required: true, min: 0 },
    contact: { type: String, trim: true },
    contactType: { type: String, enum: ['email', 'phone'] },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    lastNotifiedPrice: { type: Number, min: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PriceAlertSchema.index({ productId: 1, active: 1 });

export const PriceAlert = mongoose.model<IPriceAlert>('PriceAlert', PriceAlertSchema);
