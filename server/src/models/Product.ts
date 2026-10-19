import mongoose, { Document, Schema } from 'mongoose';

// =====================================================
// REVIEW SCHEMAS (Existing - Enhanced)
// =====================================================

// Review photo/video schema
export interface IReviewMedia {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
}

// Review helpful vote schema
export interface IReviewVote {
  userId: mongoose.Types.ObjectId;
  isHelpful: boolean;
  createdAt: Date;
}

// Review subdocument schema (Phase 8 enhanced)
export interface IReview {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName?: string;
  rating: number;
  comment: string;
  photos?: IReviewMedia[];
  verifiedPurchase: boolean;
  helpfulVotes: IReviewVote[];
  helpfulCount: number;
  notHelpfulCount: number;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderationNotes?: string;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  adminReply?: {
    comment: string;
    repliedBy: mongoose.Types.ObjectId;
    repliedAt: Date;
  };
  isHidden: boolean;
  isFlagged: boolean;
  flaggedBy?: mongoose.Types.ObjectId;
  flaggedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

// =====================================================
// ADVANCED VARIANT SCHEMAS
// =====================================================

// Variant attribute option (e.g., "Red", "Blue" for Color)
export interface IVariantAttributeOption {
  value: string; // e.g., "Red", "Large", "64GB"
  label?: string; // Display label (if different from value)
  colorCode?: string; // Hex color code for color swatches (e.g., "#FF0000")
  imageUrl?: string; // Image for this option (e.g., product in red color)
  sortOrder?: number; // Display order
}

// Variant attribute type (e.g., "Color", "Size", "Storage")
export interface IVariantAttribute {
  name: string; // e.g., "Color", "Size", "Storage"
  displayName?: string; // User-friendly display name
  type: 'color' | 'size' | 'text' | 'image' | 'button'; // Display type in UI
  options: IVariantAttributeOption[];
  required: boolean; // Must select before adding to cart
}

// Individual SKU variant (combination of attributes)
export interface IVariantSKU {
  _id?: mongoose.Types.ObjectId;
  sku: string; // Unique SKU for this variant
  attributes: { [key: string]: string }; // e.g., { "Color": "Red", "Size": "Large" }
  price: number; // Final price for this variant
  compareAtPrice?: number; // Original/compare price (for showing discounts)
  costPrice?: number; // Cost price (for profit margin calculations)
  stock: number;
  lowStockThreshold?: number;
  weight?: number; // Weight in grams
  barcode?: string; // UPC, EAN, ISBN, etc.
  images?: string[]; // Image URLs specific to this variant
  isDefault?: boolean; // Default selected variant
  isEnabled: boolean; // Enable/disable this variant
  position?: number; // Sort order
}

// Legacy variation interface (backwards compatibility)
export interface IVariation {
  name: string;
  value: string;
  priceModifier?: number;
  stock?: number;
  sku?: string;
}

// Legacy variation option interface (backwards compatibility)
export interface IVariationOption {
  type: string;
  values: string[];
}

// Per-product size chart row (inches). Overrides the generic category table.
export interface ISizeChartRow {
  size: string; // e.g. S, M, 30, 32
  chest?: string;
  shoulder?: string;
  length?: string;
  sleeve?: string;
  waist?: string;
  hip?: string;
  thigh?: string;
  bottom?: string;
}

// =====================================================
// ADVANCED PRODUCT ATTRIBUTES
// =====================================================

// Brand information
export interface IBrand {
  name: string;
  slug?: string;
  logo?: string;
  website?: string;
}

// Product specifications/attributes
export interface ISpecification {
  group?: string; // Group name (e.g., "Technical", "Physical", "Display")
  name: string; // Specification name (e.g., "Screen Size", "Battery Life")
  value: string; // Specification value (e.g., "6.5 inches", "4000mAh")
  unit?: string; // Unit of measurement (e.g., "inches", "mAh", "GB")
}

// Shipping dimensions
export interface IShippingInfo {
  weight?: number; // Weight in grams
  weightUnit?: 'g' | 'kg' | 'oz' | 'lb';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm';
  shippingClass?: string; // Shipping class/rate group
  requiresShipping: boolean; // Physical product?
  freeShipping?: boolean;
}

// Digital product info
export interface IDigitalProduct {
  isDigital: boolean;
  downloadLimit?: number; // Max downloads per purchase
  downloadExpiry?: number; // Days until download link expires
  files?: Array<{
    name: string;
    url: string;
    size?: number; // File size in bytes
    type?: string; // MIME type
  }>;
}

// Pricing information
export interface IPricing {
  price: number; // Current selling price
  compareAtPrice?: number; // Original/was price
  costPrice?: number; // Cost/purchase price
  taxClass?: string; // Tax class
  taxable?: boolean; // Is product taxable?
  pricePerUnit?: {
    amount: number;
    unit: string; // e.g., "per kg", "per liter"
  };
}

// Volume/quantity pricing tiers
export interface IVolumePricing {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  discountPercent?: number;
}

// Product identifiers
export interface IProductIdentifiers {
  gtin?: string; // Global Trade Item Number
  upc?: string; // Universal Product Code
  ean?: string; // European Article Number
  isbn?: string; // International Standard Book Number
  mpn?: string; // Manufacturer Part Number
}

// Inventory settings
export interface IInventorySettings {
  trackInventory: boolean;
  allowBackorder: boolean;
  backorderLimit?: number;
  soldIndividually?: boolean; // Limit to one per order
  lowStockThreshold?: number;
  outOfStockThreshold?: number;
}

// Product visibility and scheduling
export interface IVisibility {
  visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  featured: boolean;
  publishDate?: Date;
  unpublishDate?: Date;
  password?: string; // Password protected product
}

// Related products
export interface IRelatedProducts {
  crossSells?: mongoose.Types.ObjectId[]; // "You might also like"
  upSells?: mongoose.Types.ObjectId[]; // "Upgrade to"
  frequentlyBoughtTogether?: mongoose.Types.ObjectId[];
  accessories?: mongoose.Types.ObjectId[];
}

// Product metadata for SEO
export interface IProductMetadata {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  structuredData?: Record<string, any>;
}

// Product image with metadata
export interface IProductImage {
  url: string;
  altText?: string;
  title?: string;
  position?: number;
  isDefault?: boolean;
  variantIds?: string[]; // Which variants this image belongs to
}

// =====================================================
// MAIN PRODUCT INTERFACE
// =====================================================

export interface IProduct extends Document {
  // Basic Info
  name: string;
  slug?: string;
  shortDescription?: string;
  description: string;
  
