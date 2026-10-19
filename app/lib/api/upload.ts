import apiClient from './client';

export interface UploadResponse {
  success: boolean;
  url?: string;
  imageUrl?: string; // For backward compatibility
  message?: string;
}

export const uploadApi = {
  uploadFile: async (formData: FormData, type: 'product' | 'review' = 'product'): Promise<UploadResponse> => {
    // Use appropriate upload endpoint
    const endpoint = type === 'review' ? '/upload/review' : '/upload/product';
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

