import axios from 'axios';

let tokenCache: { token: string; at: number } | null = null;

function base() {
  return process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
}

export function isShiprocketConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

export async function getShiprocketToken(): Promise<string> {
  if (tokenCache && Date.now() - tokenCache.at < 8 * 60 * 60 * 1000) return tokenCache.token;
  const email = process.env.SHIPROCKET_EMAIL || '';
  const password = process.env.SHIPROCKET_PASSWORD || '';
  if (!email || !password) throw new Error('Shiprocket not configured. Set SHIPROCKET_EMAIL/PASSWORD in server/.env');
  const res = await axios.post(`${base()}/auth/login`, { email, password }, { timeout: 15000 });
  const token = res.data?.token;
  if (!token) throw new Error('Shiprocket login failed');
  tokenCache = { token, at: Date.now() };
  return token;
}

async function authHeaders() {
  const token = await getShiprocketToken();
  return { Authorization: `Bearer ${token}` };
}

// Retry once on 401 (expired token): clear cache, re-login, retry.
async function withAuthRetry<T>(fn: (headers: Record<string, string>) => Promise<T>): Promise<T> {
  try {
    return await fn(await authHeaders());
  } catch (err: any) {
    if (err?.response?.status === 401) {
      tokenCache = null;
      return await fn(await authHeaders());
    }
    throw err;
  }
}

// GET serviceability: pickup, delivery pincode, weight kg, cod
export async function checkServiceability(pickup: string, delivery: string, weightKg: number, cod: boolean) {
  const headers = await authHeaders();
  const res = await axios.get(`${base()}/courier/serviceability/`, {
    headers,
    params: { pickup_postcode: pickup, delivery_postcode: delivery, weight: weightKg, cod: cod ? 1 : 0 },
    timeout: 15000,
  });
  return res.data;
}

export interface ShiprocketOrderInput {
  orderId: string; // Mentoos orderNumber
  orderDate: string; // yyyy-mm-dd hh:mm
  billing: { name: string; address: string; city: string; state: string; country: string; pincode: string; phone: string; email?: string };
  shipping: { name: string; address: string; city: string; state: string; country: string; pincode: string; phone: string };
  items: Array<{ name: string; sku: string; units: number; selling_price: number }>;
  paymentMethod: 'Prepaid' | 'COD';
  subTotal: number;
  length: number;
  breadth: number;
  height: number;
  weight: number; // kg
  pickupLocation: string;
  channelId?: string;
  shippingIsBilling?: boolean; // required by Shiprocket; defaults true (we share one address)
}

// Shiprocket requires separate first/last names + shipping_is_billing flag.
export function splitCustomerName(full: string): { first: string; last: string } {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: 'Mentoos', last: 'Customer' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

export async function createShiprocketOrder(input: ShiprocketOrderInput) {
  const headers = await authHeaders();
  const billingName = splitCustomerName(input.billing.name);
  const shippingName = splitCustomerName(input.shipping.name);
  const payload: any = {
    order_id: input.orderId,
    order_date: input.orderDate,
    pickup_location: input.pickupLocation,
    billing_customer_name: billingName.first,
    billing_last_name: billingName.last,
    billing_address: input.billing.address,
    billing_city: input.billing.city,
    billing_state: input.billing.state,
    billing_country: input.billing.country,
    billing_pincode: input.billing.pincode,
    billing_phone: input.billing.phone,
    billing_email: input.billing.email,
    shipping_customer_name: shippingName.first,
    shipping_last_name: shippingName.last,
    shipping_address: input.shipping.address,
    shipping_city: input.shipping.city,
    shipping_state: input.shipping.state,
    shipping_country: input.shipping.country,
    shipping_pincode: input.shipping.pincode,
    shipping_phone: input.shipping.phone,
    shipping_is_billing: input.shippingIsBilling ?? true,
    order_items: input.items,
    payment_method: input.paymentMethod,
    sub_total: input.subTotal,
    length: input.length,
    breadth: input.breadth,
    height: input.height,
    weight: input.weight,
  };
  if (input.channelId) payload.channel_id = input.channelId;
  const res = await axios.post(`${base()}/orders/create/adhoc`, payload, { headers, timeout: 20000 });
  return res.data;
}

export async function trackByAWB(awb: string) {
  return withAuthRetry(async (headers) => {
    const res = await axios.get(`${base()}/courier/track/awb/${awb}`, { headers, timeout: 15000 });
    return res.data;
  });
}

// GET /courier/track/shipment/{shipment_id} — fallback when AWB not yet assigned.
export async function trackByShipmentId(shipmentId: string | number) {
  return withAuthRetry(async (headers) => {
    const res = await axios.get(`${base()}/courier/track/shipment/${shipmentId}`, { headers, timeout: 15000 });
    return res.data;
  });
}

export async function cancelShiprocketOrder(orderIds: string[]) {
  const headers = await authHeaders();
  const res = await axios.post(`${base()}/orders/cancel`, { ids: orderIds }, { headers, timeout: 15000 });
  return res.data;
}

// POST /courier/assign/awb — assign courier + generate AWB for a shipment.
// shipmentId: Shiprocket shipment_id. courierId optional (auto-assign cheapest if omitted).
export async function assignCourierAWB(shipmentId: string | number, courierId?: string | number) {
  return withAuthRetry(async (headers) => {
    const payload: any = { shipment_id: shipmentId };
    if (courierId !== undefined && courierId !== '') payload.courier_id = courierId;
    const res = await axios.post(`${base()}/courier/assign/awb`, payload, { headers, timeout: 20000 });
    return res.data;
  });
}

// POST /courier/generate/pickup — schedule pickup (idempotent-safe: Shiprocket rejects duplicates).
export async function generatePickup(shipmentIds: Array<string | number>) {
  return withAuthRetry(async (headers) => {
    const res = await axios.post(`${base()}/courier/generate/pickup`, { shipment_id: shipmentIds }, { headers, timeout: 20000 });
    return res.data;
  });
}

// POST /courier/generate/label — returns label_url.
export async function generateLabel(shipmentIds: Array<string | number>) {
  return withAuthRetry(async (headers) => {
    const res = await axios.post(`${base()}/courier/generate/label`, { shipment_id: shipmentIds }, { headers, timeout: 20000 });
    return res.data;
  });
}

// POST /manifests/generate + POST /manifests/print
export async function generateManifest(shipmentIds: Array<string | number>) {
  return withAuthRetry(async (headers) => {
    const res = await axios.post(`${base()}/manifests/generate`, { shipment_id: shipmentIds }, { headers, timeout: 20000 });
    return res.data;
  });
}

export async function printManifest(orderIds: Array<string | number>) {
  return withAuthRetry(async (headers) => {
    const res = await axios.post(`${base()}/manifests/print`, { order_ids: orderIds }, { headers, timeout: 20000 });
    return res.data;
  });
}

// POST /orders/print/invoice — returns invoice_url.
export async function printInvoice(orderIds: Array<string | number>) {
  return withAuthRetry(async (headers) => {
    const res = await axios.post(`${base()}/orders/print/invoice`, { ids: orderIds }, { headers, timeout: 20000 });
    return res.data;
  });
}

// GET /orders/show/{id} — fetch Shiprocket order detail (for admin verify / sync).
export async function getShiprocketOrder(shiprocketOrderId: string | number) {
  return withAuthRetry(async (headers) => {
    const res = await axios.get(`${base()}/orders/show/${shiprocketOrderId}`, { headers, timeout: 15000 });
    return res.data;
  });
}
