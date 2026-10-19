import apiClient from './client';
import type { ICategory } from './types';

export interface CategoriesResponse {
  success: boolean;
  data: ICategory[];
}

export interface CategoryResponse {
  success: boolean;
  data: ICategory;
  message?: string;
}

export const categoriesApi = {
  // Get all categories
  getCategories: async (status?: string): Promise<CategoriesResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await apiClient.get(`/categories?${params.toString()}`);
    return response.data;
  },

  // Get single category
  getCategory: async (id: string): Promise<CategoryResponse> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },

  // Create category
  createCategory: async (categoryData: Partial<ICategory>): Promise<CategoryResponse> => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (id: string, categoryData: Partial<ICategory>): Promise<CategoryResponse> => {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
};