  // Categorization
  category: mongoose.Types.ObjectId | string;
  tags?: mongoose.Types.ObjectId[];
  
  // Media
  images: (string | IProductImage)[];
  videos?: Array<{
    url: string;
    thumbnailUrl?: string;
    title?: string;
  }>;
  
  // Advanced Variants
  variantAttributes?: IVariantAttribute[];
  variantSKUs?: IVariantSKU[];
  hasVariants: boolean;
  
  // Legacy Variants (backwards compatibility)
  variations?: IVariation[];
  variationOptions?: IVariationOption[];
  
  // Pricing
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  volumePricing?: IVolumePricing[];
  
  // Inventory
  stock: number;
  sku: string;
  inventory?: IInventorySettings;
  lowStockThreshold: number;
  
  // Product Details
  brand?: IBrand;
  specifications?: ISpecification[];
  features?: string[];
  materials?: string[];
  // merchandising attributes (Phase B: filters + PDP accordions)
  fit?: string; // e.g. Slim Fit, Regular, Oversized, Relaxed
  fabric?: string; // e.g. Pure Cotton, Linen, Dry-Fit
  pattern?: string; // e.g. Solid, Printed, Striped
  occasion?: string; // e.g. Casual, Formal, Festive, Gym
  washCare?: string; // wash instructions text
  sizeChart?: ISizeChartRow[]; // per-product measurements; empty = category table
  modelHeight?: string; // e.g. 6'0"
  modelSizeWorn?: string; // e.g. L
  badges?: string[]; // admin badges: bestseller, trending, limited (new/sale auto-derived)
  condition?: 'new' | 'refurbished' | 'used' | 'like_new';
  warranty?: string;
  
  // Identifiers
  identifiers?: IProductIdentifiers;
  
  // Shipping & Fulfillment
  shipping?: IShippingInfo;
  digital?: IDigitalProduct;
  
  // Visibility & Status
  status: 'draft' | 'active' | 'inactive' | 'out_of_stock' | 'discontinued' | 'scheduled';
  visibility?: IVisibility;
  
  // Reviews
  reviews: IReview[];
  averageRating?: number;
  totalReviews?: number;
  
  // Related Products
  relatedProducts?: IRelatedProducts;
  
