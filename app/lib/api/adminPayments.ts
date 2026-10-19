import apiClient from './client';

export interface LedgerPayment {
  _id: string;
  userId: string;
  orderId?: { _id: string; orderNumber: string; total: number; status: string; paymentStatus: string; paymentMethod: string } | string;
  orderNumber?: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  amountPaise: number;
  currency: string;
  method?: string;
  purpose: 'full' | 'cod_advance';
  status: string;
  createdAt: string;
}

export const adminPaymentsApi = {
  async ledger(params: { page?: number; limit?: number; status?: string; purpose?: string; search?: string } = {}) {
    const res = await apiClient.get('/payments/ledger', { params });
    return res.data.data as {
      payments: LedgerPayment[];
      pagination: { page: number; limit: number; total: number; pages: number };
      summary: { byStatus: Array<{ _id: string; count: number; amount: number }>; byPurpose: Array<{ _id: string; count: number; amount: number }> };
    };
  },
  async ordersSummary() {
    const res = await apiClient.get('/payments/orders-summary');
    return res.data.data as { byMethod: Array<{ _id: string; count: number; total: number; advancePaid: number; balanceDue: number }>; byPayStatus: Array<{ _id: string; count: number; total: number }> };
  },
  async refund(orderId: string, amount?: number, notes?: string) {
    const res = await apiClient.post('/payments/refund', { orderId, amount, notes });
    return res.data;
  },
};

export const adminShipmentApi = {
  async overview() {
    const res = await apiClient.get('/shipment/overview');
    return res.data.data as {
      byCourier: Array<{ _id: string; count: number }>;
      byShipStatus: Array<{ _id: string; count: number }>;
      byOrderStatus: Array<{ _id: string; count: number }>;
      unshippedQueue: any[];
      ndrWatch: any[];
    };
  },
  async cancelShipment(orderId: string) {
    const res = await apiClient.post(`/shipment/orders/${orderId}/cancel-shipment`);
    return res.data;
  },
  async assignAwb(orderId: string, courier_id?: string, force?: boolean) {
    const res = await apiClient.post(`/shipment/orders/${orderId}/assign-awb`, { courier_id, force });
    return res.data as { success: boolean; duplicate?: boolean; data: { awb: string; courier: string; shiprocket: any } };
  },
  async requestPickup(orderId: string) {
    const res = await apiClient.post(`/shipment/orders/${orderId}/pickup`);
    return res.data;
  },
  async getLabel(orderId: string) {
    const res = await apiClient.post(`/shipment/orders/${orderId}/label`);
    return res.data as { success: boolean; data: { url: string | null; shiprocket: any } };
  },
  async getInvoice(orderId: string) {
    const res = await apiClient.post(`/shipment/orders/${orderId}/invoice`);
    return res.data as { success: boolean; data: { url: string | null; shiprocket: any } };
  },
  async getManifest(orderId: string) {
    const res = await apiClient.post(`/shipment/orders/${orderId}/manifest`);
    return res.data as { success: boolean; data: { url: string | null; shiprocket: any } };
  },
  async syncStale(limit = 20) {
    const res = await apiClient.post('/shipment/sync', { limit });
    return res.data as { success: boolean; data: { checked: number; updated: number; failed: number; skipped: boolean; details: any[] } };
  },
};
