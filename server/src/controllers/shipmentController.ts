import { Request, Response } from 'express';
import crypto from 'crypto';
import Joi from 'joi';
import { Order, OrderStatus } from '../models/Order';
import { Settings } from '../models/Settings';
import {
  checkServiceability,
  createShiprocketOrder,
  trackByAWB,
  cancelShiprocketOrder,
  assignCourierAWB,
  generatePickup,
  generateLabel,
  printInvoice,
  generateManifest,
  isShiprocketConfigured,
} from '../services/shiprocket';
import { emitToUser } from '../config/socket';

// GET /api/shipment/serviceability?delivery=515122&weightG=500&cod=true
export const getServiceability = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = Joi.object({
      delivery: Joi.string().regex(/^\d{6}$/).required(),
      weightG: Joi.number().min(1).max(50000).default(500),
      cod: Joi.string().valid('true', 'false', '1', '0').default('true'),
    });
    const { error, value } = schema.validate(req.query);
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const settings = await Settings.findOne({ key: 'global' });
    const pickup = settings?.shipping.pickupPincode || process.env.SHIPROCKET_PICKUP_LOCATION || '515122';
    const weightKg = Math.max(0.1, (value.weightG as number) / 1000);
    const cod = value.cod === 'true' || value.cod === '1';
    if (!isShiprocketConfigured()) {
      // Mock fallback so PDP still works before credentials are added
      const edd = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
      res.status(200).json({
        success: true,
        mock: true,
        data: { available: true, codAvailable: true, estimatedDelivery: edd, courier: 'Shiprocket (connect to go live)', shippingCharge: 0 },
      });
      return;
    }
    const data = await checkServiceability(pickup, value.delivery as string, weightKg, cod);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('Serviceability error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Courier serviceability check failed' });
  }
};

// POST /api/shipment/orders/:id/ship — Admin: push order to Shiprocket
export const shipOrder = async (req: Request, res: Response): Promise<void> => {
  let pickupLocation = 'Primary';
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone');
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (!isShiprocketConfigured()) {
      res.status(503).json({ error: 'Shiprocket not configured. Set SHIPROCKET_EMAIL/PASSWORD in server/.env' });
      return;
    }
    // Idempotency: never re-push an already-pushed order (prevents duplicate SR orders on retry/double-click)
    if ((order as any).shiprocketShipmentId || (order as any).shiprocketOrderId) {
      res.status(400).json({ error: 'Order already pushed to Shiprocket. Use Assign AWB / Live Track instead.' });
      return;
    }
    const settings = await Settings.findOne({ key: 'global' });
    pickupLocation = String(
      (order as any).pickupLocation || settings?.shipment?.pickupLocation || process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary'
    ).trim();
    const weightKg = Math.max(0.1, ((order as any).packageWeightG || settings?.shipping.defaultWeightG || 500) / 1000);
    const length = (order as any).packageLengthCm || settings?.shipping.defaultLengthCm || 30;
    const breadth = (order as any).packageWidthCm || settings?.shipping.defaultWidthCm || 25;
    const height = (order as any).packageHeightCm || settings?.shipping.defaultHeightCm || 3;
    const isCOD = order.paymentMethod === 'cod';
    const user: any = order.userId;
    const name = user?.name || 'Mentoos Customer';
    // Shiprocket accepts exactly 10-digit Indian mobiles (no +91/spaces).
    const { normalizePhone } = await import('../models/OtpCode');
    const phone = normalizePhone(String(user?.phone || ''));
    if (!phone) {
      res.status(400).json({ error: 'Buyer phone is missing/invalid. Update the customer phone (10-digit mobile) and retry.' });
      return;
    }
    const email = user?.email || '';
    const addr = order.shippingAddress;
    const items = order.items.map((it: any) => ({
      name: `Product ${it.productId}`,
      sku: `SKU-${String(it.productId).slice(-6)}`,
      units: it.quantity,
      selling_price: it.price,
    }));
    const pad = (n: number) => String(n).padStart(2, '0');
    const d = new Date();
    const orderDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const sr = await createShiprocketOrder({
      orderId: order.orderNumber,
      orderDate,
      billing: { name, address: addr.street, city: addr.city, state: addr.state, country: addr.country, pincode: addr.zip, phone, email },
      shipping: { name, address: addr.street, city: addr.city, state: addr.state, country: addr.country, pincode: addr.zip, phone },
      items,
      paymentMethod: isCOD ? 'COD' : 'Prepaid',
      subTotal: order.total,
      length,
      breadth,
      height,
      weight: weightKg,
      pickupLocation,
      channelId: settings?.shipment.channelId || undefined,
    });
    // Shiprocket may reply 200 with an error message and no IDs (e.g. wrong pickup
    // location) — treat as failure so the order is NOT marked shipped.
    if (!sr?.order_id || !sr?.shipment_id) {
      const msg = typeof sr?.message === 'string' && sr.message ? sr.message : 'Shiprocket did not return order/shipment IDs';
      throw new Error(msg);
    }
    (order as any).shiprocketOrderId = String(sr.order_id || '');
    (order as any).shiprocketShipmentId = String(sr.shipment_id || '');
    (order as any).shiprocketStatus = sr.status || 'created';
    (order as any).pickupLocation = pickupLocation;
    order.status = OrderStatus.SHIPPED;
    (order as any).trackingNumber = (order as any).shiprocketShipmentId;
    await order.save();
    emitToUser(order.userId.toString(), 'orderShipped', { orderId: order._id.toString(), shipmentId: (order as any).shiprocketShipmentId });
    // WhatsApp: shipped with AWB (fire-and-forget)
    try {
      const { notifyOrderWhatsApp } = await import('../services/whatsapp');
      const u: any = order.userId;
      const phone = u?.phone;
      if (phone) {
        notifyOrderWhatsApp(phone, 'shipped', { orderNumber: order.orderNumber, courier: (order as any).shiprocketCourier || 'partner', awb: (order as any).shiprocketAWB || (order as any).shiprocketShipmentId || '' }).catch(() => {});
      }
    } catch { /* notifications optional */ }
    res.status(200).json({ success: true, message: 'Pushed to Shiprocket', data: { order, shiprocket: sr } });
  } catch (err: any) {
    console.error('Ship order error:', err.response?.data || err.message);
    // Forward Shiprocket's real reason (message + field errors) so Admin sees the cause, not a generic error.
    const srData = err.response?.data || {};
    const fieldErrors = srData.errors ? ` (${JSON.stringify(srData.errors).slice(0, 300)})` : '';
    const reason = srData.message ? `${srData.message}${fieldErrors}` : err.message || 'Failed to create Shiprocket order';
    res.status(502).json({ error: `Shiprocket: ${reason} [pickup sent: "${pickupLocation}"]`.slice(0, 500) });
  }
};

