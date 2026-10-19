import { computeCODAdvance } from '../src/models/Settings';
import { normalizeShipping, validateVariantAttributes } from '../src/utils/shiprocketReady';

describe('Phase 0 - Settings + Shiprocket readiness', () => {
  it('computes COD advance in fixed mode', () => {
    const settings: any = {
      codConfirmation: { enabled: true, mode: 'fixed', defaultAmount: 99, minOrderValueForCOD: 0 },
    };
    expect(computeCODAdvance(1499, settings)).toBe(99);
    expect(computeCODAdvance(50, settings)).toBe(50); // capped at order value
  });

  it('computes COD advance in slab mode', () => {
    const settings: any = {
      codConfirmation: {
        enabled: true,
        mode: 'slab',
        defaultAmount: 99,
        minOrderValueForCOD: 0,
        slabs: [
          { minOrderValue: 0, maxOrderValue: 999, amount: 49 },
          { minOrderValue: 1000, amount: 149 },
        ],
      },
    };
    expect(computeCODAdvance(500, settings)).toBe(49);
    expect(computeCODAdvance(1500, settings)).toBe(149);
  });

  it('computes COD advance in percent mode', () => {
    const settings: any = {
      codConfirmation: { enabled: true, mode: 'percent', defaultAmount: 99, percentValue: 10, minOrderValueForCOD: 0 },
    };
    expect(computeCODAdvance(1000, settings)).toBe(100);
  });

  it('returns 0 when COD disabled', () => {
    const settings: any = { codConfirmation: { enabled: false, mode: 'fixed', defaultAmount: 99, minOrderValueForCOD: 0 } };
    expect(computeCODAdvance(2000, settings)).toBe(0);
  });

  it('normalizes missing shipping with defaults', () => {
    const { shipping, warnings } = normalizeShipping({}, { weightG: 500, lengthCm: 30, widthCm: 25, heightCm: 3 });
    expect(shipping.weight).toBe(500);
    expect(shipping.length).toBe(30);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('requires Size attribute for apparel variants', () => {
    expect(validateVariantAttributes([{ name: 'Color', options: [{ value: 'Black' }] } as any])).toMatch(/Size/);
    expect(
      validateVariantAttributes([{ name: 'Size', options: [{ value: 'M' }, { value: 'L' }] } as any])
    ).toBeNull();
  });
});
