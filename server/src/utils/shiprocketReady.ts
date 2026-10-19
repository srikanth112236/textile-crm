// Phase 0: Shiprocket-ready normalization helpers.
// Shiprocket needs per-shipment: weight (g), length/width/height (cm), SKU, value.
// Mentoos standard: Size is mandatory for apparel variants; Color recommended.

export interface NormalizeResult {
  shipping: {
    weight: number;
    weightUnit: 'g' | 'kg' | 'oz' | 'lb';
    length: number;
    width: number;
    height: number;
    dimensionUnit: 'cm' | 'in' | 'm';
    requiresShipping: boolean;
    freeShipping?: boolean;
    shippingClass?: string;
  };
  warnings: string[];
}

export function normalizeShipping(
  input: any,
  defaults: { weightG: number; lengthCm: number; widthCm: number; heightCm: number }
): NormalizeResult {
  const warnings: string[] = [];
  const src = input && typeof input === 'object' ? input : {};
  const requiresShipping = src.requiresShipping !== false;

  let weight = Number(src.weight);
  if (!weight || weight <= 0) {
    weight = defaults.weightG;
    warnings.push(`Shipping weight missing — defaulted to ${defaults.weightG}g for Shiprocket.`);
  }
  let length = Number(src.length);
  let width = Number(src.width);
  let height = Number(src.height);
  if (!length || length <= 0) {
    length = defaults.lengthCm;
    warnings.push(`Shipping length missing — defaulted to ${defaults.lengthCm}cm.`);
  }
  if (!width || width <= 0) {
    width = defaults.widthCm;
    warnings.push(`Shipping width missing — defaulted to ${defaults.widthCm}cm.`);
  }
  if (!height || height <= 0) {
    height = defaults.heightCm;
    warnings.push(`Shipping height missing — defaulted to ${defaults.heightCm}cm.`);
  }

  return {
    shipping: {
      weight,
      weightUnit: src.weightUnit || 'g',
      length,
      width,
      height,
      dimensionUnit: src.dimensionUnit || 'cm',
      requiresShipping,
      freeShipping: src.freeShipping ?? false,
      shippingClass: src.shippingClass,
    },
    warnings,
  };
}

export function validateVariantAttributes(variantAttributes: any[]): string | null {
  if (!variantAttributes || variantAttributes.length === 0) return null;
  const names = variantAttributes.map((a) => a?.name);
  // Case-insensitive: legacy seed uses 'size', new products use 'Size'
  if (!names.some((n) => String(n).toLowerCase() === 'size')) {
    return 'variantAttributes must include a "Size" attribute (S, M, L, XL, XXL) for apparel.';
  }
  const sizeAttr = variantAttributes.find((a) => String(a.name).toLowerCase() === 'size');
  const values: string[] = (sizeAttr?.options || []).map((o: any) => o?.value);
  const required = ['S', 'M', 'L', 'XL', 'XXL'];
  const missing = required.filter((s) => !values.includes(s));
  if (missing.length === required.length) {
    return 'Size attribute must include at least one of S, M, L, XL, XXL.';
  }
  return null;
}

export function applyVariantWeightDefaults(variantSKUs: any[], defaultWeightG: number): void {
  if (!Array.isArray(variantSKUs)) return;
  for (const sku of variantSKUs) {
    if (!sku.weight || sku.weight <= 0) {
      sku.weight = defaultWeightG;
    }
  }
}