// GET /api/shipment/track/:awb — live tracking (auth)
export const trackShipment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isShiprocketConfigured()) {
      res.status(503).json({ error: 'Shiprocket not configured' });
      return;
    }
    const data = await trackByAWB(req.params.awb);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('Track error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Tracking failed' });
  }
};

// GET /api/shipment/orders/:orderNumber/public-track — guest track by orderNumber (no auth, rate-limited)
export const publicTrackByOrderNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findOne({ orderNumber: (req.params.orderNumber || '').toUpperCase() }).lean();
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const o: any = order;
    let live: any = null;
    if (o.shiprocketAWB && isShiprocketConfigured()) {
      try {
        live = await trackByAWB(o.shiprocketAWB);
      } catch {
        live = null;
      }
    }
    res.status(200).json({
      success: true,
      data: {
        orderNumber: o.orderNumber,
        status: o.status,
        courier: o.shiprocketCourier || 'Shiprocket partner',
        trackingNumber: o.shiprocketAWB || o.trackingNumber,
        trackingUrl: o.trackingUrl,
        estimatedDelivery: o.estimatedDelivery,
        timeline: o.timeline || [],
        live,
      },
    });
  } catch (err) {
    console.error('Public track error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/shipment/webhook — Shiprocket status updates
// Auth: x-api-key: <SHIPROCKET_WEBHOOK_SECRET> (timing-safe). Enforced when secret is set.
function isShiprocketWebhookAuthorized(req: Request): boolean {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET || '';
  if (!secret) return true; // backwards-compatible until secret is configured
  const provided = (req.headers['x-api-key'] as string) || '';
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const shiprocketWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isShiprocketWebhookAuthorized(req)) {
      res.status(401).json({ error: 'Invalid webhook key' });
      return;
    }
    const { order_id, awb, current_status, courier_name, etd } = req.body || {};
    if (!order_id || typeof order_id !== 'string') {
      res.status(400).json({ error: 'order_id required' });
      return;
    }
    const orderIdStr = String(order_id).trim();
    const order = await Order.findOne({
      $or: [{ orderNumber: orderIdStr.toUpperCase() }, { shiprocketOrderId: orderIdStr }],
    });
    if (!order) {
      res.status(404).json({ error: 'Order not found for webhook' });
      return;
    }
    const prevStatus = (order as any).shiprocketStatus || '';
    const prevAWB = (order as any).shiprocketAWB || '';
    const nextStatus = current_status ? String(current_status) : prevStatus;
    const nextAWB = awb ? String(awb) : prevAWB;

    // Dedupe: same AWB + same courier status already stored -> accept without side effects
    if (nextStatus === prevStatus && nextAWB === prevAWB) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    (order as any).shiprocketAWB = nextAWB || (order as any).shiprocketAWB;
    (order as any).shiprocketCourier = courier_name || (order as any).shiprocketCourier;
    (order as any).shiprocketStatus = nextStatus || (order as any).shiprocketStatus;
    (order as any).trackingNumber = (order as any).shiprocketAWB || (order as any).trackingNumber;
    if (etd) {
      const etdDate = new Date(etd);
      if (!Number.isNaN(etdDate.getTime())) (order as any).estimatedDelivery = etdDate;
    }
    const s = (nextStatus || '').toLowerCase();
    const isRTO = s.includes('rto');
    const isNDR = s.includes('ndr') || s.includes('undelivered') || s.includes('failed') || s.includes('return');
    const isCancelledByCourier = s.includes('cancelled') || s.includes('canceled');

    // Terminal guard: never move a DELIVERED order backwards on out-of-order events.
    // RTO/NDR/cancelled events must NOT mark delivered — keep order open for admin action.
    const alreadyDelivered = order.status === OrderStatus.DELIVERED;
    if (!alreadyDelivered) {
      if (s.includes('delivered') && !isRTO && !isNDR) order.status = OrderStatus.DELIVERED;
      else if (isRTO || isNDR || isCancelledByCourier) {
        // Keep current fulfillment state; surface via shiprocketStatus + NDR watch.
        // Do not flip to delivered/cancelled automatically.
      } else if (s.includes('out for delivery') || s.includes('ofd')) order.status = OrderStatus.OUT_FOR_DELIVERY;
      else if (s.includes('in transit') || s.includes('shipped')) order.status = OrderStatus.SHIPPED;
      else if (s.includes('picked up') || s.includes('pickup') || s.includes('packed')) order.status = OrderStatus.PACKED;
    }
    // Safe tracking event (no PII) for customer timeline + dedupe visibility
    order.timeline.push({
      event: 'Shipment tracking update',
      description: `Courier status: ${nextStatus || 'unknown'}`.slice(0, 500),
      type: 'fulfillment',
      metadata: { awb: nextAWB || undefined, courierStatus: nextStatus, previousStatus: prevStatus },
      createdAt: new Date(),
    } as any);
    await order.save();
    emitToUser(order.userId.toString(), 'trackingUpdated', { orderId: order._id.toString(), status: order.status, courierStatus: current_status });
    // WhatsApp: delivered + out-for-delivery with TRACK ORDER link (fire-and-forget)
    try {
      const { User } = await import('../models/User');
      const { notifyOrderWhatsApp } = await import('../services/whatsapp');
      const buyer: any = await User.findById(order.userId).select('phone').lean();
      if (buyer?.phone) {
        if (order.status === OrderStatus.DELIVERED) {
          notifyOrderWhatsApp(buyer.phone, 'delivered', { orderNumber: order.orderNumber }).catch(() => {});
        } else if (order.status === OrderStatus.OUT_FOR_DELIVERY) {
          const trackUrl = `${process.env.FRONTEND_URL || 'https://textile-crm-frontend.onrender.com'}/track-order`;
          notifyOrderWhatsApp(buyer.phone, 'out_for_delivery', { orderNumber: order.orderNumber, trackUrl }).catch(() => {});
        }
      }
    } catch { /* notifications optional */ }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Shiprocket webhook error:', err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
};

// GET /api/shipment/overview — Admin: courier KPIs, NDR/RTO watch, unshipped queue
export const getShipmentOverview = async (_req: Request, res: Response): Promise<void> => {
  try {
    const byCourier = await Order.aggregate([
      { $match: { shiprocketCourier: { $exists: true, $ne: null } } },
      { $group: { _id: '$shiprocketCourier', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const byShipStatus = await Order.aggregate([
      { $group: { _id: { $ifNull: ['$shiprocketStatus', 'not_pushed'] }, count: { $sum: 1 } } },
    ]);
    const byOrderStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const unshipped = await Order.find({ status: 'processing', shiprocketShipmentId: { $exists: false } })
      .select('orderNumber total paymentMethod createdAt shippingAddress')
      .sort({ createdAt: 1 })
      .limit(50)
      .lean();
    const ndrWatch = await Order.find({ $or: [{ shiprocketStatus: /ndr|failed|undelivered|rto/i }, { status: 'shipped' }] })
      .select('orderNumber shiprocketStatus shiprocketCourier shiprocketAWB total updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    res.status(200).json({ success: true, data: { byCourier, byShipStatus, byOrderStatus, unshippedQueue: unshipped, ndrWatch } });
  } catch (err) {
    console.error('Shipment overview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// POST /api/shipment/orders/:id/cancel — Admin (courier cancel only; use Orders cancel/refund for stock+money)
export const cancelShipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.status === OrderStatus.DELIVERED) {
      res.status(400).json({ error: 'Order already delivered — courier cancellation not eligible' });
      return;
    }
    const srOrderId = (order as any).shiprocketOrderId;
    if (!srOrderId) {
      res.status(400).json({ error: 'Order not yet pushed to Shiprocket' });
      return;
    }
    const data = await cancelShiprocketOrder([srOrderId]);
    (order as any).shiprocketStatus = 'cancelled';
    order.timeline.push({
      event: 'Shipment cancelled',
      description: `Shiprocket order ${srOrderId} cancel requested`.slice(0, 500),
      type: 'fulfillment',
      metadata: { shiprocketOrderId: String(srOrderId) },
      createdAt: new Date(),
    } as any);
    await order.save();
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error('Cancel shipment error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Cancel failed — shipment may be past cancellation eligibility in Shiprocket' });
  }
};

// POST /api/shipment/orders/:id/assign-awb { courier_id? , force? } — Admin
// Idempotent: returns existing AWB unless force=true.
export const assignAWB = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isShiprocketConfigured()) {
      res.status(503).json({ error: 'Shiprocket not configured' });
      return;
    }
    const schema = Joi.object({
      courier_id: Joi.alternatives().try(Joi.string().trim().max(50), Joi.number()).optional(),
      force: Joi.boolean().default(false),
    });
    const { error, value } = schema.validate(req.body || {});
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const shipmentId = (order as any).shiprocketShipmentId;
    if (!shipmentId) {
      res.status(400).json({ error: 'Push to Shiprocket first (no shipment_id yet)' });
      return;
    }
    if ((order as any).shiprocketAWB && !value.force) {
      res.status(200).json({
        success: true,
        duplicate: true,
        message: 'AWB already assigned',
        data: { awb: (order as any).shiprocketAWB, courier: (order as any).shiprocketCourier },
      });
      return;
    }
    const sr: any = await assignCourierAWB(shipmentId, value.courier_id);
    const awb = sr?.awb_code || sr?.awb || sr?.response?.awb_code || '';
    const courier = sr?.courier_name || sr?.response?.courier_name || (order as any).shiprocketCourier || '';
    if (awb) {
      (order as any).shiprocketAWB = String(awb);
      (order as any).trackingNumber = String(awb);
    }
    if (courier) (order as any).shiprocketCourier = String(courier);
    if (sr?.courier_company_id) (order as any).shiprocketCourierId = String(sr.courier_company_id);
    (order as any).shiprocketStatus = sr?.status || (order as any).shiprocketStatus || 'awb_assigned';
    order.timeline.push({
      event: 'AWB assigned',
      description: `AWB ${awb || '(pending)'} via ${courier || 'Shiprocket'}`.slice(0, 500),
      type: 'fulfillment',
      metadata: { awb, courier },
      createdAt: new Date(),
    } as any);
    await order.save();
    emitToUser(order.userId.toString(), 'trackingUpdated', { orderId: order._id.toString(), awb, courier });
    res.status(200).json({ success: true, data: { awb, courier, shiprocket: sr } });
  } catch (err: any) {
    console.error('Assign AWB error:', err.response?.data || err.message);
    res.status(502).json({ error: err.response?.data?.message || 'AWB assignment failed' });
  }
};

// POST /api/shipment/orders/:id/pickup — Admin: schedule pickup (after AWB).
export const requestPickup = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isShiprocketConfigured()) {
      res.status(503).json({ error: 'Shiprocket not configured' });
      return;
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const shipmentId = (order as any).shiprocketShipmentId;
    if (!shipmentId) {
      res.status(400).json({ error: 'Push to Shiprocket first (no shipment_id yet)' });
      return;
    }
    const sr: any = await generatePickup([shipmentId]);
    (order as any).shiprocketStatus = 'pickup_scheduled';
    (order as any).shiprocketPickupScheduled = true;
    order.timeline.push({
      event: 'Pickup scheduled',
      description: `Pickup requested for shipment ${shipmentId}`.slice(0, 500),
      type: 'fulfillment',
      metadata: { shipmentId: String(shipmentId) },
      createdAt: new Date(),
    } as any);
    await order.save();
    emitToUser(order.userId.toString(), 'trackingUpdated', { orderId: order._id.toString(), status: order.status, pickup: true });
    res.status(200).json({ success: true, data: sr });
  } catch (err: any) {
    console.error('Pickup error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Pickup scheduling failed (already scheduled?)' });
  }
};

