import apiClient from './client';

export interface CartItem {
  productId: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: (string | { url: string; altText?: string })[];
    stock: number;
    status: string;
    sku: string;
  };
  quantity: number;
  variations?: Array<{ name: string; value: string }>;
  price: number;
  subtotal: number;
  addedAt: string;
}

export interface CartResponse {
  success: boolean;
  data: {
    items: CartItem[];
    total: number;
    itemCount: number;
  };
  message?: string;
}

export interface AddItemRequest {
  productId: string;
  quantity: number;
  variations?: Array<{ name: string; value: string }>;
}

/**
 * Get user cart
 */
export const getCart = async (): Promise<CartResponse> => {
  const response = await apiClient.get<CartResponse>('/cart');
  return response.data;
};

/**
 * Add item to cart
 */
export const addItemToCart = async (data: AddItemRequest): Promise<CartResponse> => {
  const response = await apiClient.post<CartResponse>('/cart/items', data);
  return response.data;
};

/**
 * Update cart item quantity
 */
export const updateCartItem = async (
  itemId: number,
  quantity: number
): Promise<CartResponse> => {
  const response = await apiClient.put<CartResponse>(`/cart/items/${itemId}`, {
    quantity,
  });
  return response.data;
};

/**
 * Remove item from cart
 */
export const removeCartItem = async (itemId: number): Promise<CartResponse> => {
  const response = await apiClient.delete<CartResponse>(`/cart/items/${itemId}`);
  return response.data;
};

/**
 * Clear cart
 */
export const clearCart = async (): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>('/cart');
  return response.data;
};


