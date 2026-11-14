import apiClient from './client';

export interface ServiceabilityResult {
  success: boolean;
  mock?: boolean;
  data: any;
}

export interface ShippingQuote {
  available: boolean;
  /** What the customer pays (0 when free shipping applies). */
  charge: number;
  /** Real courier cost, even when the customer gets free shipping. */
  actualCost: number;
  freeShipping: boolean;
  source: 'shiprocket' | 'flat' | 'free';
  courierName?: string;
  etd?: string;
  estimatedDays?: string;
  weightG: number;
  chargeableKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  cod: boolean;
  quotedAt: string;
  reason?: string;
}

export interface ShippingQuoteRequest {
  pincode: string;
  paymentMethod?: string;
  orderValue?: number;
  items: Array<{ productId: string; quantity: number }>;
}

export interface TrackingActivity {
  date: string;
  status?: string | number;
  activity: string;
  location?: string;
  'sr-status-label'?: string;
}

export interface ShipmentTrackingData {
  track_status?: number;
  shipment_status?: number;
  shipment_track?: Array<{
    awb_code?: string;
    courier_name?: string;
    current_status?: string;
    delivered_date?: string;
    edd?: string | null;
    destination?: string;
    origin?: string;
    weight?: string;
    updated_time_stamp?: string;
    pod?: string;
    consignee_name?: string;
  }>;
  shipment_track_activities?: TrackingActivity[] | null;
  track_url?: string;
  etd?: string;
  error?: string;
  ndr?: { reason?: string; attempts?: number; undelivered_reason_code?: string } | null;
  npr?: { reason?: string; attempts?: number; pick_exception_reason_code?: string } | null;
}

export interface SyncTrackingResult {
  orderId: string;
  orderStatus: string;
  courierStatus: string;
  awb: string;
  courier: string;
  etd: string | null;
  trackingUrl: string;
  updated: boolean;
  message?: string;
  tracking?: { tracking_data?: ShipmentTrackingData } & ShipmentTrackingData;
}

export const shipmentApi = {
  async quote(payload: ShippingQuoteRequest): Promise<{ success: boolean; data: ShippingQuote }> {
    const res = await apiClient.post('/shipment/quote', payload);
    return res.data;
  },
  async serviceability(delivery: string, weightG = 500, cod = true): Promise<ServiceabilityResult> {
    const res = await apiClient.get('/shipment/serviceability', { params: { delivery, weightG, cod: cod ? 'true' : 'false' } });
    return res.data;
  },
  async publicTrack(orderNumber: string) {
    const res = await apiClient.get(`/shipment/track-order/${encodeURIComponent(orderNumber)}`);
    return res.data.data;
  },
  async liveTrack(awb: string) {
    const res = await apiClient.get(`/shipment/track/${encodeURIComponent(awb)}`);
    return res.data.data;
  },
  async syncTracking(orderId: string): Promise<{ success: boolean; data: SyncTrackingResult }> {
    const res = await apiClient.post(`/shipment/orders/${orderId}/sync-tracking`);
    return res.data;
  },
  async shipOrder(orderId: string) {
    const res = await apiClient.post(`/shipment/orders/${orderId}/ship`);
    return res.data;
  },
};
