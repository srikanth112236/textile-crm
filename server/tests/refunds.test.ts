import { DEFAULT_SETTINGS } from '../src/models/Settings';
import { UPI_RE, IFSC_RE, isValidUpiId, isValidBankDestination } from '../src/utils/refundValidation';

describe('Refunds - settings defaults + destination validation', () => {
  it('refunds policy defaults preserve legacy behavior', () => {
    expect((DEFAULT_SETTINGS as any).refunds.autoRefundOnCancel).toBe(true);
    expect((DEFAULT_SETTINGS as any).refunds.codAdvanceRefundable).toBe(true);
    expect((DEFAULT_SETTINGS as any).refunds.allowCustomerCancelHours).toBeNull();
  });

  it('accepts valid UPI IDs, rejects garbage', () => {
    expect(UPI_RE.test('name@okbank')).toBe(true);
    expect(UPI_RE.test('98xxxxxx10@upi')).toBe(true);
    expect(UPI_RE.test('not-an-upi')).toBe(false);
    expect(UPI_RE.test('a@b')).toBe(false);
    expect(UPI_RE.test('')).toBe(false);
    expect(isValidUpiId('name@okbank')).toBe(true);
    expect(isValidUpiId('bad')).toBe(false);
  });

  it('accepts valid IFSCs, rejects garbage', () => {
    expect(IFSC_RE.test('HDFC0001234')).toBe(true);
    expect(IFSC_RE.test('SBIN0060231')).toBe(true);
    expect(IFSC_RE.test('hdfc0001234')).toBe(false);
    expect(IFSC_RE.test('HDFC1234')).toBe(false);
    expect(IFSC_RE.test('')).toBe(false);
    expect(isValidBankDestination({ bankAccountName: 'Rohan', bankAccountNumber: '50100234567890', bankIfsc: 'hdfc0001234' })).toBe(true);
    expect(isValidBankDestination({ bankAccountName: '', bankAccountNumber: '123', bankIfsc: 'HDFC0001234' })).toBe(false);
  });
});