  // SEO
  metadata?: IProductMetadata;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// MONGOOSE SCHEMAS
// =====================================================

// Review Media Schema
const ReviewMediaSchema = new Schema<IReviewMedia>(
  {
    url: { type: String, required: true, trim: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnailUrl: { type: String, trim: true },
  },
  { _id: false }
);

// Review Vote Schema
const ReviewVoteSchema = new Schema<IReviewVote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isHelpful: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, trim: true },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      index: true,
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    photos: {
      type: [ReviewMediaSchema],
      default: [],
      validate: {
        validator: function (v: IReviewMedia[]) { return v.length <= 5; },
        message: 'Maximum 5 photos/videos allowed per review',
      },
    },
    verifiedPurchase: { type: Boolean, default: false, index: true },
    helpfulVotes: { type: [ReviewVoteSchema], default: [] },
    helpfulCount: { type: Number, default: 0, min: 0 },
    notHelpfulCount: { type: Number, default: 0, min: 0 },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderationNotes: { type: String, trim: true, maxlength: [500, 'Moderation notes cannot exceed 500 characters'] },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    adminReply: {
      comment: { type: String, trim: true, maxlength: [1000, 'Admin reply cannot exceed 1000 characters'] },
      repliedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      repliedAt: { type: Date },
    },
    isHidden: { type: Boolean, default: false, index: true },
    isFlagged: { type: Boolean, default: false, index: true },
    flaggedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    flaggedAt: { type: Date },
    deletedAt: { type: Date },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Legacy Variation Schema (backwards compatibility)
const VariationSchema = new Schema<IVariation>(
  {
    name: { type: String, required: [true, 'Variation name is required'], trim: true },
    value: { type: String, required: [true, 'Variation value is required'], trim: true },
    priceModifier: { type: Number, default: 0 },
    stock: { type: Number, min: [0, 'Stock cannot be negative'] },
    sku: { type: String, trim: true },
  },
  { _id: false }
);

const VariationOptionSchema = new Schema<IVariationOption>(
  {
    type: { type: String, required: true, trim: true },
    values: {
      type: [String],
      required: true,
      validate: { validator: (v: string[]) => v.length > 0, message: 'Variation option must have at least one value' },
    },
  },
  { _id: false }
);

const MEASURE_MAX = 20;
const measureField = () => ({ type: String, trim: true, maxlength: [MEASURE_MAX, 'Measurement too long'] });

// Per-product size chart (inches); empty array = use category table.
const SizeChartRowSchema = new Schema<ISizeChartRow>(
  {
    size: { type: String, required: [true, 'Size is required'], trim: true, maxlength: 10 },
    chest: measureField(),
    shoulder: measureField(),
    length: measureField(),
    sleeve: measureField(),
    waist: measureField(),
    hip: measureField(),
    thigh: measureField(),
    bottom: measureField(),
  },
  { _id: false }
);

// Advanced Variant Attribute Option Schema
const VariantAttributeOptionSchema = new Schema<IVariantAttributeOption>(
  {
    value: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    colorCode: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

// Advanced Variant Attribute Schema
const VariantAttributeSchema = new Schema<IVariantAttribute>(
  {
    name: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true },
    type: { type: String, enum: ['color', 'size', 'text', 'image', 'button'], default: 'button' },
    options: { type: [VariantAttributeOptionSchema], default: [] },
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

// Variant SKU Schema
const VariantSKUSchema = new Schema<IVariantSKU>(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    attributes: { type: Map, of: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 10 },
    weight: { type: Number, min: 0 },
    barcode: { type: String, trim: true },
    images: { type: [String], default: [] },
    isDefault: { type: Boolean, default: false },
    isEnabled: { type: Boolean, default: true },
    position: { type: Number, default: 0 },
  },
  { _id: true }
);

// Brand Schema
const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    logo: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { _id: false }
);

// Specification Schema
const SpecificationSchema = new Schema<ISpecification>(
  {
    group: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    unit: { type: String, trim: true },
  },
  { _id: false }
);

// Shipping Info Schema
const ShippingInfoSchema = new Schema<IShippingInfo>(
  {
    weight: { type: Number, min: 0 },
    weightUnit: { type: String, enum: ['g', 'kg', 'oz', 'lb'], default: 'g' },
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    dimensionUnit: { type: String, enum: ['cm', 'in', 'm'], default: 'cm' },
    shippingClass: { type: String, trim: true },
    requiresShipping: { type: Boolean, default: true },
    freeShipping: { type: Boolean, default: false },
  },
  { _id: false }
);

// Digital Product Schema
const DigitalProductSchema = new Schema<IDigitalProduct>(
  {
    isDigital: { type: Boolean, default: false },
    downloadLimit: { type: Number, min: 0 },
    downloadExpiry: { type: Number, min: 0 },
    files: [{
      name: { type: String, required: true, trim: true },
      url: { type: String, required: true, trim: true },
      size: { type: Number, min: 0 },
      type: { type: String, trim: true },
    }],
  },
  { _id: false }
);

// Volume Pricing Schema
const VolumePricingSchema = new Schema<IVolumePricing>(
  {
    minQuantity: { type: Number, required: true, min: 1 },
    maxQuantity: { type: Number, min: 1 },
    price: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

// Product Identifiers Schema
const ProductIdentifiersSchema = new Schema<IProductIdentifiers>(
  {
    gtin: { type: String, trim: true },
    upc: { type: String, trim: true },
    ean: { type: String, trim: true },
    isbn: { type: String, trim: true },
    mpn: { type: String, trim: true },
  },
  { _id: false }
);

// Inventory Settings Schema
const InventorySettingsSchema = new Schema<IInventorySettings>(
  {
    trackInventory: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false },
    backorderLimit: { type: Number, min: 0 },
    soldIndividually: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, min: 0, default: 10 },
    outOfStockThreshold: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

// Visibility Schema
const VisibilitySchema = new Schema<IVisibility>(
  {
    visibility: { type: String, enum: ['visible', 'catalog', 'search', 'hidden'], default: 'visible' },
    featured: { type: Boolean, default: false },
    publishDate: { type: Date },
    unpublishDate: { type: Date },
    password: { type: String, trim: true },
  },
  { _id: false }
);

// Related Products Schema
const RelatedProductsSchema = new Schema<IRelatedProducts>(
  {
    crossSells: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    upSells: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    frequentlyBoughtTogether: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    accessories: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { _id: false }
);

// Product Image Schema
const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    altText: { type: String, trim: true, maxlength: [200, 'Alt text cannot exceed 200 characters'] },
    title: { type: String, trim: true },
    position: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    variantIds: { type: [String], default: [] },
  },
  { _id: false }
);

// =====================================================
// MAIN PRODUCT SCHEMA
// =====================================================

const ProductSchema = new Schema<IProduct>(
  {
    // Basic Info
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: { type: String, trim: true, index: true },
    shortDescription: { type: String, trim: true, maxlength: [500, 'Short description cannot exceed 500 characters'] },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    
    // Categorization
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
    },
    tags: { type: [Schema.Types.ObjectId], ref: 'Tag', default: [], index: true },
    
    // Media
    images: {
      type: [Schema.Types.Mixed],
      default: [],
      validate: {
        validator: function (v: (string | IProductImage)[]) { return v.length > 0; },
        message: 'Product must have at least one image',
      },
    },
    videos: [{
      url: { type: String, required: true, trim: true },
      thumbnailUrl: { type: String, trim: true },
      title: { type: String, trim: true },
    }],
    
    // Advanced Variants
    hasVariants: { type: Boolean, default: false },
    variantAttributes: { type: [VariantAttributeSchema], default: [] },
    variantSKUs: { type: [VariantSKUSchema], default: [] },
    
    // Legacy Variants (backwards compatibility)
    variations: { type: [VariationSchema], default: [] },
    variationOptions: { type: [VariationOptionSchema], default: [] },
    
    // Pricing
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: { type: Number, min: [0, 'Compare at price cannot be negative'] },
    costPrice: { type: Number, min: [0, 'Cost price cannot be negative'] },
    volumePricing: { type: [VolumePricingSchema], default: [] },
    
    // Inventory
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v: string) { return /^[A-Z0-9\-_]+$/.test(v); },
        message: 'SKU must contain only uppercase letters, numbers, hyphens, and underscores',
      },
    },
    inventory: { type: InventorySettingsSchema },
    lowStockThreshold: { type: Number, min: [0, 'Low stock threshold cannot be negative'], default: 10 },
    
