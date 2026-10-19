import { Order, OrderStatus } from '../models/Order';
import { trackByAWB, trackByShipmentId, isShiprocketConfigured } from '../services/shiprocket';
import { emitToUser } from '../config/socket';

export interface ShipmentSyncResult {
  checked: number;
  updated: number;
  failed: number;
  skipped: boolean;
  details: Array<{ orderNumber: string; prevStatus?: string; nextStatus?: string; error?: string }>;
}

// Extract a normalized courier status string from Shiprocket track responses.
// Supports both /track/awb and /track/shipment shapes.
export function extractCourierStatus(track: any): { status: string; awb?: string; courier?: string; etd?: string } {
  const t = track?.tracking_data?.shipment_track?.[0] || track?.tracking_data || track || {};
  return {
    status: String(t.current_status || t.status || track?.current_status || track?.status || ''),
    awb: t.awb_code || t.awb || undefined,
    courier: t.courier_name || t.courier || undefined,
    etd: t.etd || t.expected_delivery_date || undefined,
  };
}

// Shared status mapping (same rules as webhook): RTO/NDR never marks delivered,
// delivered is terminal (no backwards moves).
export function mapCourierStatusToOrder(
  courierStatus: string,
  current: OrderStatus
): OrderStatus | null {
  const s = (courierStatus || '').toLowerCase();
  const isRTO = s.includes('rto');
  const isNDR = s.includes('ndr') || s.includes('undelivered') || s.includes('failed') || s.includes('return');
  const isCancelled = s.includes('cancelled') || s.includes('canceled');
  if (current === OrderStatus.DELIVERED) return null;
  if (s.includes('delivered') && !isRTO && !isNDR) return OrderStatus.DELIVERED;
  if (isRTO || isNDR || isCancelled) return null; // keep open for admin action
  if (s.includes('out for delivery') || s.includes('ofd')) return OrderStatus.OUT_FOR_DELIVERY;
  if (s.includes('in transit') || s.includes('shipped')) return OrderStatus.SHIPPED;
  if (s.includes('picked up') || s.includes('pickup') || s.includes('packed')) return OrderStatus.PACKED;
  return null;
}

// Sync stale in-transit orders against Shiprocket (fallback for missed webhooks).
// Picks orders in packed/shipped/out_for_delivery with AWB or shipment_id,
// not updated for `staleMinutes`, up to `limit`. Safe to re-run.
export async function syncStaleShipments(limit = 20, staleMinutes = 60): Promise<ShipmentSyncResult> {
  const details: ShipmentSyncResult['details'] = [];
  if (!isShiprocketConfigured()) return { checked: 0, updated: 0, failed: 0, skipped: true, details };
  const since = new Date(Date.now() - staleMinutes * 60 * 1000);
  const orders = await Order.find({
    status: { $in: [OrderStatus.PACKED, OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY] },
    $or: [
      { shiprocketAWB: { $exists: true, $ne: '' } },
      { shiprocketShipmentId: { $exists: true, $ne: '' } },
    ],
    updatedAt: { $lt: since },
  })
    .sort({ updatedAt: 1 })
    .limit(Math.min(Math.max(limit, 1), 100));

  let updated = 0;
  let failed = 0;
  for (const order of orders) {
    const o: any = order;
    try {
      let track: any = null;
      if (o.shiprocketAWB) {
        try {
          track = await trackByAWB(o.shiprocketAWB);
        } catch {
          track = null;
        }
      }
      if (!track && o.shiprocketShipmentId) {
        track = await trackByShipmentId(o.shiprocketShipmentId);
      }
      if (!track) throw new Error('Tracking lookup failed');
      const { status, awb, courier, etd } = extractCourierStatus(track);
      const prevStatus = o.shiprocketStatus || '';
      if (status && status === prevStatus) {
        details.push({ orderNumber: order.orderNumber, prevStatus, nextStatus: status });
        continue; // duplicate — no write
      }
      if (awb && !o.shiprocketAWB) {
        o.shiprocketAWB = String(awb);
        o.trackingNumber = String(awb);
      }
      if (courier) o.shiprocketCourier = String(courier);
      if (status) o.shiprocketStatus = status;
      if (etd) {
        const d = new Date(etd);
        if (!Number.isNaN(d.getTime())) o.estimatedDelivery = d;
      }
      const next = status ? mapCourierStatusToOrder(status, order.status) : null;
      if (next) order.status = next;
      order.timeline.push({
        event: 'Shipment sync',
        description: `Sync: courier status ${status || 'unknown'}`.slice(0, 500),
        type: 'fulfillment',
        metadata: { courierStatus: status, previousStatus: prevStatus, source: 'sync' },
        createdAt: new Date(),
      } as any);
      await order.save();
      emitToUser(order.userId.toString(), 'trackingUpdated', {
        orderId: order._id.toString(),
        status: order.status,
        courierStatus: status,
        source: 'sync',
      });
      updated += 1;
      details.push({ orderNumber: order.orderNumber, prevStatus, nextStatus: status });
    } catch (err: any) {
      failed += 1;
      details.push({ orderNumber: order.orderNumber, error: err?.response?.data?.message || err?.message || 'sync failed' });
    }
  }
  return { checked: orders.length, updated, failed, skipped: false, details };
}

let timer: NodeJS.Timeout | null = null;
let running = false;

// Start interval-based fallback sync. No-op if disabled or already started.
export function startShipmentSync(): void {
  if (timer) return;
  if ((process.env.SHIPROCKET_SYNC_ENABLED || 'true').toLowerCase() === 'false') return;
  const intervalMin = Math.min(Math.max(parseInt(process.env.SHIPROCKET_SYNC_INTERVAL_MIN || '30', 10) || 30, 5), 720);
  const limit = parseInt(process.env.SHIPROCKET_SYNC_LIMIT || '20', 10) || 20;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const r = await syncStaleShipments(limit);
      if (r.checked > 0) console.log(`Shipment sync: checked=${r.checked} updated=${r.updated} failed=${r.failed}`);
    } catch (err) {
      console.error('Shipment sync error:', (err as any)?.message || err);
    } finally {
      running = false;
    }
  };
  timer = setInterval(run, intervalMin * 60 * 1000);
  (timer as any)?.unref?.();
}
