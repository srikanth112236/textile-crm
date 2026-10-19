import { normalizePhone } from '../src/models/OtpCode';

describe('Retention - OTP phone normalization', () => {
  it('accepts 10-digit Indian mobiles', () => {
    expect(normalizePhone('9876543210')).toBe('9876543210');
    expect(normalizePhone('+91 98765 43210')).toBe('9876543210');
    expect(normalizePhone('919876543210')).toBe('9876543210');
  });

  it('rejects invalid numbers', () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('5876543210')).toBeNull(); // must start 6-9
    expect(normalizePhone('abcdefghij')).toBeNull();
  });
});