    // Product Details
    brand: { type: BrandSchema },
    specifications: { type: [SpecificationSchema], default: [] },
    features: { type: [String], default: [] },
    materials: { type: [String], default: [] },
    fit: { type: String, trim: true, maxlength: 100, index: true },
    fabric: { type: String, trim: true, maxlength: 100, index: true },
    pattern: { type: String, trim: true, maxlength: 100, index: true },
    occasion: { type: String, trim: true, maxlength: 100, index: true },
    washCare: { type: String, trim: true, maxlength: 1000 },
    sizeChart: { type: [SizeChartRowSchema], default: [] },
    modelHeight: { type: String, trim: true, maxlength: 20 },
    modelSizeWorn: { type: String, trim: true, maxlength: 10 },
    badges: { type: [String], enum: ['bestseller', 'trending', 'limited', 'new', 'sale'], default: [] },
    condition: { type: String, enum: ['new', 'refurbished', 'used', 'like_new'], default: 'new' },
    warranty: { type: String, trim: true },
    
    // Identifiers
    identifiers: { type: ProductIdentifiersSchema },
    
    // Shipping & Fulfillment
    shipping: { type: ShippingInfoSchema },
    digital: { type: DigitalProductSchema },
    
    // Visibility & Status
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued', 'scheduled'],
      default: 'draft',
      required: true,
    },
    visibility: { type: VisibilitySchema },
    
