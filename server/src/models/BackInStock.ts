import mongoose, { Document, Schema } from 'mongoose';

// Customer asked to be notified when a product/size is back in stock.
// Created from PDP "Notify Me" (guest allowed via contact). Marked notified once sent.
export interface IBackInStock extends Document {
  productId: mongoose.Types.ObjectId;
  productName?: string;
  size?: string;
  variantSku?: string;
  contact: string; // email or 10-digit mobile
  contactType: 'email' | 'phone';
  whatsappConsent: boolean;
  userId?: mongoose.Types.ObjectId;
  notified: boolean;
  notifiedAt?: Date;
  createdAt: Date;
}

const BackInStockSchema = new Schema<IBackInStock>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, trim: true },
    size: { type: String, trim: true, uppercase: true },
    variantSku: { type: String, trim: true, uppercase: true },
    contact: { type: String, required: true, trim: true },
    contactType: { type: String, enum: ['email', 'phone'], required: true },
    whatsappConsent: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    notified: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BackInStockSchema.index({ productId: 1, size: 1, contact: 1, notified: 1 });

export const BackInStock = mongoose.model<IBackInStock>('BackInStock', BackInStockSchema);