// POST /api/shipment/orders/:id/label — Admin: get shipping label URL.
export const getLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isShiprocketConfigured()) {
      res.status(503).json({ error: 'Shiprocket not configured' });
      return;
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const shipmentId = (order as any).shiprocketShipmentId;
    if (!shipmentId) {
      res.status(400).json({ error: 'Push to Shiprocket first' });
      return;
    }
    const sr: any = await generateLabel([shipmentId]);
    const url = sr?.label_url || sr?.response?.label_url || sr?.labelUrl || null;
    res.status(200).json({ success: true, data: { url, shiprocket: sr } });
  } catch (err: any) {
    console.error('Label error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Label generation failed' });
  }
};

// POST /api/shipment/orders/:id/invoice — Admin: get invoice URL.
export const getInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isShiprocketConfigured()) {
      res.status(503).json({ error: 'Shiprocket not configured' });
      return;
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const srOrderId = (order as any).shiprocketOrderId;
    if (!srOrderId) {
      res.status(400).json({ error: 'Push to Shiprocket first' });
      return;
    }
    const sr: any = await printInvoice([srOrderId]);
    const url = sr?.invoice_url || sr?.response?.invoice_url || null;
    res.status(200).json({ success: true, data: { url, shiprocket: sr } });
  } catch (err: any) {
    console.error('Invoice error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Invoice generation failed' });
  }
};

