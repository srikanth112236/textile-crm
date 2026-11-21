import { expect, test } from '@playwright/test';
import { collectConsoleErrors, REACH_ERROR, waitForData } from './helpers';

const API = 'http://localhost:5050/api';

test.describe('catalogue, filters, search and product detail', () => {
  test('listing loads all products and applies filters', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/products', { waitUntil: 'domcontentloaded' });

    await waitForData(page, /\d+ products/);
    await expect(page.getByText(/150 products|\d{2,} products/)).toBeVisible();
    await expect(page.getByText(REACH_ERROR)).toHaveCount(0);

    // Filters sheet is backed by /products/filters.
    await page.getByLabel('Filters').click();
    await expect(page.getByText(/sizes · \d+ colours/)).toBeVisible();
    await expect(page.getByText('Catalogue range')).toBeVisible();

    await page.getByText('M', { exact: true }).last().click();
    await page.getByRole('button', { name: /^Apply/ }).click();

    await expect(page.getByText(/Filters \(\d\)/)).toBeVisible();
    await expect(page.getByText('Clear all')).toBeVisible();

    // Sorting swaps the result order.
    await page.getByLabel('Sort').click();
    await expect(page.getByText('Sort by')).toBeVisible();
    await page.getByText('Price: low to high').click();
    await expect(page.getByText('Price: low to high').first()).toBeVisible();

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('search returns real results', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/search', { waitUntil: 'domcontentloaded' });

    await page.getByPlaceholder(/Search “oversized tee”/).fill('kurta');

    await waitForData(page, /results/, 60_000);
    await expect(page.getByText(/Linen Short Kurta/i).first()).toBeVisible();
    await expect(page.getByText(REACH_ERROR)).toHaveCount(0);

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('product detail adds to the bag', async ({ page, request }) => {
    const errors = collectConsoleErrors(page);

    // Pick a real, in-stock product from the API instead of hardcoding an id.
    const response = await request.get(`${API}/products?limit=5&inStock=true&status=active`);
    const payload = await response.json();
    const product = payload.data[0];
    expect(product, 'API returned no products').toBeTruthy();

    await page.goto(`/product/${product._id}`, { waitUntil: 'domcontentloaded' });
    await waitForData(page, product.name);

    await expect(page.getByText(product.name).first()).toBeVisible();
    await expect(page.getByText(/₹\d/).first()).toBeVisible();
    await expect(page.getByText('Product details')).toBeVisible();
    await expect(page.getByText(/reviews/).first()).toBeVisible();

    await page.getByRole('button', { name: 'Add to bag' }).click();
    await expect(page.getByText('Added to your bag')).toBeVisible();
    await expect(page.getByText(/View bag \(/)).toBeVisible();

    await page.getByText(/View bag \(/).click();
    await expect(page.getByText('Your bag', { exact: true })).toBeVisible();
    // React Navigation keeps the previous screen mounted on web, so match the
    // visible instance only.
    await expect(page.getByText(product.name).filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('Subtotal').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(REACH_ERROR)).toHaveCount(0);

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });
});