    // Reviews
    reviews: { type: [ReviewSchema], default: [] },
    averageRating: { type: Number, min: [0, 'Average rating cannot be negative'], max: [5, 'Average rating cannot exceed 5'], default: 0 },
    totalReviews: { type: Number, min: [0, 'Total reviews cannot be negative'], default: 0 },
    
    // Related Products
    relatedProducts: { type: RelatedProductsSchema },
    
    // SEO
    metadata: {
      type: {
        metaTitle: { type: String, trim: true, maxlength: [60, 'Meta title cannot exceed 60 characters'] },
        metaDescription: { type: String, trim: true, maxlength: [160, 'Meta description cannot exceed 160 characters'] },
        metaKeywords: { type: [String], default: [] },
        ogTitle: { type: String, trim: true, maxlength: [60, 'OG title cannot exceed 60 characters'] },
        ogDescription: { type: String, trim: true, maxlength: [200, 'OG description cannot exceed 200 characters'] },
        ogImage: { type: String, trim: true },
        twitterCard: { type: String, enum: ['summary', 'summary_large_image', 'app', 'player'], default: 'summary_large_image' },
        canonicalUrl: { type: String, trim: true },
        structuredData: { type: Schema.Types.Mixed, default: {} },
      },
      default: {},
    },
  },
  { timestamps: true }
);

// =====================================================
// PRE-SAVE HOOKS
// =====================================================

// Generate slug from name
ProductSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Transform images to support both string and object formats
ProductSchema.pre('save', function (next) {
  if (this.images && Array.isArray(this.images)) {
    this.images = this.images.map((img: string | IProductImage) => {
      if (typeof img === 'object' && img !== null && 'url' in img) {
        return img;
      }
      if (typeof img === 'string') {
        return { url: img };
      }
      return img;
    });
  }
  next();
});

// Update status based on stock
ProductSchema.pre('save', function (next) {
  if (this.isModified('stock')) {
    if (this.stock === 0 && this.status === 'active') {
      this.status = 'out_of_stock';
    } else if (this.stock > 0 && this.status === 'out_of_stock') {
      this.status = 'active';
    }
  }
  next();
});

// Calculate total stock from variants if hasVariants is true
ProductSchema.pre('save', function (next) {
  if (this.hasVariants && this.variantSKUs && this.variantSKUs.length > 0) {
    // Calculate total stock from enabled variant SKUs
    const totalVariantStock = this.variantSKUs
      .filter((v: IVariantSKU) => v.isEnabled)
      .reduce((total: number, variant: IVariantSKU) => total + (variant.stock || 0), 0);
    
    this.stock = totalVariantStock;
    
    // Get the default or first enabled variant for main price
    const defaultVariant = this.variantSKUs.find((v: IVariantSKU) => v.isDefault && v.isEnabled) ||
                          this.variantSKUs.find((v: IVariantSKU) => v.isEnabled);
    
    if (defaultVariant) {
      this.price = defaultVariant.price;
      if (defaultVariant.compareAtPrice) {
        this.compareAtPrice = defaultVariant.compareAtPrice;
      }
    }
  }
  next();
});

