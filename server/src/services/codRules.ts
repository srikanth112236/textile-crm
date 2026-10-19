import { Settings, computeCODAdvance } from '../models/Settings';

export interface CODQuote {
  advance: number;
  balance: number;
  codAllowed: boolean;
  reason: string;
}

// Smart COD decision: base slabs/percent + pincode zones + buyer trust + RTO risk.
// Keeps honest buyers friction-free while screening fake-COD patterns.
export async function getCODQuoteDetailed(
  orderValue: number,
  opts: { pincode?: string; userId?: string } = {}
): Promise<CODQuote> {
  let settings = await Settings.findOne({ key: 'global' });
  if (!settings) {
    const { DEFAULT_SETTINGS } = await import('../models/Settings');
    settings = await Settings.create({ ...(DEFAULT_SETTINGS as object) });
  }
  const cod: any = settings.codConfirmation;
  const fail = (reason: string): CODQuote => ({ advance: 0, balance: orderValue, codAllowed: false, reason });

  if (!settings.payments.codEnabled || !cod.enabled) return fail('COD is currently disabled');
  if (orderValue < (cod.minOrderValueForCOD || 0)) return { advance: 0, balance: orderValue, codAllowed: true, reason: 'No advance needed on this order value' };
  if (cod.maxOrderValueForCOD && orderValue > cod.maxOrderValueForCOD) return fail('COD not available above this order value');

  // Pincode zones (high-RTO blocklist or serviceable allow-list)
  const pin = (opts.pincode || '').replace(/\D/g, '').slice(-6);
  const pins: string[] = cod.pincodes || [];
  if (pin && pins.length > 0) {
    if (cod.pincodeMode === 'block' && pins.includes(pin)) return fail('COD not available for this pincode');
    if (cod.pincodeMode === 'allow' && !pins.includes(pin)) return fail('COD not serviceable for this pincode yet');
  }

  // Buyer history (trusted vs risky)
  let delivered = 0;
  let cancelled = 0;
  if (opts.userId) {
    try {
      const { Order } = await import('../models/Order');
      const [d, c] = await Promise.all([
        Order.countDocuments({ userId: opts.userId, status: 'delivered' }),
        Order.countDocuments({ userId: opts.userId, status: { $in: ['cancelled', 'refunded'] } }),
      ]);
      delivered = d;
      cancelled = c;
    } catch { /* history optional */ }
  }
  const trustedMin = cod.trustedMinDelivered ?? 2;
  if (delivered >= trustedMin && cancelled === 0) {
    return { advance: 0, balance: orderValue, codAllowed: true, reason: `Trusted buyer (${delivered} delivered) — no advance needed` };
  }

  let advance = computeCODAdvance(orderValue, settings);
  let reason = 'Standard COD confirmation advance';
  const riskThreshold = cod.riskThreshold || 0;
  if (riskThreshold > 0 && delivered === 0 && orderValue >= riskThreshold) {
    const riskAdvance = Math.min(orderValue, Math.max(cod.riskAdvance || 149, advance));
    if (riskAdvance > advance) {
      advance = riskAdvance;
      reason = 'First-order high-value protection — slightly higher advance';
    }
  }
  return { advance: Math.min(advance, orderValue), balance: Math.max(0, orderValue - advance), codAllowed: true, reason };
}
