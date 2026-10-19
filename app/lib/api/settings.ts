import apiClient from './client';

export interface PublicSettings {
  codConfirmation: {
    enabled: boolean;
    defaultAmount: number;
    fixedOptions: number[];
    mode: 'fixed' | 'percent' | 'slab';
    minOrderValueForCOD: number;
    maxOrderValueForCOD?: number;
  };
  shipping: {
    freeShippingThreshold: number;
    flatShippingCost: number;
    codShippingExtra: number;
  };
  payments: {
    razorpayEnabled: boolean;
    razorpayKeyId: string;
    codEnabled: boolean;
    upiEnabled: boolean;
    cardEnabled: boolean;
    netbankingEnabled: boolean;
    walletEnabled: boolean;
  };
  shipment: { provider: string; shiprocketEnabled: boolean };
  refunds?: { allowCustomerCancelHours: number | null; codAdvanceRefundable: boolean };
  whatsapp: { enabled: boolean; supportNumber: string };
  storefront: { banners: Array<{ image: string; title: string; subtitle?: string; link: string; isActive: boolean }>; announcement: string };
}

export interface CODQuote {
  codAllowed: boolean;
  advance: number;
  balance: number;
  mode: string;
  reason: string;
}

let cache: { data: PublicSettings; at: number } | null = null;

export const settingsApi = {
  async getPublic(force = false): Promise<PublicSettings> {
    if (!force && cache && Date.now() - cache.at < 5 * 60 * 1000) return cache.data;
    const res = await apiClient.get('/settings');
    cache = { data: res.data.data, at: Date.now() };
    return res.data.data;
  },
  async getAdmin(): Promise<any> {
    const res = await apiClient.get('/settings/admin');
    return res.data.data;
  },
  async updateAdmin(payload: any): Promise<any> {
    const res = await apiClient.put('/settings/admin', payload);
    cache = null;
    return res.data.data;
  },
  async codQuote(orderValue: number, pincode?: string): Promise<CODQuote> {
    const res = await apiClient.post('/settings/cod-quote', { orderValue, pincode });
    return res.data.data;
  },
};