// Update rating before saving if reviews changed
ProductSchema.pre('save', function (next) {
  if (this.isModified('reviews')) {
    const approvedReviews = this.reviews.filter(
      (review: IReview) => review.moderationStatus === 'approved' && !review.deletedAt
    );
    
    const allVisibleReviews = this.reviews.filter(
      (review: IReview) => !review.deletedAt && !review.isHidden
    );
    
    if (approvedReviews.length === 0) {
      this.averageRating = 0;
    } else {
      const sum = approvedReviews.reduce((acc: number, review: IReview) => acc + review.rating, 0);
      this.averageRating = Math.round((sum / approvedReviews.length) * 10) / 10;
    }
    
    this.totalReviews = allVisibleReviews.length;
  }
  next();
});

// =====================================================
// INDEXES
// =====================================================

ProductSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ averageRating: -1 });
// PLP hot paths: status is always in the filter, pair it with the
// category / sort dimensions so listing + count skip collection scans.
ProductSchema.index({ status: 1, category: 1, createdAt: -1 });
ProductSchema.index({ status: 1, category: 1, price: 1 });
ProductSchema.index({ status: 1, averageRating: -1 });
ProductSchema.index({ status: 1, totalReviews: -1 });
ProductSchema.index({ 'reviews.rating': 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ 'brand.name': 1 });
ProductSchema.index({ 'brand.slug': 1 });
ProductSchema.index({ 'variantSKUs.sku': 1 });
ProductSchema.index({ 'visibility.featured': 1 });
ProductSchema.index({ 'visibility.publishDate': 1 });
ProductSchema.index({ hasVariants: 1 });
ProductSchema.index({ condition: 1 });

// =====================================================
// POST-SAVE HOOKS (Elasticsearch, Low Stock Alerts)
// =====================================================
// Fire-and-forget: indexing must NEVER block saves. Awaiting the ES client
// here stalled every product write (and therefore order placement) for
// tens of seconds when Elasticsearch is unreachable.

ProductSchema.post('save', function (doc) {
  import('../services/search')
    .then(({ updateProductIndex }) => updateProductIndex(doc as IProduct).catch(() => {}))
    .catch(() => {});
});

ProductSchema.post('findOneAndUpdate', function (doc) {
  if (doc) {
    import('../services/search')
      .then(({ updateProductIndex }) => updateProductIndex(doc as IProduct).catch(() => {}))
      .catch(() => {});
  }
});

ProductSchema.post('findOneAndDelete', function (doc) {
  if (doc) {
    import('../services/search')
      .then(({ deleteProductIndex }) => deleteProductIndex(doc._id.toString()).catch(() => {}))
      .catch(() => {});
  }
});

ProductSchema.post('remove', async function (doc) {
  try {
    const { deleteProductIndex } = await import('../services/search');
    await deleteProductIndex(doc._id.toString());
  } catch (error) {
    console.warn('Failed to delete product from Elasticsearch index:', error);
  }
});

// Back-in-stock notification hook (retention): when a product has stock,
// alert pending subscribers for it (marked notified so each sub fires once).
ProductSchema.post('save', async function (doc) {
  try {
    if ((doc as IProduct).stock > 0) {
      const { notifyRestock } = await import('../services/stockNotifications');
      await notifyRestock(doc._id.toString());
    }
  } catch (error) {
    console.warn('Failed to send back-in-stock alerts:', error);
  }
});

// Low stock detection hook
ProductSchema.post('save', async function (doc) {
  try {
    if (doc.stock <= doc.lowStockThreshold && doc.stock > 0) {
      const { emitToAdmins } = await import('../config/socket');
      emitToAdmins('lowStockAlert', {
        productId: doc._id.toString(),
        productName: doc.name,
        sku: doc.sku,
        stock: doc.stock,
        threshold: doc.lowStockThreshold,
        timestamp: new Date(),
      });
    }
    
    // Check variant-level low stock
    if (doc.hasVariants && doc.variantSKUs) {
      for (const variant of doc.variantSKUs) {
        const threshold = variant.lowStockThreshold || doc.lowStockThreshold;
        if (variant.isEnabled && variant.stock <= threshold && variant.stock > 0) {
          const { emitToAdmins } = await import('../config/socket');
          emitToAdmins('lowStockAlert', {
            productId: doc._id.toString(),
            productName: doc.name,
            variantSku: variant.sku,
            variantAttributes: variant.attributes,
            stock: variant.stock,
            threshold: threshold,
            timestamp: new Date(),
          });
        }
      }
    }
  } catch (error) {
    console.warn('Failed to emit low stock alert:', error);
  }
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
