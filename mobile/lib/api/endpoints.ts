import { api } from './client';
import type {
  Address,
  AuthResponse,
  Cart,
  Category,
  CodQuote,
  DiscountPreview,
  FeaturedReview,
  FilterFacets,
  LoyaltyBalance,
  Order,
  OrderListResponse,
  OrderStatus,
  Pagination,
  Product,
  ProductFilters,
  ProductsResponse,
  Profile,
  ReferralInfo,
  Review,
  ReviewsResponse,
  ShippingQuote,
  ShopLook,
  StoreSettings,
  UgcItem,
  WishlistResponse,
} from './types';

/* ------------------------------------------------------------------ products */

export const productsApi = {
  list: (filters: ProductFilters = {}) =>
    api.get<ProductsResponse>('/products', { status: 'active', ...filters }),

  get: (id: string) => api.get<{ success: boolean; data: Product }>(`/products/${id}`),

  facets: (params: { category?: string; search?: string } = {}) =>
    api.get<{ success: boolean; data: FilterFacets }>('/products/filters', params),

  // The web storefront searches through /products?search=… (the Elasticsearch-backed
  // /products/search route is not enabled in every deployment).
  search: (params: { q: string; page?: number; limit?: number; category?: string }) =>
    api.get<ProductsResponse>('/products', {
      status: 'active',
      search: params.q,
      page: params.page,
      limit: params.limit ?? 30,
      category: params.category,
    }),

  trending: (limit = 10) =>
    api.get<{ success: boolean; data: Product[] }>('/products/recommendations/trending', { limit }),

  recommendations: (id: string, limit = 6) =>
    api.get<{ success: boolean; data: Product[] }>(`/products/${id}/recommendations`, { limit }),

  featuredReviews: (limit = 8) =>
    api.get<{ success: boolean; data: FeaturedReview[] }>('/products/reviews/featured', { limit }),

  reviews: (id: string, page = 1, limit = 5, sort: 'newest' | 'highest' | 'lowest' | 'most_helpful' = 'newest') =>
    api.get<ReviewsResponse>(`/products/${id}/reviews`, { page, limit, sort }),

  addReview: (id: string, body: { rating: number; comment: string }) =>
    api.post<{ success: boolean; message: string; data: Review }>(`/products/${id}/reviews`, body),
};

/* ---------------------------------------------------------------- categories */

export const categoriesApi = {
  tree: () => api.get<{ success: boolean; data: Category[] }>('/categories', { status: 'active' }),
  get: (id: string) => api.get<{ success: boolean; data: Category }>(`/categories/${id}`),
};

/* --------------------------------------------------------------------- cart */

export type AddToCartBody = {
  productId: string;
  quantity: number;
  variations?: Array<{ name: string; value: string }>;
};

export const cartApi = {
  get: () => api.get<{ success: boolean; data: Cart }>('/cart'),
  add: (body: AddToCartBody) => api.post<{ success: boolean; message: string; data: Cart }>('/cart/items', body),
  update: (index: number, quantity: number) =>
    api.put<{ success: boolean; message: string; data: Cart }>(`/cart/items/${index}`, { quantity }),
  remove: (index: number) => api.del<{ success: boolean; message: string; data: Cart }>(`/cart/items/${index}`),
  clear: () => api.del<{ success: boolean; message: string }>('/cart'),
};

/* -------------------------------------------------------------------- auth */

export const authApi = {
  login: (body: { email: string; password: string; recaptchaToken?: string }) =>
    api.post<AuthResponse>('/auth/login', body, { auth: false }),
  register: (body: { email: string; password: string; name?: string; referralCode?: string }) =>
    api.post<AuthResponse>('/auth/register', body, { auth: false }),
  sendOtp: (phone: string) =>
    api.post<{ success: boolean; message: string; debugCode?: string }>('/auth/otp/send', { phone }, { auth: false }),
  verifyOtp: (body: { phone: string; code: string; name?: string }) =>
    api.post<AuthResponse>('/auth/otp/verify', body, { auth: false }),
  logout: () => api.post<{ message: string }>('/auth/logout'),
};

/* ----------------------------------------------------------------- profile */

export const profileApi = {
  get: () => api.get<{ success: boolean; data: Profile }>('/profile'),
  update: (body: Partial<Pick<Profile, 'name' | 'phone' | 'avatar'>>) =>
    api.put<{ success: boolean; data: Profile }>('/profile', body),
  addresses: () => api.get<{ success: boolean; data: Address[] }>('/profile/addresses'),
  createAddress: (body: Address) => api.post<{ success: boolean; data: Address }>('/profile/addresses', body),
  updateAddress: (id: string, body: Address) =>
    api.put<{ success: boolean; data: Address }>(`/profile/addresses/${id}`, body),
  deleteAddress: (id: string) => api.del<{ success: boolean; message: string }>(`/profile/addresses/${id}`),
  exportData: () => api.get<{ success: boolean; data: unknown }>('/profile/export'),
  deleteAccount: () => api.del<{ success: boolean; message: string }>('/profile'),
};

