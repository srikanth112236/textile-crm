import apiClient from './client';

export interface RmaItem {
  productId: string;
  quantity: number;
  reason: string;
  size?: string;
  exchangeSize?: string;
}

export const returnsApi = {
  async create(payload: { orderId: string; type: 'return' | 'exchange'; items: RmaItem[]; reason: string; refundMethod?: 'source' | 'upi' | 'bank'; upiId?: string; bankAccountName?: string; bankAccountNumber?: string; bankIfsc?: string }) {
    const res = await apiClient.post('/returns', payload);
    return res.data;
  },
  async mine() {
    const res = await apiClient.get('/returns/mine');
    return res.data.data;
  },
  async adminList(status?: string) {
    const res = await apiClient.get('/returns/admin', { params: status ? { status } : {} });
    return res.data.data;
  },
  async adminUpdate(id: string, payload: { status: string; adminNote?: string; refundAmount?: number }) {
    const res = await apiClient.put(`/returns/admin/${id}`, payload);
    return res.data;
  },
  async sizeReport(days = 90) {
    const res = await apiClient.get('/returns/admin/size-report', { params: { days } });
    return res.data.data as { days: number; minReturns: number; rows: Array<{ productId: string; name: string; sku: string; total: number; sizeIssues: number; rate: number; sizes: Record<string, number> }>; flagged: Array<{ productId: string; name: string }> };
  },
};
