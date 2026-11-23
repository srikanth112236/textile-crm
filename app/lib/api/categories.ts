import apiClient from './client';
import type { ICategory } from './types';

export interface CategoriesResponse {
  success: boolean;
  data: ICategory[];
}

/** A category from the tree, flattened, with its nesting level. */
export interface FlatCategory extends ICategory {
  depth: number;
}

/**
 * The categories endpoint returns a nested tree. Anything that renders a
 * flat list/select needs to walk it, otherwise only top-level categories
 * are visible.
 */
export function flattenCategories(
  list: ICategory[],
  depth = 0,
  out: FlatCategory[] = []
): FlatCategory[] {
  for (const category of list || []) {
    out.push({ ...category, depth, children: undefined });
    if (category.children && category.children.length > 0) {
      flattenCategories(category.children, depth + 1, out);
    }
  }
  return out;
}

/** Find a category by slug anywhere in the tree (sub-categories included). */
export function findCategoryBySlug(list: ICategory[], slug: string): ICategory | null {
  for (const category of list || []) {
    if (category.slug === slug) return category;
    if (category.children && category.children.length > 0) {
      const found = findCategoryBySlug(category.children, slug);
      if (found) return found;
    }
  }
  return null;
}

export interface CategoryResponse {
  success: boolean;
  data: ICategory;
  message?: string;
}

export const categoriesApi = {
  // Get all categories
  getCategories: async (status?: string): Promise<CategoriesResponse> => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await apiClient.get(`/categories?${params.toString()}`);
      return response.data;
    } catch (error) {
      return { success: false, data: [] };
    }
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

