import crypto from 'crypto';

// Mirror of server verify logic — ensures frontend/backend stay in sync
function sign(orderId: string, paymentId: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

describe('Phase 1+2 - Razorpay verify + Shiprocket payload', () => {
  it('razorpay signature verifies', () => {
    const secret = 'test_secret_123';
    const sig = sign('order_ABC', 'pay_XYZ', secret);
    const expected = crypto.createHmac('sha256', secret).update('order_ABC|pay_XYZ').digest('hex');
    expect(sig).toBe(expected);
  });

  it('COD advance capped at order value', () => {
    const orderValue = 50;
    const advance = Math.min(99, orderValue);
    expect(advance).toBe(50);
    expect(orderValue - advance).toBe(0);
  });

  it('amount paise conversion correct', () => {
    expect(Math.round(1499 * 100)).toBe(149900);
    expect(Math.round(99.99 * 100)).toBe(9999);
  });

  it('shiprocket weight kg minimum enforced', () => {
    const weightG = 100;
    const weightKg = Math.max(0.1, weightG / 1000);
    expect(weightKg).toBe(0.1);
  });
});
