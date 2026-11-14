import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, shot } from '../helpers/auth';

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';

test.describe('Responsive — 393px mobile', () => {
  test('Home has no horizontal overflow and mobile navigation opens', async ({ page }, testInfo) => {
    await page.goto('/');
    const metrics = await expectNoHorizontalOverflow(page);
    await testInfo.attach('viewport', {
      body: Buffer.from(JSON.stringify(metrics, null, 2)),
      contentType: 'application/json',
    });

    await page.getByRole('button', { name: 'Toggle Navigation' }).click();
    await expect(page.getByRole('link', { name: /T-Shirts/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Best Sellers/i }).first()).toBeVisible();
    await shot(page, testInfo, 'mobile-home-nav');
  });

  test('Products listing has no horizontal overflow', async ({ page }, testInfo) => {
    await page.goto('/products');
    await expect(page.getByText(/Showing 1 to 20 of \d+ products/).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, testInfo, 'mobile-products');
  });

  test('Product detail has no horizontal overflow and variants are usable', async ({ page }, testInfo) => {
    await page.goto(`/products/${PRODUCT_ID}`);
    await expect(page.getByText('Select Size:', { exact: false }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole('button', { name: 'Increase quantity' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to Cart' }).first()).toBeVisible();
    await shot(page, testInfo, 'mobile-pdp');
  });

  test('Categories page has no horizontal overflow', async ({ page }, testInfo) => {
    await page.goto('/categories/t-shirts');
    await expectNoHorizontalOverflow(page);
    await shot(page, testInfo, 'mobile-category');
  });

  test('Cart page has no horizontal overflow for guests', async ({ page }, testInfo) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /Shopping Cart/i }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, testInfo, 'mobile-cart');
  });
});
