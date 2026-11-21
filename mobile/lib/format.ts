/**
 * Mirrors the web app's `formatPrice` (app/lib/utils.ts):
 * Intl en-IN + INR, no decimals.
 */
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact' });

export function formatPrice(value: number | undefined | null) {
  return inr.format(Number(value ?? 0));
}

export function formatCount(value: number) {
  return compact.format(value);
}
