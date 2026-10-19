import mongoose, { Document, Schema } from 'mongoose';

// UGC / social-commerce item: customer video/image linked to a product,
// or Instagram media synced via Graph API. Admin features via `featured`.
export interface IUgcItem extends Document {
  source: 'customer' | 'instagram' | 'admin';
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  externalId?: string; // Instagram media id (dedupe on sync)
  permalink?: string; // Instagram post link
  customerName?: string;
  caption?: string;
  likes?: number;
  productId?: mongoose.Types.ObjectId;
  featured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UgcItemSchema = new Schema<IUgcItem>(
  {
    source: { type: String, enum: ['customer', 'instagram', 'admin'], default: 'customer', index: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'video' },
    mediaUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, trim: true },
    externalId: { type: String, trim: true, index: true },
    permalink: { type: String, trim: true },
    customerName: { type: String, trim: true, maxlength: 100 },
    caption: { type: String, trim: true, maxlength: 500 },
    likes: { type: Number, min: 0, default: 0 },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    featured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

UgcItemSchema.index({ featured: 1, isActive: 1, createdAt: -1 });
UgcItemSchema.index({ externalId: 1 }, { unique: true, sparse: true });

export const UgcItem = mongoose.model<IUgcItem>('UgcItem', UgcItemSchema);
