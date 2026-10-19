import apiClient from './client';

export interface PaymentMethods {
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  codEnabled: boolean;
  upiEnabled: boolean;
  cardEnabled: boolean;
  netbankingEnabled: boolean;
  walletEnabled: boolean;
  razorpayConfigured: boolean;
  cod: { enabled: boolean; defaultAmount: number; fixedOptions: number[]; mode: string };
}

export const paymentsApi = {
  async methods(): Promise<PaymentMethods> {
    const res = await apiClient.get('/payments/methods');
    return res.data.data;
  },
  async createOrder(amount: number, purpose: 'full' | 'cod_advance', orderId?: string, method?: string) {
    const res = await apiClient.post('/payments/create-order', { amount, purpose, orderId, method });
    return res.data.data as { keyId: string; razorpayOrderId: string; amount: number; amountPaise: number; currency: string; paymentDocId: string };
  },
  async verify(payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; orderId?: string }) {
    const res = await apiClient.post('/payments/verify', payload);
    return res.data;
  },
  async guestCreateOrder(orderId: string, phone: string, purpose: 'full' | 'cod_advance') {
    const res = await apiClient.post('/payments/guest-create-order', { orderId, phone, purpose });
    return res.data.data as { keyId: string; razorpayOrderId: string; amount: number; amountPaise: number; currency: string; paymentDocId: string };
  },
  async guestVerify(payload: { orderId: string; phone: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    const res = await apiClient.post('/payments/guest-verify', payload);
    return res.data;
  },
};

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(opts: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  name?: string;
  description?: string;
  prefill?: { email?: string; contact?: string; name?: string };
}): Promise<{ razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !(window as any).Razorpay) throw new Error('Razorpay Checkout.js failed to load. Check internet / adblock.');
  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key: opts.keyId,
      amount: opts.amountPaise,
      currency: 'INR',
      name: opts.name || 'Mentoos',
      description: opts.description || 'Mentoos order payment',
      order_id: opts.orderId,
      prefill: opts.prefill,
      theme: { color: '#F59E0B' },
      handler: (resp: any) => resolve(resp),
      modal: { ondismiss: () => reject(new Error('Payment cancelled by user')) },
    });
    rzp.on('payment.failed', (err: any) => reject(new Error(err?.error?.description || 'Razorpay payment failed')));
    rzp.open();
  });
}
