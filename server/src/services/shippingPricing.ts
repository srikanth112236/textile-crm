import { checkServiceability, isShiprocketConfigured } from './shiprocket';

/**
 * Single source of truth for shipping pricing.
 *
 * Both the checkout quote endpoint and order creation call this, so the
 * amount shown to the shopper and the amount charged are always produced by
 * the same rules. The client is never trusted for the final number.
 *
 * Flow:
 *  1. Build the parcel (weight + dimensions) from the cart lines.
 *  2. Ask Shiprocket for serviceability/rates (cheapest courier), cached.
 *  3. Apply free-shipping rules (threshold / free-shipping coupon).
 *  4. Fall back to the flat Settings rate if Shiprocket is down or disabled,
 *     so checkout can never be blocked by a courier outage.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PackageLine {
  /** Unit weight in grams (falls back to Settings.defaultWeightG). */
  weightG?: number;
  quantity: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface PackageSummary {
  weightG: number;
  chargeableKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricKg: number;
}

export interface CourierQuote {
  available: boolean;
  courierId?: number | string;
  courierName?: string;
  rate: number;
  etd?: string;
  estimatedDays?: string;
}

export interface ShippingQuote {
  /** false when no courier can deliver to the pincode. */
  available: boolean;
  /** What the customer is charged (0 when free shipping applies). */
  charge: number;
  /** The real courier rate, even when the customer pays 0 (margin tracking). */
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
  /** Human-readable explanation for unavailable/fallback states. */
  reason?: string;
}

interface ShippingSettingsLike {
  shipping?: {
    freeShippingThreshold?: number;
    flatShippingCost?: number;
    defaultWeightG?: number;
    defaultLengthCm?: number;
    defaultWidthCm?: number;
    defaultHeightCm?: number;
    pickupPincode?: string;
  };
  shipment?: {
    shiprocketEnabled?: boolean;
  };
}

// ---------------------------------------------------------------------------
// Parcel maths
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHT_G = 500;
const DEFAULT_LENGTH_CM = 30;
const DEFAULT_WIDTH_CM = 25;
const DEFAULT_HEIGHT_CM = 3;
const VOLUMETRIC_DIVISOR = 5000; // standard courier divisor (cm³ → kg)

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Convert a product document into a package line (uses product.shipping). */
export function toPackageLine(product: any, quantity: number): PackageLine {
  const s = product?.shipping || {};
  const weightFactor =
    s.weightUnit === 'kg' ? 1000 : s.weightUnit === 'oz' ? 28.3495 : s.weightUnit === 'lb' ? 453.592 : 1;
  const dimFactor = s.dimensionUnit === 'in' ? 2.54 : s.dimensionUnit === 'm' ? 100 : 1;

  return {
    weightG: s.weight ? Number(s.weight) * weightFactor : undefined,
    quantity,
    lengthCm: s.length ? Number(s.length) * dimFactor : undefined,
    widthCm: s.width ? Number(s.width) * dimFactor : undefined,
    heightCm: s.height ? Number(s.height) * dimFactor : undefined,
  };
}

/**
 * Sum the cart into a single parcel. Couriers bill on chargeable weight:
 * the greater of actual weight and volumetric weight, rounded up to the
 * next 0.5 kg slab.
 */
export function computePackage(lines: PackageLine[], settings?: ShippingSettingsLike): PackageSummary {
  const s = settings?.shipping || {};
  const defaultWeightG = s.defaultWeightG || DEFAULT_WEIGHT_G;
  const defaultLength = s.defaultLengthCm || DEFAULT_LENGTH_CM;
  const defaultWidth = s.defaultWidthCm || DEFAULT_WIDTH_CM;
  const defaultHeight = s.defaultHeightCm || DEFAULT_HEIGHT_CM;

  let weightG = 0;
  let lengthCm = 0;
  let widthCm = 0;
  let heightCm = 0;

  for (const line of lines) {
    const qty = Math.max(1, Number(line.quantity) || 1);
    weightG += (Number(line.weightG) > 0 ? Number(line.weightG) : defaultWeightG) * qty;

    // The parcel must fit the largest item, so take the max dimension.
    lengthCm = Math.max(lengthCm, Number(line.lengthCm) || 0);
    widthCm = Math.max(widthCm, Number(line.widthCm) || 0);
    heightCm = Math.max(heightCm, Number(line.heightCm) || 0);
  }

  if (weightG <= 0) weightG = defaultWeightG;
  lengthCm = lengthCm || defaultLength;
  widthCm = widthCm || defaultWidth;
  heightCm = heightCm || defaultHeight;

  const volumetricKg = (lengthCm * widthCm * heightCm) / VOLUMETRIC_DIVISOR;
  const actualKg = weightG / 1000;
  const billableKg = Math.max(actualKg, volumetricKg);
  const chargeableKg = Math.max(0.5, Math.ceil(billableKg * 2) / 2);

  return {
    weightG: Math.round(weightG),
    chargeableKg: round2(chargeableKg),
    lengthCm: round2(lengthCm),
    widthCm: round2(widthCm),
    heightCm: round2(heightCm),
    volumetricKg: round2(volumetricKg),
  };
}

// ---------------------------------------------------------------------------
// Shiprocket courier rates (cached)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const quoteCache = new Map<string, { at: number; quote: CourierQuote }>();

function cacheGet(key: string): CourierQuote | null {
  const hit = quoteCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    quoteCache.delete(key);
    return null;
  }
  return hit.quote;
}

function cacheSet(key: string, quote: CourierQuote): void {
  if (quoteCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = quoteCache.keys().next().value;
    if (oldest) quoteCache.delete(oldest);
  }
  quoteCache.set(key, { at: Date.now(), quote });
}

