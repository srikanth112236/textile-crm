import mongoose, { Document, Schema } from 'mongoose';

// Admin-curated outfit bundle: hero image + product list + optional bundle price.
// Homepage ShopTheLook renders active combos with ADD ALL TO CART.
export interface IShopLook extends Document {
  title: string;
  description?: string;
  imageUrl: string;
  productIds: mongoose.Types.ObjectId[];
  bundlePrice?: number;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const ShopLookSchema = new Schema<IShopLook>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 500 },
    imageUrl: { type: String, required: true, trim: true },
    productIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Product' }], default: [], validate: [(v: unknown[]) => v.length > 0, 'At least one product is required'] },
    bundlePrice: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ShopLookSchema.index({ isActive: 1, position: 1 });

export const ShopLook = mongoose.model<IShopLook>('ShopLook', ShopLookSchema);
