import apiClient from './client';

export const alertsApi = {
  async subscribeBackInStock(payload: { productId: string; size?: string; contact: string; whatsappConsent?: boolean }) {
    const res = await apiClient.post('/stock-alerts/subscribe', payload);
    return res.data;
  },
  async subscribePriceAlert(productId: string) {
    const res = await apiClient.post('/price-alerts/subscribe', { productId });
    return res.data;
  },
  async myPriceAlerts() {
    const res = await apiClient.get('/price-alerts/mine');
    return res.data.data;
  },
  async adminBackInStock(notified?: boolean) {
    const res = await apiClient.get('/stock-alerts/admin', { params: notified === undefined ? {} : { notified: String(notified) } });
    return res.data.data;
  },
  async adminPriceAlerts() {
    const res = await apiClient.get('/price-alerts/admin');
    return res.data.data;
  },
};

export const otpApi = {
  async send(phone: string) {
    const res = await apiClient.post('/auth/otp/send', { phone });
    return res.data as { success: boolean; message: string; debugCode?: string };
  },
  async verify(phone: string, code: string, name?: string) {
    const res = await apiClient.post('/auth/otp/verify', { phone, code, name });
    return res.data;
  },
};
