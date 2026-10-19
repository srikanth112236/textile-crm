import apiClient from './client';

export interface Discount {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiry: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  description?: string;
  firstOrderOnly?: boolean;
  minItems?: number;
  applicableCategories?: string[];
  freeShipping?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountData {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiry: string;
  usageLimit?: number;
  description?: string;
  isActive?: boolean;
  firstOrderOnly?: boolean;
  minItems?: number;
  applicableCategories?: string[];
  freeShipping?: boolean;
}

export interface UpdateDiscountData {
  code?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiry?: string;
  usageLimit?: number;
  description?: string;
  isActive?: boolean;
  firstOrderOnly?: boolean;
  minItems?: number;
  applicableCategories?: string[] | null;
  freeShipping?: boolean;
}

export const discountsApi = {
  getDiscounts: async (params?: { isActive?: boolean; expired?: boolean }) => {
    const response = await apiClient.get('/discounts', { params });
    return response.data;
  },

  getDiscount: async (id: string) => {
    const response = await apiClient.get(`/discounts/${id}`);
    return response.data;
  },

  createDiscount: async (data: CreateDiscountData) => {
    const response = await apiClient.post('/discounts', data);
    return response.data;
  },

  updateDiscount: async (id: string, data: UpdateDiscountData) => {
    const response = await apiClient.put(`/discounts/${id}`, data);
    return response.data;
  },

  deleteDiscount: async (id: string) => {
    const response = await apiClient.delete(`/discounts/${id}`);
    return response.data;
  },
};