export function resolvePickupPincode(settings?: ShippingSettingsLike): string {
  return (
    process.env.SHIPROCKET_PICKUP_PINCODE ||
    settings?.shipping?.pickupPincode ||
    '208011' // registered Shiprocket pickup location (Naubasta, Kanpur)
  );
}

/**
 * Cheapest courier for the lane. Shiprocket's `recommended_courier_company_id`
 * is frequently null on small accounts, so we rank by rate ourselves.
 */
export async function fetchCourierQuote(
  pickupPincode: string,
  deliveryPincode: string,
  chargeableKg: number,
  cod: boolean
): Promise<CourierQuote> {
  const cacheKey = `${pickupPincode}|${deliveryPincode}|${chargeableKg}|${cod ? 1 : 0}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const raw = await checkServiceability(pickupPincode, deliveryPincode, chargeableKg, cod);
  const companies: any[] = raw?.data?.available_courier_companies || [];

  const usable = companies
    .map((c) => ({
      courierId: c.courier_company_id,
      courierName: c.courier_name,
      rate: Number(c.rate),
      etd: c.etd,
      estimatedDays: c.estimated_delivery_days,
    }))
    .filter((c) => Number.isFinite(c.rate) && c.rate > 0)
    .sort((a, b) => a.rate - b.rate);

  const quote: CourierQuote = usable.length
    ? { available: true, ...usable[0], rate: round2(usable[0].rate) }
    : { available: false, rate: 0 };

  // Only cache successful lanes: a transient empty response from Shiprocket
  // must not block checkout for the next 10 minutes.
  if (quote.available) cacheSet(cacheKey, quote);
  return quote;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface GetShippingQuoteInput {
  lines: PackageLine[];
  deliveryPincode?: string;
  paymentMethod?: string;
  /** Order value after discounts (used for the free-shipping threshold). */
  orderValue: number;
  freeShipCoupon?: boolean;
  settings?: ShippingSettingsLike | null;
}

export async function getShippingQuote(input: GetShippingQuoteInput): Promise<ShippingQuote> {
  const settings = input.settings || undefined;
  const pkg = computePackage(input.lines, settings);
  const cod = (input.paymentMethod || '').toLowerCase() === 'cod';
  const now = new Date().toISOString();

  const threshold = settings?.shipping?.freeShippingThreshold ?? 999;
  const flatCost = settings?.shipping?.flatShippingCost ?? 50;
  const freeShipping = Boolean(input.freeShipCoupon) || (threshold > 0 && input.orderValue >= threshold);

  const flatQuote = (reason?: string): ShippingQuote => ({
    available: true,
    charge: freeShipping ? 0 : round2(flatCost),
    actualCost: freeShipping ? 0 : round2(flatCost),
    freeShipping,
    source: freeShipping ? 'free' : 'flat',
    courierName: 'Standard delivery',
    weightG: pkg.weightG,
    chargeableKg: pkg.chargeableKg,
    lengthCm: pkg.lengthCm,
    widthCm: pkg.widthCm,
    heightCm: pkg.heightCm,
    cod,
    quotedAt: now,
    reason,
  });

  // Admin can disable live courier rates from Store Settings. When it is
  // disabled (or SHIPPING_RATE_SOURCE=flat), the below-threshold charge is the
  // admin-selected flat amount (₹50 / ₹55 / ₹60).
  const shiprocketDisabled = settings?.shipment?.shiprocketEnabled === false;
  const rateSource = (process.env.SHIPPING_RATE_SOURCE || 'shiprocket').toLowerCase();
  if (rateSource === 'flat' || shiprocketDisabled || !isShiprocketConfigured()) {
    return flatQuote(
      rateSource === 'flat'
        ? 'Live courier rates disabled (SHIPPING_RATE_SOURCE=flat).'
        : shiprocketDisabled
          ? 'Live courier rates disabled in Store Settings.'
          : 'Shiprocket not configured.'
    );
  }

  const pincode = (input.deliveryPincode || '').replace(/\D/g, '').slice(-6);
  if (!/^\d{6}$/.test(pincode)) {
    // No usable PIN yet — show the fallback rate instead of blocking the UI.
    return flatQuote('Enter a 6-digit delivery PIN for a live rate.');
  }

  try {
    const courier = await fetchCourierQuote(
      resolvePickupPincode(settings),
      pincode,
      pkg.chargeableKg,
      cod
    );

    if (!courier.available) {
      return {
        available: false,
        charge: 0,
        actualCost: 0,
        freeShipping,
        source: 'shiprocket',
        weightG: pkg.weightG,
        chargeableKg: pkg.chargeableKg,
        lengthCm: pkg.lengthCm,
        widthCm: pkg.widthCm,
        heightCm: pkg.heightCm,
        cod,
        quotedAt: now,
        reason: 'No courier can deliver to this PIN right now.',
      };
    }

    return {
      available: true,
      charge: freeShipping ? 0 : courier.rate,
      actualCost: courier.rate,
      freeShipping,
      source: freeShipping ? 'free' : 'shiprocket',
      courierName: courier.courierName,
      etd: courier.etd,
      estimatedDays: courier.estimatedDays,
      weightG: pkg.weightG,
      chargeableKg: pkg.chargeableKg,
      lengthCm: pkg.lengthCm,
      widthCm: pkg.widthCm,
      heightCm: pkg.heightCm,
      cod,
      quotedAt: now,
    };
  } catch (err: any) {
    console.error('Shipping quote failed, using flat fallback:', err?.response?.data || err?.message);
    return flatQuote('Live courier rate unavailable — standard rate applied.');
  }
}
