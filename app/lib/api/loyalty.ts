import apiClient from './client';

export interface LoyaltyPointsEntry {
  orderId?: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface LoyaltyBalance {
  balance: number;
  history: LoyaltyPointsEntry[];
}

export interface RedeemPointsData {
  points: number;
}

export const loyaltyApi = {
  getBalance: async () => {
    const response = await apiClient.get('/loyalty/balance');
    return response.data;
  },

  getHistory: async (params?: { page?: number; limit?: number }) => {
    const response = await apiClient.get('/loyalty/history', { params });
    return response.data;
  },

  redeemPoints: async (data: RedeemPointsData) => {
    const response = await apiClient.post('/loyalty/redeem', data);
    return response.data;
  },
};