/* ----------------------------------------------------------------- returns */

export type ReturnItem = { productId: string; quantity: number; reason: string; size?: string; exchangeSize?: string };

export type ReturnRequest = {
  _id: string;
  orderId: string | { _id: string; orderNumber?: string };
  type: 'return' | 'exchange';
  status: string;
  reason?: string;
  items?: Array<{ productId?: string | { _id?: string; name?: string; images?: unknown[] }; quantity?: number; reason?: string }>;
  refundAmount?: number;
  refundMethod?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
};

export const returnsApi = {
  mine: () => api.get<{ success: boolean; data: ReturnRequest[] }>('/returns/mine'),
  create: (body: {
    orderId: string;
    type: 'return' | 'exchange';
    items: ReturnItem[];
    reason: string;
    refundMethod?: 'source' | 'upi' | 'bank';
    upiId?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
  }) => api.post<{ success: boolean; message: string; data: ReturnRequest }>('/returns', body),
};

/* ------------------------------------------------------------------ orders */

export const ordersApi = {
  create: (body: {
    items?: Array<{ productId: string; quantity: number; variations?: Array<{ name: string; value: string }> }>;
    shippingAddress?: Omit<Address, '_id' | 'isDefault'>;
    shippingAddressId?: string;
    paymentMethod?: 'cod' | 'razorpay' | 'upi' | 'card' | 'netbanking' | 'wallet' | 'manual';
    discountCode?: string;
    loyaltyPointsRedeemed?: number;
  }) => api.post<{ success: boolean; message: string; data: Order }>('/orders', body),

  list: (params: { page?: number; limit?: number; status?: OrderStatus } = {}) =>
    api.get<OrderListResponse>('/orders', params),

  get: (id: string) => api.get<{ success: boolean; data: Order }>(`/orders/${id}`),

  cancel: (id: string, reason?: string) =>
    api.post<{ success: boolean; message: string; data: Order }>(`/orders/${id}/cancel`, { reason }),

  repeat: (id: string) => api.post<{ success: boolean; message: string; data: Order }>(`/orders/${id}/repeat`),
};

/* ---------------------------------------------------------------- wishlist */

export const wishlistApi = {
  list: () => api.get<WishlistResponse>('/wishlist'),
  add: (productId: string) => api.post<{ success: boolean; message: string }>(`/wishlist/${productId}`),
  remove: (productId: string) => api.del<{ success: boolean; message: string }>(`/wishlist/${productId}`),
  check: (productId: string) =>
    api.get<{ success: boolean; data: { isInWishlist: boolean } }>(`/wishlist/${productId}/check`),
};

/* --------------------------------------------------------------- discounts */

export const discountsApi = {
  validate: (body: {
    code: string;
    items: Array<{ productId: string; quantity: number }>;
    orderTotal?: number;
  }) => api.post<{ success: boolean; data: DiscountPreview }>('/discounts/validate', body, { auth: false }),
  list: () => api.get<{ success: boolean; data: DiscountPreview[] }>('/discounts', { isActive: true }, { auth: false }),
};

/* ---------------------------------------------------------------- shipment */

export const shipmentApi = {
  quote: (body: {
    pincode: string;
    paymentMethod?: string;
    orderValue?: number;
    items: Array<{ productId: string; quantity: number }>;
  }) => api.post<{ success: boolean; data: ShippingQuote }>('/shipment/quote', body, { auth: false }),

  track: (orderNumber: string) =>
    api.get<{ success: boolean; data: unknown }>(`/shipment/track-order/${orderNumber}`, undefined, { auth: false }),
};

/* ---------------------------------------------------------------- settings */

export const settingsApi = {
  get: () => api.get<{ success: boolean; data: StoreSettings }>('/settings', undefined, { auth: false }),
  codQuote: (body: { orderValue: number; pincode?: string }) =>
    api.post<{ success: boolean; data: CodQuote }>('/settings/cod-quote', body, { auth: false }),
};

/* ------------------------------------------------------- loyalty/referrals */

export const loyaltyApi = {
  balance: () => api.get<{ success: boolean; data: LoyaltyBalance }>('/loyalty/balance'),
  history: (page = 1, limit = 20) =>
    api.get<{ success: boolean; data: LoyaltyBalance['history']; pagination: Pagination }>('/loyalty/history', {
      page,
      limit,
    }),
};

export const referralsApi = {
  mine: () => api.get<{ success: boolean; data: ReferralInfo }>('/referrals/mine'),
};

/* ------------------------------------------------------------ content/UGC */

export const shopLookApi = {
  list: () => api.get<{ success: boolean; data: ShopLook[] }>('/shop-look', undefined, { auth: false }),
};

export const ugcApi = {
  featured: () => api.get<{ success: boolean; data: UgcItem[] }>('/ugc/featured', undefined, { auth: false }),
};
