import apiClient from './client';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PACKED = 'packed',
  PARTIALLY_FULFILLED = 'partially_fulfilled',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  ON_HOLD = 'on_hold',
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum OrderFlag {
  NONE = 'none',
  FRAGILE = 'fragile',
  GIFT = 'gift',
  INTERNATIONAL = 'international',
  VIP_CUSTOMER = 'vip_customer',
  FRAUD_REVIEW = 'fraud_review',
  SPECIAL_HANDLING = 'special_handling',
}

export interface OrderItem {
  productId: string;
  product?: {
    _id: string;
    name: string;
    images: (string | { url: string; altText?: string })[];
    sku: string;
    description?: string;
    price?: number;
  };
  quantity: number;
  variations?: Array<{ name: string; value: string }>;
  price: number;
  subtotal: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface OrderNote {
  _id?: string;
  content: string;
  type: 'internal' | 'customer' | 'system';
  createdBy: string | { name: string; email: string };
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderTimelineEvent {
  _id?: string;
  event: string;
  description?: string;
  type: 'status_change' | 'note_added' | 'payment' | 'fulfillment' | 'system';
  metadata?: Record<string, any>;
  createdBy?: string | { name: string; email: string };
  createdAt: string;
}

export interface Order {
  _id: string;
  userId: string | { name: string; email: string };
  orderNumber: string;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  shippingCost?: number;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  paymentNotes?: string;
  refundAmount?: number;
  refundNotes?: string;
  refundMethod?: 'source' | 'upi' | 'bank';
  refundUpiId?: string;
  refundBankName?: string;
  refundBankAccount?: string;
  refundBankIfsc?: string;
  refundStatus?: 'none' | 'pending' | 'processing' | 'completed';
  refundCompletedAt?: string;
  refundReference?: string;
  cancelledBy?: string;
  cancelledReason?: string;
  // Phase 9 additions
  priority: OrderPriority;
  flags: OrderFlag[];
  notes: OrderNote[];
  timeline: OrderTimelineEvent[];
  assignedTo?: string | { name: string; email: string };
  assignedToName?: string;
  internalReference?: string;
  customerNotes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  fulfilledAt?: string;
  isArchived?: boolean;
  tags?: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
  // Phase 1: Razorpay + COD
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  codAdvancePaid?: number;
  codBalance?: number;
  // Phase 2: Shiprocket
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  shiprocketAWB?: string;
  shiprocketCourier?: string;
  shiprocketStatus?: string;
  pickupLocation?: string;
  packageWeightG?: number;
  packageLengthCm?: number;
  packageWidthCm?: number;
  packageHeightCm?: number;
}

export interface CreateOrderRequest {
  shippingAddressId?: string;
  shippingAddress?: ShippingAddress;
  paymentMethod?: string;
  discountCode?: string;
  loyaltyPointsRedeemed?: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  notes?: string;
}

export interface ConfirmPaymentRequest {
  notes?: string;
}

export interface RefundOrderRequest {
  refundAmount?: number;
  notes: string;
  refundMethod?: 'source' | 'upi' | 'bank';
  upiId?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface OrderResponse {
  success: boolean;
  data: Order;
  message?: string;
}

/**
 * Get user orders
 */
export const getUserOrders = async (
  page: number = 1,
  limit: number = 10,
  status?: OrderStatus
): Promise<OrdersResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) {
    params.append('status', status);
  }
  const response = await apiClient.get<OrdersResponse>(`/orders?${params.toString()}`);
  return response.data;
};

/**
 * Get single order
 */
export const getOrder = async (orderId: string): Promise<OrderResponse> => {
  const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`);
  return response.data;
};

/**
 * Create order from cart
 */
export const createOrder = async (data: CreateOrderRequest): Promise<OrderResponse> => {
  const response = await apiClient.post<OrderResponse>('/orders', data);
  return response.data;
};

/**
 * Cancel order
 */
export const cancelOrder = async (
  orderId: string,
  data?: CancelOrderRequest
): Promise<OrderResponse> => {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/cancel`, data || {});
  return response.data;
};

/**
 * Repeat order
 */
