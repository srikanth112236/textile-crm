import apiClient from './client';

export interface ShopLook {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  productIds: Array<{ _id: string; name: string; price: number; compareAtPrice?: number; images?: Array<string | { url: string }>; stock: number; status: string }>;
  bundlePrice?: number;
  isActive: boolean;
  position: number;
}

export const shopLookApi = {
  async list(): Promise<ShopLook[]> {
    const res = await apiClient.get('/shop-look');
    return res.data.data || [];
  },
  async adminList(): Promise<ShopLook[]> {
    const res = await apiClient.get('/shop-look/admin');
    return res.data.data || [];
  },
  async create(payload: { title: string; description?: string; imageUrl: string; productIds: string[]; bundlePrice?: number; isActive?: boolean; position?: number }) {
    const res = await apiClient.post('/shop-look/admin', payload);
    return res.data.data;
  },
  async update(id: string, payload: { title: string; description?: string; imageUrl: string; productIds: string[]; bundlePrice?: number; isActive?: boolean; position?: number }) {
    const res = await apiClient.put(`/shop-look/admin/${id}`, payload);
    return res.data.data;
  },
  async remove(id: string) {
    const res = await apiClient.delete(`/shop-look/admin/${id}`);
    return res.data;
  },
};
