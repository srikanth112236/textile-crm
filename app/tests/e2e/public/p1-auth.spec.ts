import { test, expect, APIRequestContext } from '@playwright/test';
import { CUSTOMER, collectPageErrors } from '../helpers/auth';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000';

async function clearCustomerCart(request: APIRequestContext) {
  const login = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: CUSTOMER.email, password: CUSTOMER.password },
  });
  expect(login.ok(), `API login failed: ${login.status()}`).toBeTruthy();
  const { accessToken } = await login.json();
  const clear = await request.delete(`${API_URL}/api/cart`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(clear.ok(), `Cart clear failed: ${clear.status()}`).toBeTruthy();
}

/**
 * P1 auth behaviour:
 *  - the dedicated login page returns to callbackUrl, never a dashboard;
 *  - a guest add-to-cart opens the contextual modal and replays the intent
 *    after sign-in.
 */
test.describe('P1 auth & roles — public', () => {
  test('login page returns to the callback instead of a dashboard', async ({ page }) => {
    await page.goto('/login?callbackUrl=%2Fproducts%3FinStock%3Dtrue', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#email')).toBeVisible();

    const accept = page.getByRole('button', { name: 'Accept All Cookies' });
    if (await accept.isVisible().catch(() => false)) {
      await accept.click().catch(() => {});
    }

    await page.locator('#email').fill(CUSTOMER.email);
    await page.locator('#password').fill(CUSTOMER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.waitForURL(/\/products\?inStock=true$/, { timeout: 40_000 });
    expect(page.url()).not.toMatch(/\/(user|admin|superadmin)\/dashboard/);
  });

  test('guest add-to-cart opens a contextual prompt and replays after login', async ({ page, request }) => {
    await clearCustomerCart(request);

    const errors = collectPageErrors(page);
    await page.goto('/products?inStock=true');

    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    await page.waitForURL(/\/products\/[a-f0-9]{24}$/);

    await page.locator('button:visible', { hasText: /^Add to Cart$/ }).first().click();

    await expect(page.getByRole('heading', { name: 'Sign in to add to bag' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();

    await page.locator('#login-modal-email').fill(CUSTOMER.email);
    await page.locator('#login-modal-password').fill(CUSTOMER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // The modal queues the intent, reloads the page, and PendingActionRunner
    // adds the line once the session is active.
    await expect(page.getByRole('button', { name: 'Increase quantity' }).first()).toBeVisible({
      timeout: 30_000,
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
