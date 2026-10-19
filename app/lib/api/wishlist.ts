import apiClient from './client';
import type { IProduct } from './types';

export interface WishlistResponse {
  success: boolean;
  data: IProduct[];
}

export interface CheckWishlistResponse {
  success: boolean;
  data: {
    isInWishlist: boolean;
  };
}

/**
 * Get user wishlist
 */
export const getWishlist = async (): Promise<WishlistResponse> => {
  const response = await apiClient.get<WishlistResponse>('/wishlist');
  return response.data;
};

/**
 * Add product to wishlist
 */
export const addToWishlist = async (productId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    `/wishlist/${productId}`
  );
  return response.data;
};

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = async (productId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(
    `/wishlist/${productId}`
  );
  return response.data;
};

/**
 * Check if product is in wishlist
 */
export const checkWishlist = async (productId: string): Promise<CheckWishlistResponse> => {
  const response = await apiClient.get<CheckWishlistResponse>(`/wishlist/${productId}/check`);
  return response.data;
};
