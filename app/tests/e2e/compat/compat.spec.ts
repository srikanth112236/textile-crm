import { test, expect } from '@playwright/test';

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';

test.describe('Cross-browser compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
  });

  test('Home renders', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mentoos/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText('SHOP BY CATEGORY').first()).toBeVisible();
  });

  test('Product listing and size filter work', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByText(/Showing 1 to 20 of \d+ products/).first()).toBeVisible({ timeout: 30_000 });

    const sidebar = page.locator('aside').first();
    const sizeTrigger = sidebar.getByRole('button', { name: /^Size/i });

    // Filters are collapsed by default except Categories + Price. Open Size
    // and wait for its options + counts before clicking; WebKit can hydrate
    // after the first paint, and size buttons are disabled until counts land.
    await expect(async () => {
      if ((await sizeTrigger.getAttribute('aria-expanded')) !== 'true') {
        await sizeTrigger.click();
      }
      await expect(sizeTrigger).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
    }).toPass({ timeout: 20_000 });

    const sizeM = sidebar.getByRole('button', { name: /^M(\s|$)/ }).first();
    await expect(sizeM).toBeEnabled({ timeout: 20_000 });
    await sizeM.click();

    await expect.poll(() => page.url()).toContain('size=M');
    await expect(sizeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/Showing 1 to \d+ of \d+ products/).first()).toBeVisible({ timeout: 30_000 });
  });

  test('Product detail and video render', async ({ page }) => {
    await page.goto(`/products/${PRODUCT_ID}`);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('video').first()).toBeAttached();
    await expect(page.getByText('Select Size:', { exact: false }).first()).toBeVisible();
  });

  test('Search renders results', async ({ page }) => {
    await page.goto('/search?q=shirt');
    await expect(page.getByText(/Found \d+ results/).first()).toBeVisible({ timeout: 30_000 });
  });

  test('Guest cart page is reachable', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /Shopping Cart/i }).first()).toBeVisible();
  });

  test('Mobile navigation opens without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Toggle Navigation' })).toBeVisible();
    await page.getByRole('button', { name: 'Toggle Navigation' }).click();
    await expect(page.getByRole('link', { name: /T-Shirts/i }).first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
