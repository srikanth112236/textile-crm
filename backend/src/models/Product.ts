import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  purchasePrice?: number;
  stockQuantity: number;
  minStockLevel?: number;
  taxRate?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    unit: { type: String, required: true, default: 'Meters' },
    price: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, default: 0, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    minStockLevel: { type: Number, default: 50, min: 0 },
    taxRate: { type: Number, default: 18, min: 0 },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