export const repeatOrder = async (orderId: string): Promise<OrderResponse> => {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/repeat`, {});
  return response.data;
};

/**
 * Get all orders (Admin only)
 */
export const getAllOrders = async (
  page: number = 1,
  limit: number = 20,
  status?: OrderStatus,
  paymentStatus?: PaymentStatus,
  userId?: string
): Promise<OrdersResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) {
    params.append('status', status);
  }
  if (paymentStatus) {
    params.append('paymentStatus', paymentStatus);
  }
  if (userId) {
    params.append('userId', userId);
  }
  const response = await apiClient.get<OrdersResponse>(`/orders/admin/all?${params.toString()}`);
  return response.data;
};

/**
 * Update order status (Admin only)
 */
export const updateOrderStatus = async (
  orderId: string,
  data: UpdateOrderStatusRequest
): Promise<OrderResponse> => {
  const response = await apiClient.put<OrderResponse>(`/orders/admin/${orderId}/status`, data);
  return response.data;
};

/**
 * Confirm payment manually (Admin only)
 */
export const confirmPayment = async (
  orderId: string,
  data?: ConfirmPaymentRequest
): Promise<OrderResponse> => {
  const response = await apiClient.post<OrderResponse>(
    `/orders/admin/${orderId}/payment/confirm`,
    data || {}
  );
  return response.data;
};

/**
 * Refund order (Admin only)
 */
export const refundOrder = async (
  orderId: string,
  data: RefundOrderRequest
): Promise<OrderResponse> => {
  const response = await apiClient.post<OrderResponse>(`/orders/admin/${orderId}/refund`, data);
  return response.data;
};

/**
 * Complete a manual refund (Admin only) — after paying via stored UPI/bank.
 */
export const completeManualRefund = async (
  orderId: string,
  data: { reference: string; notes?: string }
): Promise<OrderResponse> => {
  const response = await apiClient.post<OrderResponse>(`/orders/admin/${orderId}/refund-complete`, data);
  return response.data;
};

// =====================================================
// PHASE 9: ORDER MANAGEMENT ENHANCEMENTS
// =====================================================

export interface AddOrderNoteRequest {
  content: string;
  type?: 'internal' | 'customer' | 'system';
}

export interface UpdateOrderPriorityRequest {
  priority: OrderPriority;
}

export interface AssignOrderRequest {
  assignedTo: string | null;
}

export interface BulkUpdateOrdersRequest {
  orderIds: string[];
  status?: OrderStatus;
  priority?: OrderPriority;
  assignedTo?: string | null;
  addFlag?: OrderFlag;
  removeFlag?: OrderFlag;
}

export interface UpdateTrackingRequest {
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

export interface OrderTimelineResponse {
  success: boolean;
  data: {
    orderNumber: string;
    timeline: OrderTimelineEvent[];
    notes: OrderNote[];
  };
}

export interface BulkUpdateResponse {
  success: boolean;
  message: string;
  data: {
    updated: number;
    failed: number;
    errors: string[];
  };
}

export interface ExportOrdersResponse {
  success: boolean;
  format: 'json' | 'csv';
  data: any;
}

/**
 * Add note to order (Admin only)
 */
export const addOrderNote = async (
  orderId: string,
  data: AddOrderNoteRequest
): Promise<OrderResponse> => {
  const response = await apiClient.post<OrderResponse>(`/orders/admin/${orderId}/notes`, data);
  return response.data;
};

/**
 * Update order priority (Admin only)
 */
export const updateOrderPriority = async (
  orderId: string,
  data: UpdateOrderPriorityRequest
): Promise<OrderResponse> => {
  const response = await apiClient.put<OrderResponse>(`/orders/admin/${orderId}/priority`, data);
  return response.data;
};

/**
 * Assign order to admin (Admin only)
 */
export const assignOrder = async (
  orderId: string,
  data: AssignOrderRequest
): Promise<OrderResponse> => {
  const response = await apiClient.put<OrderResponse>(`/orders/admin/${orderId}/assign`, data);
  return response.data;
};

/**
 * Bulk update orders (Admin only)
 */
export const bulkUpdateOrders = async (
  data: BulkUpdateOrdersRequest
): Promise<BulkUpdateResponse> => {
  const response = await apiClient.post<BulkUpdateResponse>('/orders/admin/bulk-update', data);
  return response.data;
};

/**
 * Update tracking information (Admin only)
 */
export const updateTracking = async (
  orderId: string,
  data: UpdateTrackingRequest
): Promise<OrderResponse> => {
  const response = await apiClient.put<OrderResponse>(`/orders/admin/${orderId}/tracking`, data);
  return response.data;
};

/**
 * Get order timeline (Admin only)
 */
export const getOrderTimeline = async (orderId: string): Promise<OrderTimelineResponse> => {
  const response = await apiClient.get<OrderTimelineResponse>(`/orders/admin/${orderId}/timeline`);
  return response.data;
};

/**
 * Toggle archive order (Admin only)
 */
export const toggleArchiveOrder = async (orderId: string): Promise<{ success: boolean; message: string; data: { isArchived: boolean } }> => {
  const response = await apiClient.put<{ success: boolean; message: string; data: { isArchived: boolean } }>(`/orders/admin/${orderId}/archive`, {});
  return response.data;
};

/**
 * Export orders (Admin only)
 */
export const exportOrders = async (params?: {
  startDate?: string;
  endDate?: string;
  status?: OrderStatus;
  format?: 'json' | 'csv';
}): Promise<ExportOrdersResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.format) queryParams.append('format', params.format);
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const response = await apiClient.get<ExportOrdersResponse>(`/orders/admin/export${queryString}`);
  return response.data;
};

/**
 * Get all orders with enhanced filters (Admin only)
 */
export const getAllOrdersEnhanced = async (params: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  userId?: string;
  priority?: OrderPriority;
  assignedTo?: string;
  isArchived?: boolean;
  search?: string;
}): Promise<OrdersResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
  if (params.userId) queryParams.append('userId', params.userId);
  if (params.priority) queryParams.append('priority', params.priority);
  if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
  if (params.isArchived !== undefined) queryParams.append('isArchived', params.isArchived.toString());
  if (params.search) queryParams.append('search', params.search);
  
  const response = await apiClient.get<OrdersResponse>(`/orders/admin/all?${queryParams.toString()}`);
  return response.data;
};

