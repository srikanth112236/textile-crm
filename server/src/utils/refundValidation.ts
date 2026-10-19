// Pure refund-destination validators (no dependencies — safe to unit test).
export const UPI_RE = /^[\w.\-]{2,}@[a-zA-Z]{2,}$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const refundValidators = { UPI_RE, IFSC_RE };

export function isValidUpiId(v: unknown): boolean {
  return UPI_RE.test(String(v || '').trim());
}

export function isValidBankDestination(input: {
  bankAccountName?: unknown;
  bankAccountNumber?: unknown;
  bankIfsc?: unknown;
}): boolean {
  if (!String(input.bankAccountName || '').trim()) return false;
  if (!String(input.bankAccountNumber || '').trim()) return false;
  return IFSC_RE.test(String(input.bankIfsc || '').trim().toUpperCase());
}
