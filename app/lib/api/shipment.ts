import apiClient from './client';

export interface ServiceabilityResult {
  success: boolean;
  mock?: boolean;
  data: any;
}

export const shipmentApi = {
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
  async shipOrder(orderId: string) {
    const res = await apiClient.post(`/shipment/orders/${orderId}/ship`);
    return res.data;
  },
};
