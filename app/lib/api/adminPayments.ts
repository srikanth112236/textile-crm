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
  refundId?: string;
  refundAmount?: number;
  createdAt: string;
}

export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type RefundDestination = 'source' | 'upi' | 'bank';

export interface RefundRecord {
  _id: string;
  orderId: string;
  orderNumber: string;
  customer: string;
  amount: number;
  status: RefundStatus;
  destination: RefundDestination;
  method: 'razorpay' | 'manual';
  notes: string;
  reference?: string;
  razorpayRefundId?: string;
  razorpayPaymentId?: string;
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
  orderTotal?: number;
  collected?: number;
  refundedBefore?: number;
  refundedAfter?: number;
  legacy?: boolean;
  canComplete?: boolean;
  canRetry?: boolean;
}

export interface RefundSummary {
  count: number;
  completedCount: number;
  completedAmount: number;
  processingCount: number;
  processingAmount: number;
  needsAction: number;
  failedCount: number;
  failedAmount: number;
  byStatus: Array<{ status: RefundStatus; count: number; amount: number }>;
  byDestination: Array<{ destination: RefundDestination; count: number; amount: number }>;
}

export interface RefundableOrder {
  _id: string;
  orderNumber: string;
  customer: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  collected: number;
  refunded: number;
  refundable: number;
  online: boolean;
  mode: 'razorpay' | 'manual';
  activeRefund: { _id: string; status: RefundStatus; amount: number } | null;
  blocker?: string;
}

export interface RefundContextData {
  order: {
    _id: string;
    orderNumber: string;
    customer: string;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
    refundAmount: number;
    refundStatus: string;
  };
  context: {
    collected: number;
    refunded: number;
    refundable: number;
    online: boolean;
    mode: 'razorpay' | 'manual';
    paymentId?: string;
    paymentMethod: string;
    activeRefund: { _id: string; status: RefundStatus; amount: number } | null;
    canRefund: boolean;
    blocker?: string;
  };
  refunds: RefundRecord[];
}

export interface PaymentsOverview {
  online: {
    capturedCount: number;
    capturedAmount: number;
    refundedAmount: number;
    netCollected: number;
    failedCount: number;
  };
  cod: {
    orders: number;
    toCollect: number;
    advancePaid: number;
    balanceDue: number;
  };
  refunds: RefundSummary;
  orders: {
    total: number;
    confirmed: number;
    pending: number;
    partiallyRefunded: number;
    refunded: number;
    failed: number;
  };
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
  async overview() {
    const res = await apiClient.get('/payments/overview');
    return res.data.data as PaymentsOverview;
  },
  async ordersSummary() {
    const res = await apiClient.get('/payments/orders-summary');
    return res.data.data as { byMethod: Array<{ _id: string; count: number; total: number; advancePaid: number; balanceDue: number }>; byPayStatus: Array<{ _id: string; count: number; total: number }> };
  },
  async refunds(params: { page?: number; limit?: number; status?: string; search?: string; from?: string; to?: string } = {}) {
    const res = await apiClient.get('/payments/refunds', { params });
    return res.data.data as {
      refunds: RefundRecord[];
      pagination: { page: number; limit: number; total: number; pages: number };
      summary: RefundSummary;
    };
  },
  async refundSummary() {
    const res = await apiClient.get('/payments/refunds/summary');
    return res.data.data as RefundSummary;
  },
  async refundableOrders(params: { search?: string } = {}) {
    const res = await apiClient.get('/payments/refundable-orders', { params });
    return res.data.data as { orders: RefundableOrder[] };
  },
  async refundContext(orderId: string) {
    const res = await apiClient.get(`/payments/orders/${orderId}/refund-context`);
    return res.data.data as RefundContextData;
  },
  async createRefund(data: {
    orderId: string;
    amount?: number;
    notes: string;
    refundMethod?: RefundDestination;
    upiId?: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
  }) {
    const res = await apiClient.post('/payments/refunds', data);
    return res.data as { success: boolean; message: string; data: any };
  },
  async completeRefund(refundId: string, data: { reference: string; notes?: string; orderId?: string }) {
    const res = await apiClient.post(`/payments/refunds/${refundId}/complete`, data);
    return res.data as { success: boolean; message: string; data: any };
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
