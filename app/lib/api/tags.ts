import apiClient from './client';

export interface ITag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TagsResponse {
  success: boolean;
  data: ITag[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TagResponse {
  success: boolean;
  data: ITag;
  message?: string;
}

export interface TagAnalytics {
  success: boolean;
  data: {
    popularTags: Array<{ name: string; slug: string; usageCount: number; color?: string }>;
    totalTags: number;
    unusedTags: number;
  };
}

export const tagsApi = {
  // Get all tags
  getTags: async (active?: boolean, page: number = 1, limit: number = 50): Promise<TagsResponse> => {
    const params = new URLSearchParams();
    if (active !== undefined) params.append('active', active.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await apiClient.get(`/tags?${params.toString()}`);
    return response.data;
  },

  // Get single tag
  getTag: async (id: string): Promise<TagResponse> => {
    const response = await apiClient.get(`/tags/${id}`);
    return response.data;
  },

  // Create tag
  createTag: async (tagData: {
    name: string;
    slug?: string;
    description?: string;
    color?: string;
    isActive?: boolean;
  }): Promise<TagResponse> => {
    const response = await apiClient.post('/tags', tagData);
    return response.data;
  },

  // Update tag
  updateTag: async (id: string, tagData: {
    name?: string;
    slug?: string;
    description?: string;
    color?: string;
    isActive?: boolean;
  }): Promise<TagResponse> => {
    const response = await apiClient.put(`/tags/${id}`, tagData);
    return response.data;
  },

  // Delete tag
  deleteTag: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/tags/${id}`);
    return response.data;
  },

  // Get tag analytics
  getTagAnalytics: async (limit: number = 10): Promise<TagAnalytics> => {
    const response = await apiClient.get(`/tags/analytics/usage?limit=${limit}`);
    return response.data;
  },
};

