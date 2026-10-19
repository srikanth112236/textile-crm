import axios from 'axios';
import crypto from 'crypto';

// Razorpay integration WITHOUT SDK (uses axios, already installed).
// Docs: POST /v1/orders with Basic Auth key_id:key_secret, verify with HMAC SHA256.

function getCreds() {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  return { keyId, keySecret };
}

export function isRazorpayConfigured(): boolean {
  const { keyId, keySecret } = getCreds();
  return Boolean(keyId && keySecret);
}

export async function createRazorpayOrder(amountRupees: number, receipt: string, notes: Record<string, string> = {}) {
  const { keyId, keySecret } = getCreds();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env');
  }
  const amountPaise = Math.round(amountRupees * 100);
  const res = await axios.post(
    'https://api.razorpay.com/v1/orders',
    { amount: amountPaise, currency: 'INR', receipt: receipt.slice(0, 40), notes },
    { auth: { username: keyId, password: keySecret }, timeout: 15000 }
  );
  return res.data as { id: string; amount: number; currency: string; receipt: string; status: string };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const { keySecret } = getCreds();
  if (!keySecret) return false;
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return expected === signature;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

export async function refundRazorpayPayment(paymentId: string, amountRupees?: number) {
  const { keyId, keySecret } = getCreds();
  if (!keyId || !keySecret) throw new Error('Razorpay not configured');
  const payload: any = {};
  if (amountRupees !== undefined) payload.amount = Math.round(amountRupees * 100);
  const res = await axios.post(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, payload, {
    auth: { username: keyId, password: keySecret },
    timeout: 15000,
  });
  return res.data;
}

export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || '';
}
