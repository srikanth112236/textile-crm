import type { ClientSession } from 'mongoose';

/**
 * Size-level inventory helpers. For variant products the source of truth is
 * variantSKUs[].stock — the Product pre-save hook rolls enabled variants up
 * into top-level `stock` on every save, so writing top-level stock directly
 * is silently discarded. All order flows must go through these helpers.
 */

function sizeOf(variations: Array<{ name: string; value: string }> | undefined): string {
  const v = (variations || []).find((x) => String(x.name).toLowerCase() === 'size');
  return v ? String(v.value) : '';
}

function attrsOf(sku: any): Record<string, string> {
  const a = sku.attributes;
  if (a instanceof Map) return Object.fromEntries(a as Map<string, string>);
  return (a || {}) as Record<string, string>;
}

export function pickVariant(product: any, size: string): any | null {
  const enabled: any[] = (product.variantSKUs || []).filter((s: any) => s.isEnabled !== false);
  if (size) {
    const hit = enabled.find(
      (s) => String(attrsOf(s).Size || attrsOf(s).size || '').toUpperCase() === size.toUpperCase()
    );
    if (hit) return hit;
  }
  return enabled.find((s) => s.isDefault) || enabled[0] || null;
}

// Decrement for a purchase (validates size availability). Mutates + saves.
export async function decrementStockForOrder(
  product: any,
  variations: Array<{ name: string; value: string }> | undefined,
  qty: number,
  session?: ClientSession | null
): Promise<{ ok: boolean; reason?: string }> {
  const size = sizeOf(variations);
  if (product.hasVariants && (product.variantSKUs || []).length > 0) {
    const v = pickVariant(product, size);
    if (!v) {
      return { ok: false, reason: `Size ${size || 'selected'} is sold out for ${product.name}` };
    }
    if ((v.stock || 0) < qty) {
      return {
        ok: false,
        reason: `Insufficient stock for ${product.name}${size ? ` (size ${size})` : ''}. Available: ${v.stock || 0}`,
      };
    }
    v.stock -= qty;
    await product.save({ session });
    return { ok: true };
  }
  if ((product.stock || 0) < qty) {
    return { ok: false, reason: `Insufficient stock for ${product.name}. Available: ${product.stock || 0}` };
  }
  product.stock -= qty;
  await product.save({ session });
  return { ok: true };
}

// Restore for cancel / full-refund / sweep. Never fails the caller.
export async function restoreStockForOrder(
  product: any,
  variations: Array<{ name: string; value: string }> | undefined,
  qty: number,
  session?: ClientSession | null
): Promise<void> {
  if (product.hasVariants && (product.variantSKUs || []).length > 0) {
    const v = pickVariant(product, sizeOf(variations));
    if (v) {
      v.stock = (v.stock || 0) + qty;
      await product.save({ session });
      return;
    }
  }
  product.stock = (product.stock || 0) + qty;
  await product.save({ session });
}
