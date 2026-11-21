/**
 * Types mirror the backend contracts (server/src/models/*, app/lib/api/types.ts).
 * Only the fields the mobile app actually reads are listed; everything optional.
 */

export type Pagination = { page: number; limit: number; total: number; pages: number };

export type CategoryRef = { _id: string; name: string; slug?: string };

export type Category = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  status?: string;
  parent?: CategoryRef | null;
  children?: Category[];
  productCount?: number;
};

export type ImageObject = { url: string; altText?: string; isDefault?: boolean; position?: number };
export type ProductImage = string | ImageObject;

export type VariantOption = {
  value: string;
  label?: string;
  colorCode?: string;
  imageUrl?: string;
  sortOrder?: number;
};

export type VariantAttribute = {
  name: string;
  displayName?: string;
  type: 'color' | 'size' | 'text' | 'image' | 'button' | string;
  options: VariantOption[];
  required?: boolean;
};

export type VariantSKU = {
  _id?: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images?: string[];
  isEnabled?: boolean;
  isDefault?: boolean;
};

export type Product = {
  _id: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  category?: CategoryRef | null;
  tags?: Array<{ _id: string; name: string; slug?: string; color?: string }>;
  images?: ProductImage[];
  price: number;
  compareAtPrice?: number;
  currency?: string;
  stock: number;
  sku?: string;
  status?: string;
  badges?: string[];
  brand?: { name?: string; slug?: string; logo?: string };
  averageRating?: number;
  totalReviews?: number;
  hasVariants?: boolean;
  variantAttributes?: VariantAttribute[];
  variantSKUs?: VariantSKU[];
  variations?: Array<{ name: string; value: string; priceModifier?: number; stock?: number }>;
  fit?: string;
  fabric?: string;
  pattern?: string;
  occasion?: string;
  washCare?: string;
  features?: string[];
  materials?: string[];
  specifications?: Array<{ group?: string; name: string; value: string; unit?: string }>;
  sizeChart?: Array<{
    size: string;
    chest?: string;
    shoulder?: string;
    length?: string;
    sleeve?: string;
    waist?: string;
    hip?: string;
  }>;
  modelHeight?: string;
  modelSizeWorn?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductsResponse = {
  success: boolean;
  data: Product[];
  pagination: Pagination;
  fallback?: { relaxed: boolean; strategy?: string; appliedQuery?: string } | null;
};

export type ProductFilters = {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price' | 'rating' | 'name' | 'best-selling' | 'recommended' | 'discount' | 'createdAt';
  order?: 'asc' | 'desc';
  color?: string;
  size?: string;
  fit?: string;
  fabric?: string;
  pattern?: string;
  occasion?: string;
  minRating?: number;
  minDiscount?: number;
  inStock?: boolean;
  badge?: string;
  recent?: boolean;
};

export type FilterFacets = {
  categories: Category[];
  colors: Array<{ name: string; hex: string }>;
  sizes: string[];
  minPrice: number;
  maxPrice: number;
  fits: string[];
  fabrics: string[];
  patterns: string[];
  occasions: string[];
  badges: string[];
  sizeCounts?: Record<string, number>;
  colorCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
};

export type Review = {
  _id: string;
  userId?: string;
  userName?: string;
  rating: number;
  comment?: string;
  title?: string;
  photos?: Array<{ url: string; type?: string; thumbnailUrl?: string }>;
  verifiedPurchase?: boolean;
  helpfulCount?: number;
  notHelpfulCount?: number;
  createdAt: string;
  adminReply?: { comment: string; repliedAt?: string };
};

export type FeaturedReview = Review & {
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: string;
};

export type ReviewsResponse = {
  success: boolean;
  data: Review[];
  pagination: Pagination;
};

export type CartItem = {
  _id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  variations?: Array<{ name: string; value: string }>;
  price: number;
  subtotal?: number;
  stock?: number;
};

export type Cart = {
  items: CartItem[];
  total: number;
  itemCount: number;
};

export type Address = {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
};

export type Profile = {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role?: string;
  avatar?: string;
  addresses?: Address[];
  createdAt?: string;
};

export type AuthUser = {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role: string;
  mfaEnabled?: boolean;
};

export type AuthResponse = {
  message?: string;
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  referralApplied?: boolean;
};

export type OrderItem = {
  productId: string | Pick<Product, '_id' | 'name' | 'images' | 'sku'>;
  name?: string;
  quantity: number;
  variations?: Array<{ name: string; value: string }>;
  price: number;
  subtotal?: number;
  image?: string;
};

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'packed'
  | 'partially_fulfilled'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'on_hold';

export type Order = {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal?: number;
  total: number;
  taxAmount?: number;
  discountAmount?: number;
  discountCode?: string;
  shippingCost?: number;
  shippingAddress?: Address;
  status: OrderStatus;
  paymentStatus?: string;
  paymentMethod?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  refundAmount?: number;
  refundStatus?: string;
  refundMethod?: string;
  refundUpiId?: string;
  refundReference?: string;
  codAdvancePaid?: number;
  codBalance?: number;
  invoiceNumber?: string;
  invoiceUrl?: string;
  timeline?: Array<{ status?: string; message?: string; at?: string; createdAt?: string }>;
};

export type OrderListResponse = {
  success: boolean;
  data: { orders: Order[]; pagination: Pagination };
};

export type ShippingQuote = {
  available: boolean;
  charge: number;
  actualCost?: number;
  freeShipping?: boolean;
  source?: string;
  courierName?: string;
  etd?: string;
  estimatedDays?: number;
  cod?: boolean | number;
  reason?: string;
};

export type CodQuote = {
  codAllowed: boolean;
  advance: number;
  balance: number;
  reason?: string;
  mode?: string;
};

export type DiscountPreview = {
  code: string;
  discount: number;
  freeShipping?: boolean;
  qualifyingSubtotal?: number;
};

export type StoreSettings = {
  shipping?: { freeShippingThreshold?: number; [key: string]: unknown };
  storefront?: {
    announcements?: Array<{ text?: string; message?: string; link?: string }>;
    [key: string]: unknown;
  };
  payments?: { razorpayEnabled?: boolean; codEnabled?: boolean; [key: string]: unknown };
  [key: string]: unknown;
};

export type LoyaltyBalance = {
  balance: number;
  history?: Array<{ orderId?: string; points: number; reason?: string; createdAt?: string }>;
};

export type ReferralInfo = {
  code: string;
  referredCount: number;
  pointsEarned: number;
};

export type ShopLook = {
  _id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  bundlePrice?: number;
  isActive?: boolean;
  productIds?: Product[];
};

export type UgcItem = {
  _id: string;
  url?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  type?: string;
  caption?: string;
  productId?: string;
  userName?: string;
};

export type WishlistResponse = { success: boolean; data: Product[] };