// POST /api/shipment/orders/:id/manifest — Admin: generate manifest for shipment.
export const getManifest = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isShiprocketConfigured()) {
      res.status(503).json({ error: 'Shiprocket not configured' });
      return;
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const shipmentId = (order as any).shiprocketShipmentId;
    if (!shipmentId) {
      res.status(400).json({ error: 'Push to Shiprocket first' });
      return;
    }
    const sr: any = await generateManifest([shipmentId]);
    const url = sr?.manifest_url || sr?.response?.manifest_url || null;
    res.status(200).json({ success: true, data: { url, shiprocket: sr } });
  } catch (err: any) {
    console.error('Manifest error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Manifest generation failed' });
  }
};

// POST /api/shipment/sync — Admin: manual fallback sync for missed webhooks.
export const syncShipments = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!isShiprocketConfigured()) {
      res.status(503).json({ error: 'Shiprocket not configured' });
      return;
    }
    const schema = Joi.object({
      limit: Joi.number().min(1).max(100).default(20),
      staleMinutes: Joi.number().min(5).max(1440).default(60),
    });
    const { error, value } = schema.validate(req.body || {});
    if (error) {
      res.status(400).json({ error: 'Validation error', details: error.details.map((d) => d.message) });
      return;
    }
    const { syncStaleShipments } = await import('../jobs/shipmentSync');
    const result = await syncStaleShipments(value.limit, value.staleMinutes);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    console.error('Shipment sync error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Shipment sync failed' });
  }
};
