import { test, expect } from '@playwright/test';

/**
 * P1 staff guard. The admin project is authenticated as superadmin.
 * Staff may browse, but must never see customer commerce controls or the
 * cart/checkout/customer pages.
 */
test.describe('P1 auth & roles — staff guard', () => {
  test('staff navbar hides commerce and shows the dashboard path', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/Staff mode/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Shopping Cart' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Wishlist' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Open account menu' }).click();
    await expect(page.getByRole('menuitem', { name: /Go to dashboard/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /My Orders/i })).toHaveCount(0);
  });

  test('staff cannot open cart or checkout', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Customer accounts only' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Go to dashboard/i })).toBeVisible();

    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Customer accounts only' })).toBeVisible();
  });

  test('staff product page replaces buying controls', async ({ page }) => {
    await page.goto('/products?inStock=true');
    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    await page.waitForURL(/\/products\/[a-f0-9]{24}$/);

    await expect(page.getByRole('button', { name: /Customer account required/i }).first()).toBeVisible();
    await expect(page.locator('button:visible', { hasText: /^Add to Cart$/ })).toHaveCount(0);
  });
});
