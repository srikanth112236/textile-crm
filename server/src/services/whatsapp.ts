import axios from 'axios';
import { Settings } from '../models/Settings';

// Provider-agnostic WhatsApp sender for Mentoos transactional notifications.
// Configure via env: WHATSAPP_PROVIDER (interakt|wati|gupshup|custom),
// WHATSAPP_API_KEY, WHATSAPP_SUPPORT_NUMBER, WHATSAPP_NAMESPACE (Interakt).
// Without keys it logs + returns { sent: false, mock: true } so flows never break.

export interface WhatsAppResult {
  sent: boolean;
  mock?: boolean;
  provider?: string;
  error?: string;
}

async function sendViaProvider(to: string, message: string): Promise<void> {
  const provider = process.env.WHATSAPP_PROVIDER || 'interakt';
  const apiKey = process.env.WHATSAPP_API_KEY || '';

  if (provider === 'interakt') {
    await axios.post(
      'https://api.interakt.ai/v1/public/message/',
      { countryCode: '+91', phoneNumber: to, type: 'Text', data: { message } },
      { headers: { Authorization: `Basic ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    return;
  }
  if (provider === 'wati') {
    const endpoint = process.env.WHATSAPP_WATI_ENDPOINT || '';
    await axios.post(
      `${endpoint}/api/v1/sendSessionMessage/${to}`,
      { messageText: message },
      { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    return;
  }
  if (provider === 'gupshup') {
    const source = process.env.WHATSAPP_GUPSHUP_SOURCE || '';
    const appName = process.env.WHATSAPP_GUPSHUP_APP || 'Mentoos';
    const params = new URLSearchParams({
      channel: 'whatsapp',
      source,
      destination: `91${to}`,
      message,
      'src.name': appName,
    });
    await axios.post('https://api.gupshup.io/wa/api/v1/msg', params.toString(), {
      headers: { apikey: apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });
    return;
  }
  // custom: POST { to, message } to WHATSAPP_WEBHOOK_URL
  const url = process.env.WHATSAPP_WEBHOOK_URL || '';
  await axios.post(url, { to, message }, { timeout: 15000 });
}

export async function sendWhatsApp(to: string, message: string): Promise<WhatsAppResult> {
  const provider = process.env.WHATSAPP_PROVIDER || 'interakt';
  const clean = (to || '').replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(clean)) return { sent: false, error: 'Invalid mobile number' };
  if (!process.env.WHATSAPP_API_KEY) {
    console.log(`[WhatsApp mock → +91${clean}] ${message}`);
    return { sent: false, mock: true, provider };
  }
  try {
    await sendViaProvider(clean, message);
    return { sent: true, provider };
  } catch (err: any) {
    console.error('WhatsApp send failed:', err.response?.data || err.message);
    return { sent: false, provider, error: 'Provider send failed' };
  }
}

// Order lifecycle notifications. Fire-and-forget from controllers.
export async function notifyOrderWhatsApp(
  phone: string | undefined,
  event: 'order_confirmed' | 'cod_advance_paid' | 'shipped' | 'packed' | 'out_for_delivery' | 'delivered' | 'refund_initiated' | 'refund_completed' | 'back_in_stock' | 'price_drop' | 'abandoned_cart',
  vars: Record<string, string | number> = {}
): Promise<WhatsAppResult | null> {
  if (!phone) return null;
  try {
    const settings = await Settings.findOne({ key: 'global' }).lean();
    const custom = (settings?.whatsapp as any)?.orderTemplates?.[event];
    const defaults: Record<string, string> = {
      order_confirmed: `Mentoos: Order ${vars.orderNumber} confirmed! Total ${vars.total}. Track: ${vars.trackUrl || 'mentoos.in/track-order'}`,
      cod_advance_paid: `Mentoos: COD advance ${vars.advance} received for ${vars.orderNumber}. Balance ${vars.balance} due on delivery.`,
      shipped: `Mentoos: Order ${vars.orderNumber} shipped via ${vars.courier || 'partner'}. AWB: ${vars.awb}. Track your order for live status.`,
      packed: `Mentoos: Order ${vars.orderNumber} is packed and will be handed to the courier today.`,
      out_for_delivery: `Your Mentoos order ${vars.orderNumber} is out for delivery. Expected delivery: Today. TRACK ORDER: ${vars.trackUrl || 'mentoos.in/track-order'}`,
      delivered: `Mentoos: Order ${vars.orderNumber} delivered. Enjoy! Rate your fit in the app.`,
      refund_initiated: `Mentoos: Refund of ${vars.amount} initiated for ${vars.orderNumber}. You will be notified on completion.`,
      refund_completed: `Mentoos: Refund of ${vars.amount} completed for ${vars.orderNumber}. Razorpay refunds take 5–7 working days to reflect.`,
      back_in_stock: `Good News! Your Mentoos ${vars.productName} (Size ${vars.size}) is back in stock. SHOP NOW before it sells out.`,
      price_drop: `Price Drop! Mentoos ${vars.productName} is now ${vars.newPrice} (was ${vars.oldPrice}). Grab it now.`,
      abandoned_cart: `Mentoos: You left ${vars.itemCount} item(s) worth ${vars.total} in your bag. Complete your purchase now — limited stock!`,
    };
    let msg = custom || defaults[event];
    for (const [k, v] of Object.entries(vars)) msg = msg.split(`{${k}}`).join(String(v));
    return await sendWhatsApp(phone, msg);
  } catch (err) {
    console.error('notifyOrderWhatsApp error:', err);
    return null;
  }
}
