import apiClient from './client';

export interface UploadResponse {
  success: boolean;
  url?: string;
  imageUrl?: string; // For backward compatibility
  message?: string;
}

export const uploadApi = {
  uploadFile: async (
    formData: FormData,
    type: 'product' | 'review' | 'category' | 'shoplook' = 'product'
  ): Promise<UploadResponse> => {
    // Use appropriate upload endpoint
    const endpoint =
      type === 'category'
        ? '/upload/category'
        : type === 'review'
          ? '/upload/review'
          : type === 'shoplook'
            ? '/upload/shoplook'
            : '/upload/product';
    const response = await apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      ...response.data,
      url: response.data.url || response.data.imageUrl,
    };
  },
};

