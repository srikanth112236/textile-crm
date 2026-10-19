import type { ISizeChartRow } from '@/lib/api/types';

// Generic category tables (inches) — fallback when a product has no override.
export const TOPS_ROWS: ISizeChartRow[] = [
  { size: 'S', chest: '38', shoulder: '17', length: '27', sleeve: '8' },
  { size: 'M', chest: '40', shoulder: '17.5', length: '28', sleeve: '8.5' },
  { size: 'L', chest: '42', shoulder: '18', length: '29', sleeve: '9' },
  { size: 'XL', chest: '44', shoulder: '18.5', length: '30', sleeve: '9.5' },
  { size: 'XXL', chest: '46', shoulder: '19', length: '31', sleeve: '10' },
];

export const BOTTOMS_ROWS: ISizeChartRow[] = [
  { size: 'S', waist: '28', hip: '38', thigh: '22', length: '40' },
  { size: 'M', waist: '30', hip: '40', thigh: '23', length: '41' },
  { size: 'L', waist: '32', hip: '42', thigh: '24', length: '42' },
  { size: 'XL', waist: '34', hip: '44', thigh: '25', length: '43' },
  { size: 'XXL', waist: '36', hip: '46', thigh: '26', length: '44' },
];

export const ETHNIC_ROWS: ISizeChartRow[] = [
  { size: 'S', chest: '38', shoulder: '17', length: '40' },
  { size: 'M', chest: '40', shoulder: '17.5', length: '41' },
  { size: 'L', chest: '42', shoulder: '18', length: '42' },
  { size: 'XL', chest: '44', shoulder: '18.5', length: '43' },
  { size: 'XXL', chest: '46', shoulder: '19', length: '44' },
];

export type ChartKind = 'bottoms' | 'ethnic' | 'tops';

export function chartKindOf(categoryName?: string): ChartKind {
  const c = (categoryName || '').toLowerCase();
  if (/trouser|jogger|pant|short|bottom|chino|cargo|pyjama|pajama/.test(c)) return 'bottoms';
  if (/kurta|ethnic|nehru|sherwani|dhoti/.test(c)) return 'ethnic';
  return 'tops';
}

export function defaultRowsFor(categoryName?: string): ISizeChartRow[] {
  const kind = chartKindOf(categoryName);
  const src = kind === 'bottoms' ? BOTTOMS_ROWS : kind === 'ethnic' ? ETHNIC_ROWS : TOPS_ROWS;
  return src.map((r) => ({ ...r }));
}

export const MEASURE_COLUMNS: Array<{ key: keyof ISizeChartRow; label: string }> = [
  { key: 'chest', label: 'Chest' },
  { key: 'shoulder', label: 'Shoulder' },
  { key: 'length', label: 'Length' },
  { key: 'sleeve', label: 'Sleeve' },
  { key: 'waist', label: 'Waist' },
  { key: 'hip', label: 'Hip' },
  { key: 'thigh', label: 'Thigh' },
  { key: 'bottom', label: 'Bottom' },
];

// Columns that actually have data (for compact dynamic rendering).
export function activeColumns(rows: ISizeChartRow[]) {
  return MEASURE_COLUMNS.filter((c) => rows.some((r) => String((r as any)[c.key] || '').trim() !== ''));
}
