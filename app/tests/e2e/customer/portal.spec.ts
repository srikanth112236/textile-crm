import { test, expect, Page } from '@playwright/test';
import { clearCart, collectPageErrors, shot } from '../helpers/auth';

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';
const ORDER_ID = '6aec4112e0e04fff96b1d156';

async function addProductToCart(page: Page) {
  await page.goto(`/products/${PRODUCT_ID}`);
  await page.getByRole('button', { name: 'Add to Cart' }).first().click();
  await page.waitForTimeout(1200);
}

test.describe('Customer portal & shopping flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearCart(page);
  });

  test('Customer dashboard loads with account summary', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    await page.goto('/user/dashboard');
    await expect(page.getByRole('heading', { name: 'My Account', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'My Dashboard', exact: true }).first()).toBeVisible();
    await expect(page.getByText('Refer & Earn', { exact: false }).first()).toBeVisible();
    await shot(page, testInfo, 'customer-dashboard');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('Orders list and order detail load', async ({ page }, testInfo) => {
    await page.goto('/user/orders');
    await expect(page.getByRole('heading', { name: 'My Orders', exact: true }).first()).toBeVisible();
    await expect(page.getByText(/ORD-\d{8}-\d{3}/).first()).toBeVisible();

    await page.goto(`/user/orders/${ORDER_ID}`);
    await expect(page.getByRole('heading', { name: /Order #/ }).first()).toBeVisible();
    await expect(page.getByText(/Payment|Shipping|Deliver|Total/i).first()).toBeVisible();
    await shot(page, testInfo, 'customer-order-detail');
  });

  test('Profile shows saved default address', async ({ page }, testInfo) => {
    await page.goto('/user/profile');
    await expect(page.getByRole('heading', { name: 'Profile Settings', exact: true }).first()).toBeVisible();
    await page.getByRole('tab', { name: 'Addresses' }).click();
    await expect(page.getByText('42, 100 Feet Road').first()).toBeVisible();
    await expect(page.getByText(/Bengaluru/i).first()).toBeVisible();
    await shot(page, testInfo, 'customer-profile');
  });

  test('Wishlist loads', async ({ page }, testInfo) => {
    await page.goto('/user/wishlist');
    await expect(page.getByRole('heading', { name: 'My Wishlist', exact: true }).first()).toBeVisible();
    await shot(page, testInfo, 'customer-wishlist');
  });

  test('All customer account sections load', async ({ page }, testInfo) => {
    const sections: Array<[string, RegExp]> = [
      ['/user/invoices', /My Invoices Center/i],
      ['/user/payments', /My Payments/i],
      ['/user/loyalty', /Loyalty Program/i],
      ['/user/referral', /Refer a Friend/i],
      ['/user/returns', /My Returns/i],
      ['/user/refunds', /My Refunds/i],
      ['/user/settings', /Account Settings/i],
    ];

    for (const [path, heading] of sections) {
      await test.step(`${path}`, async () => {
        await page.goto(path);
        await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
      });
    }
    await shot(page, testInfo, 'customer-account-sections');
  });

  test('Cart supports add, quantity update and remove', async ({ page }, testInfo) => {
    await addProductToCart(page);
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /Shopping Cart/i }).first()).toBeVisible();
    await expect(page.getByText('Pro-Gym Muscle Fit Stringer Vest - Grey').first()).toBeVisible();

    await page.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(page.getByText('₹998').first()).toBeVisible({ timeout: 10_000 });
    await shot(page, testInfo, 'customer-cart-quantity');

    await page.getByRole('button', { name: 'Remove item' }).click();
    await expect(page.getByText('Your cart is empty').first()).toBeVisible({ timeout: 10_000 });
  });

  test('Standard checkout uses the saved address and reaches review', async ({ page }, testInfo) => {
    await addProductToCart(page);
    await page.goto('/cart');
    await page.getByRole('link', { name: /Proceed to Checkout/i }).first().click();

    await expect(page.getByText('Shipping Address').first()).toBeVisible();
    await expect(page.getByText('42, 100 Feet Road').first()).toBeVisible();
    await shot(page, testInfo, 'customer-checkout-address');

    await page.getByRole('button', { name: /Continue to Payment/i }).click();
    await expect(page.getByText('Payment Method').first()).toBeVisible();
    await page.getByTestId('payment-cod').click();
    await page.getByRole('button', { name: /Continue to Review/i }).click();

    await expect(page.getByText('Review Your Order').first()).toBeVisible();
    await expect(page.getByText('Deliver to:', { exact: false }).first()).toBeVisible();
    await shot(page, testInfo, 'customer-checkout-review');

    await page.goto('/');
    await clearCart(page);
  });

  test('Express checkout shows saved address, offers and payment options', async ({ page }, testInfo) => {
    await page.goto(`/products/${PRODUCT_ID}`);
    await expect(page.getByText('Express Checkout available').first()).toBeVisible();

    // Click once hydration has settled; retry if the first click lands before
    // the Next.js router is ready (dev-mode compile window).
    await expect(async () => {
      await page.getByRole('button', { name: 'Express', exact: true }).click();
      await page.waitForURL(/\/checkout\/express/, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: 'Express Checkout' }).first()).toBeVisible();
    await expect(page.getByText('Your default saved address').first()).toBeVisible();
    await expect(page.getByText('42, 100 Feet Road').first()).toBeVisible();
    await expect(page.getByText('WELCOME10').first()).toBeVisible();
    await expect(page.getByText(/Prepaid/i).first()).toBeVisible();
    await expect(page.getByText(/Cash on Delivery/i).first()).toBeVisible();

    await page.getByRole('button', { name: /WELCOME10/ }).first().click();
    await expect(page.getByText(/Discount \(WELCOME10\)/).first()).toBeVisible({ timeout: 10_000 });
    await shot(page, testInfo, 'customer-express-checkout');
  });
});
