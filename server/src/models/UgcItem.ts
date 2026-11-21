import mongoose, { Document, Schema } from 'mongoose';
import { parseInstagramUrl } from '../utils/instagram';

// UGC / social-commerce item: customer video/image linked to a product,
// or Instagram media synced via Graph API. Admin features via `featured`.
export interface IUgcItem extends Document {
  source: 'customer' | 'instagram' | 'admin';
  mediaType: 'image' | 'video' | 'reel';
  mediaUrl: string;
  thumbnailUrl?: string;
  externalId?: string; // Instagram media id (dedupe on sync)
  permalink?: string; // Instagram post link
  provider?: 'upload' | 'instagram';
  shortcode?: string;
  embedUrl?: string;
  aspectRatio?: '9:16' | '1:1';
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
    mediaType: { type: String, enum: ['image', 'video', 'reel'], default: 'video' },
    mediaUrl: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, trim: true },
    externalId: { type: String, trim: true, index: true },
    permalink: { type: String, trim: true },
    provider: { type: String, enum: ['upload', 'instagram'], default: 'upload' },
    shortcode: { type: String, trim: true },
    embedUrl: { type: String, trim: true },
    aspectRatio: { type: String, enum: ['9:16', '1:1'], default: '9:16' },
    customerName: { type: String, trim: true, maxlength: 100 },
    caption: { type: String, trim: true, maxlength: 500 },
    likes: { type: Number, min: 0, default: 0 },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', index: true },
    featured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

UgcItemSchema.pre('save', function (next) {
  const parsed = parseInstagramUrl(this.mediaUrl) || parseInstagramUrl(this.permalink);
  if (parsed) {
    this.provider = 'instagram';
    this.shortcode = parsed.shortcode;
    this.embedUrl = parsed.embedUrl;
    this.aspectRatio = parsed.aspectRatio;
    this.mediaType = parsed.mediaType === 'post' ? 'image' : 'reel';
    if (!this.permalink) this.permalink = parsed.sourceUrl;
    if (this.source !== 'customer') this.source = 'instagram';
  } else if (!this.provider) {
    this.provider = 'upload';
  }
  next();
});

UgcItemSchema.index({ featured: 1, isActive: 1, createdAt: -1 });
UgcItemSchema.index({ externalId: 1 }, { unique: true, sparse: true });

export const UgcItem = mongoose.model<IUgcItem>('UgcItem', UgcItemSchema);
