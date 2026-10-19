import apiClient from './client';

export interface UgcItem {
  _id: string;
  source: 'customer' | 'instagram' | 'admin';
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  permalink?: string;
  customerName?: string;
  caption?: string;
  likes?: number;
  productId?: { _id: string; name: string; price: number; images?: Array<string | { url: string }> } | string;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
}

export const ugcApi = {
  async featured(): Promise<UgcItem[]> {
    const res = await apiClient.get('/ugc/featured');
    return res.data.data || [];
  },
  async feed(): Promise<UgcItem[]> {
    const res = await apiClient.get('/ugc/feed');
    return res.data.data || [];
  },
  async adminList(source?: string): Promise<UgcItem[]> {
    const res = await apiClient.get('/ugc/admin', { params: source ? { source } : {} });
    return res.data.data || [];
  },
  async create(payload: Partial<UgcItem>): Promise<UgcItem> {
    const res = await apiClient.post('/ugc/admin', payload);
    return res.data.data;
  },
  async update(id: string, payload: Partial<UgcItem>): Promise<UgcItem> {
    const res = await apiClient.put(`/ugc/admin/${id}`, payload);
    return res.data.data;
  },
  async remove(id: string) {
    const res = await apiClient.delete(`/ugc/admin/${id}`);
    return res.data;
  },
  async syncInstagram() {
    const res = await apiClient.post('/ugc/admin/sync-instagram');
    return res.data;
  },
};
