// Shared API types

// =====================================================
// VARIANT TYPES
// =====================================================

export interface IVariantAttributeOption {
  value: string;
  label?: string;
  colorCode?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface IVariantAttribute {
  name: string;
  displayName?: string;
  type: 'color' | 'size' | 'text' | 'image' | 'button';
  options: IVariantAttributeOption[];
  required: boolean;
}

export interface IVariantSKU {
  _id?: string;
  sku: string;
  attributes: { [key: string]: string };
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold?: number;
  weight?: number;
  barcode?: string;
  images?: string[];
  isDefault?: boolean;
  isEnabled: boolean;
  position?: number;
}

// =====================================================
// PRODUCT ATTRIBUTE TYPES
// =====================================================

export interface IBrand {
  name: string;
  slug?: string;
  logo?: string;
  website?: string;
}

export interface ISpecification {
  group?: string;
  name: string;
  value: string;
  unit?: string;
}

export interface IShippingInfo {
  weight?: number;
  weightUnit?: 'g' | 'kg' | 'oz' | 'lb';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm';
  shippingClass?: string;
  requiresShipping: boolean;
  freeShipping?: boolean;
}

export interface IDigitalProduct {
  isDigital: boolean;
  downloadLimit?: number;
  downloadExpiry?: number;
  files?: Array<{
    name: string;
    url: string;
    size?: number;
    type?: string;
  }>;
}

export interface IVolumePricing {
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  discountPercent?: number;
}

export interface IProductIdentifiers {
  gtin?: string;
  upc?: string;
  ean?: string;
  isbn?: string;
  mpn?: string;
}

export interface IInventorySettings {
  trackInventory: boolean;
  allowBackorder: boolean;
  backorderLimit?: number;
  soldIndividually?: boolean;
  lowStockThreshold?: number;
  outOfStockThreshold?: number;
}

export interface ISizeChartRow {
  size: string;
  chest?: string;
  shoulder?: string;
  length?: string;
  sleeve?: string;
  waist?: string;
  hip?: string;
  thigh?: string;
  bottom?: string;
}

export interface IVisibility {
  visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  featured: boolean;
  publishDate?: Date | string;
  unpublishDate?: Date | string;
  password?: string;
}

export interface IRelatedProducts {
  crossSells?: string[];
  upSells?: string[];
  frequentlyBoughtTogether?: string[];
  accessories?: string[];
}

// =====================================================
// MAIN PRODUCT TYPE
// =====================================================

export interface IProduct {
  _id: string;
  
  // Basic Info
  name: string;
  slug?: string;
  shortDescription?: string;
  description: string;
  
  // Categorization
  category: string | { _id: string; name: string; slug: string };
  tags?: string[] | Array<{ _id: string; name: string; slug: string; color?: string }>;
  
  // Media
  images: (string | { url: string; altText?: string; title?: string; position?: number })[];
  videos?: Array<{ url: string; thumbnailUrl?: string; title?: string }>;
  
  // Advanced Variants
  hasVariants?: boolean;
  variantAttributes?: IVariantAttribute[];
  variantSKUs?: IVariantSKU[];
  
  // Legacy Variants (backwards compatibility)
  variations?: Array<{
    name: string;
    value: string;
    priceModifier?: number;
    stock?: number;
    sku?: string;
  }>;
  variationOptions?: Array<{
    type: string;
    values: string[];
  }>;
  
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
  fit?: string;
  fabric?: string;
  pattern?: string;
  occasion?: string;
  washCare?: string;
  sizeChart?: ISizeChartRow[];
  modelHeight?: string;
  modelSizeWorn?: string;
  badges?: string[];
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
  reviews?: Array<{
    _id?: string;
    userId: string;
    userName?: string;
    rating: number;
    comment: string;
    photos?: Array<{ url: string; type: 'image' | 'video'; thumbnailUrl?: string }>;
    verifiedPurchase?: boolean;
    helpfulCount?: number;
    notHelpfulCount?: number;
    moderationStatus?: 'pending' | 'approved' | 'rejected';
    adminReply?: { comment: string; repliedAt: string };
    createdAt: Date | string;
  }>;
  averageRating?: number;
  totalReviews?: number;
  
  // Related Products
  relatedProducts?: IRelatedProducts;
  
  // SEO
  metadata?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, any>;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string | { _id: string; name: string; slug: string };
  image?: string;
  status: 'active' | 'inactive';
  children?: ICategory[];
  createdAt: string;
  updatedAt: string;
}

