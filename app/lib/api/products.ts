import apiClient from './client';
import type { IProduct, ICategory } from './types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  lowStock?: boolean;
  recent?: boolean;
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
}

export interface ProductsResponse {
  success: boolean;
  data: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  fallback?: {
    relaxed: boolean;
    strategy?: 'stopwords' | 'any-word' | 'category' | 'popular' | string;
    appliedQuery?: string;
  } | null;
}

export interface ProductResponse {
  success: boolean;
  data: IProduct;
  message?: string;
}

export const productsApi = {
  // Get all products with filters
  getProducts: async (filters: ProductFilters = {}): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);
    if (filters.lowStock) params.append('lowStock', 'true');
    if (filters.recent) params.append('recent', 'true');
    if (filters.color) params.append('color', filters.color);
    if (filters.size) params.append('size', filters.size);
    if (filters.fit) params.append('fit', filters.fit);
    if (filters.fabric) params.append('fabric', filters.fabric);
    if (filters.pattern) params.append('pattern', filters.pattern);
    if (filters.occasion) params.append('occasion', filters.occasion);
    if (filters.minRating) params.append('minRating', filters.minRating.toString());
    if (filters.minDiscount) params.append('minDiscount', filters.minDiscount.toString());
    if (filters.inStock) params.append('inStock', 'true');
    if (filters.badge) params.append('badge', filters.badge);

    const response = await apiClient.get(`/products?${params.toString()}`);
    return response.data;
  },

  // Get dynamic available product filters (categories, colors, sizes, price bounds)
  getFilters: async (filters: ProductFilters = {}): Promise<{
    success: boolean;
    data: {
      categories: ICategory[];
      colors: Array<{ name: string; hex: string }>;
      sizes: string[];
      minPrice: number;
      maxPrice: number;
      fits: string[];
      fabrics: string[];
      patterns: string[];
      occasions: string[];
      badges: string[];
    };
  }> => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/products/filters?${params.toString()}`);
    return response.data;
  },

  // Get single product
  getProduct: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  // Create product
  createProduct: async (productData: Partial<IProduct>): Promise<ProductResponse> => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  // Update product
  updateProduct: async (id: string, productData: Partial<IProduct>): Promise<ProductResponse> => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  // Delete product
  deleteProduct: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  // Search products
  searchProducts: async (query: string, filters: ProductFilters = {}): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    params.append('q', query);
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

    const response = await apiClient.get(`/products/search?${params.toString()}`);
    return response.data;
  },

  // Get product recommendations
  getRecommendations: async (productId: string, limit: number = 4): Promise<{ success: boolean; data: IProduct[] }> => {
    const response = await apiClient.get(`/products/${productId}/recommendations?limit=${limit}`);
    return response.data;
  },

  // Get product reviews (Phase 8 enhanced with sorting)
  getReviews: async (
    productId: string, 
    page: number = 1, 
    limit: number = 10,
    sort: 'newest' | 'highest' | 'lowest' | 'most_helpful' = 'newest'
  ): Promise<{
    success: boolean;
    data: Array<{
      _id: string;
      userId: string;
      userName?: string;
      rating: number;
      comment: string;
      photos?: Array<{ url: string; type: 'image' | 'video'; thumbnailUrl?: string }>;
      verifiedPurchase: boolean;
      helpfulCount: number;
      notHelpfulCount: number;
      userVote?: boolean;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const response = await apiClient.get(`/products/${productId}/reviews?page=${page}&limit=${limit}&sort=${sort}`);
    return response.data;
  },

  // Submit review (Phase 8 enhanced)
  submitReview: async (productId: string, review: { 
    rating: number; 
    comment: string;
    photos?: Array<{ url: string; type: 'image' | 'video'; thumbnailUrl?: string }>;
  }): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> => {
    const response = await apiClient.post(`/products/${productId}/reviews`, review);
    return response.data;
  },

  // Phase 8: Vote on review helpfulness
  voteReviewHelpful: async (productId: string, reviewId: string, isHelpful: boolean): Promise<{
    success: boolean;
    message: string;
    data: { helpfulCount: number; notHelpfulCount: number; userVote: boolean };
  }> => {
    const response = await apiClient.post(`/products/${productId}/reviews/${reviewId}/helpful`, { isHelpful });
    return response.data;
  },

  // Phase 8: Get personalized recommendations
  getPersonalizedRecommendations: async (limit: number = 20): Promise<{ success: boolean; data: IProduct[] }> => {
    try {
      const response = await apiClient.get(`/products/recommendations/personalized?limit=${limit}`);
      return response.data;
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  // Phase 8: Get recently viewed products
  getRecentlyViewed: async (limit: number = 10): Promise<{ success: boolean; data: IProduct[] }> => {
    try {
      const response = await apiClient.get(`/products/recommendations/recently-viewed?limit=${limit}`);
      return response.data;
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  // Phase 8: Get trending products
  getTrendingProducts: async (limit: number = 10): Promise<{ success: boolean; data: IProduct[] }> => {
    try {
      const response = await apiClient.get(`/products/recommendations/trending?limit=${limit}`);
      return response.data;
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  // Homepage social proof: top approved reviews across products
  getFeaturedReviews: async (limit: number = 8): Promise<{ success: boolean; data: Array<{ rating: number; comment: string; userName?: string; verifiedPurchase: boolean; helpfulCount: number; createdAt: string; photos?: Array<{ url: string }>; productId: string; productName: string; productPrice: number; productImage?: string | { url: string } }> }> => {
    try {
      const response = await apiClient.get(`/products/reviews/featured?limit=${limit}`);
      return response.data;
    } catch (e) {
      return { success: true, data: [] };
    }
  },

  // Phase 8: Admin - Get reviews with status filter
  getReviewsWithStatus: async (
    productId: string,
    status: 'pending' | 'approved' | 'rejected' | 'all' = 'all',
    page: number = 1,
    limit: number = 10,
    sort: 'newest' | 'highest' | 'lowest' | 'most_helpful' = 'newest'
  ): Promise<{
    success: boolean;
    data: Array<{
      _id: string;
      userId: string;
      userName?: string;
      rating: number;
      comment: string;
      photos?: Array<{ url: string; type: 'image' | 'video'; thumbnailUrl?: string }>;
      verifiedPurchase: boolean;
      helpfulCount: number;
      notHelpfulCount: number;
      moderationStatus?: 'pending' | 'approved' | 'rejected';
      moderationNotes?: string;
      moderatedBy?: string;
      moderatedAt?: string;
      adminReply?: {
        comment: string;
        repliedBy: string;
        repliedAt: string;
      };
      isHidden?: boolean;
      isFlagged?: boolean;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      params.append('sort', sort);
      // Always send status parameter - backend will handle 'all' appropriately
      params.append('status', status);
      const response = await apiClient.get(`/products/${productId}/reviews?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      // Provide better error message for network errors
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error' || !error.response) {
        throw new Error('Backend server is not running. Please start the server.');
      }
      throw error;
    }
  },

  // Phase 8: Admin - Get all reviews across products
  getAllReviews: async (
    status: 'pending' | 'approved' | 'rejected' | 'all' = 'pending',
    page: number = 1,
    limit: number = 20
  ): Promise<{
    success: boolean;
    data: Array<{
      _id: string;
      productId: string;
      productName: string;
      productSlug: string;
      userId: string;
      userName?: string;
      rating: number;
      comment: string;
      photos?: Array<{ url: string; type: 'image' | 'video'; thumbnailUrl?: string }>;
      verifiedPurchase: boolean;
      helpfulCount: number;
      notHelpfulCount: number;
      moderationStatus?: 'pending' | 'approved' | 'rejected';
      moderationNotes?: string;
      moderatedBy?: string;
      moderatedAt?: string;
      createdAt: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('status', status);
    const response = await apiClient.get(`/products/reviews/all?${params.toString()}`);
    return response.data;
  },

  // Phase 8: Admin - Moderate review (approve/reject)
  moderateReview: async (
    productId: string,
    reviewId: string,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> => {
    const response = await apiClient.post(`/products/${productId}/reviews/${reviewId}/moderate`, {
      status,
      notes: notes || '',
    });
    return response.data;
  },

  // Phase 8: Admin - Reply to review
  replyToReview: async (
    productId: string,
    reviewId: string,
    reply: string
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> => {
    const response = await apiClient.post(`/products/${productId}/reviews/${reviewId}/reply`, {
      reply,
    });
    return response.data;
  },

  // Phase 8: Admin - Hide/Unhide review
  toggleReviewVisibility: async (
    productId: string,
    reviewId: string,
    hide: boolean
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> => {
    const response = await apiClient.post(`/products/${productId}/reviews/${reviewId}/hide`, {
      hide,
    });
    return response.data;
  },

  // Phase 8: Admin - Flag/Unflag review
  toggleReviewFlag: async (
    productId: string,
    reviewId: string,
    flag: boolean
  ): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> => {
    const response = await apiClient.post(`/products/${productId}/reviews/${reviewId}/flag`, {
      flag,
    });
    return response.data;
  },

  // Phase 8: Admin - Delete review
  deleteReview: async (
    productId: string,
    reviewId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.delete(`/products/${productId}/reviews/${reviewId}`);
    return response.data;
  },

  // =====================================================
  // ADVANCED VARIANT APIs
  // =====================================================

  // Generate variant combinations from attributes
  generateVariantCombinations: async (data: {
    variantAttributes: IVariantAttribute[];
    basePrice: number;
    baseSku: string;
  }): Promise<{
    success: boolean;
    message: string;
    data: {
      totalCombinations: number;
      variantSKUs: IVariantSKU[];
    };
  }> => {
    const response = await apiClient.post('/products/variants/generate', data);
    return response.data;
  },

  // Validate variant SKUs for uniqueness
  validateVariantSKUs: async (data: {
    skus: string[];
    productId?: string;
  }): Promise<{
    success: boolean;
    data: {
      totalChecked: number;
      hasDuplicatesInList: boolean;
      duplicatesInList: string[];
      existsInDatabase: boolean;
      existingSkus: string[];
      isValid: boolean;
    };
  }> => {
    const response = await apiClient.post('/products/variants/validate', data);
    return response.data;
  },

  // Get product variants with statistics
  getProductVariants: async (productId: string): Promise<{
    success: boolean;
    data: {
      _id: string;
      name: string;
      sku: string;
      price: number;
      stock: number;
      hasVariants: boolean;
      variantAttributes: IVariantAttribute[];
      variantSKUs: IVariantSKU[];
      variations?: any[];
      variationOptions?: any[];
      stats?: {
        totalVariants: number;
        enabledVariants: number;
        totalStock: number;
        lowStockCount: number;
        outOfStockCount: number;
        priceRange: { min: number; max: number };
      };
    };
  }> => {
    const response = await apiClient.get(`/products/${productId}/variants`);
    return response.data;
  },

  // Bulk update variant stock
  bulkUpdateVariantStock: async (
    productId: string,
    variants: Array<{
      sku: string;
      stock: number;
      price?: number;
      isEnabled?: boolean;
    }>
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      updated: string[];
      notFound: string[];
      totalStock: number;
    };
  }> => {
    const response = await apiClient.put(`/products/${productId}/variants/bulk-stock`, { variants });
    return response.data;
  },

  // Duplicate product with all variants and attributes
  duplicateProduct: async (
    productId: string,
    options?: {
      newName?: string;
      newSku?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      product: IProduct;
      original: {
        _id: string;
        name: string;
      };
    };
  }> => {
    const response = await apiClient.post(`/products/${productId}/duplicate`, options || {});
    return response.data;
  },
};

// =====================================================
// TYPE EXPORTS FOR ADVANCED VARIANTS
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

export interface IVisibility {
  visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  featured: boolean;
  publishDate?: Date;
  unpublishDate?: Date;
  password?: string;
}

export interface IRelatedProducts {
  crossSells?: string[];
  upSells?: string[];
  frequentlyBoughtTogether?: string[];
  accessories?: string[];
}

