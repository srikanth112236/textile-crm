import { test, expect } from '@playwright/test';
import { collectPageErrors, shot } from '../helpers/auth';

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';
const ORDER_NUMBER = 'ORD-20261105-002';
const ORDER_PHONE = '9876543212';

test.describe('Public storefront', () => {
  test('Home page renders with hero, categories and product rails', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);

    await page.goto('/');
    await expect(page).toHaveTitle(/Mentoos/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText('SHARP. RELAXED. YOURS.').first()).toBeVisible();
    await expect(page.getByText('SHOP BY CATEGORY').first()).toBeVisible();
    await expect(page.getByText('NEW ARRIVALS').first()).toBeVisible();
    await expect(page.getByText('BEST SELLERS').first()).toBeVisible();

    await shot(page, testInfo, 'public-home');
    expect(errors, `Page errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('Product listing, category filter and sorting work', async ({ page }, testInfo) => {
    await page.goto('/products');
    await expect(page.getByText(/Showing 1 to 20 of \d+ products/).first()).toBeVisible();

    await page.goto('/products?category=t-shirts');
    await expect(page.getByText(/\d+ products in this category/i).or(page.getByText(/Showing 1 to \d+ of \d+ products/)).first()).toBeVisible();

    await page.goto('/products?sort=price&order=asc');
    await expect(page.getByText('Price: Low to High').first()).toBeVisible();
    await expect(page.getByText(/Showing 1 to 20 of \d+ products/).first()).toBeVisible();

    await shot(page, testInfo, 'public-products');
  });

  test('Search page returns matching results', async ({ page }, testInfo) => {
    await page.goto('/search?q=shirt');
    await expect(page.getByText(/Found \d+ results/).first()).toBeVisible();
    await expect(page.getByText(/Showing 1 to 20 of \d+ results/).first()).toBeVisible();

    await page.goto('/search?q=zzzzzznotfound');
    await expect(page.getByText(/No exact matches/i).first()).toBeVisible();

    await shot(page, testInfo, 'public-search');
  });

  test('Header smart search returns categories and products', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Smart Search' }).click();
    const input = page.locator('input[placeholder*="Search Mentoos"]');
    await input.fill('shirt');
    await expect(page.getByText(/MATCHING PRODUCTS/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/MATCHING CATEGORIES/i).first()).toBeVisible();

    await shot(page, testInfo, 'public-smart-search');
  });

  test('Product detail page shows media, variants and video', async ({ page }, testInfo) => {
    await page.goto(`/products/${PRODUCT_ID}`);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText('Select Size:', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Select Colour:', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Watch video').first()).toBeVisible();
    await expect(page.locator('[role="complementary"]')).toBeVisible();
    await expect(page.getByText('Express Checkout available')).toHaveCount(0);

    await shot(page, testInfo, 'public-pdp');
  });

  test('Category landing page loads', async ({ page }, testInfo) => {
    await page.goto('/categories/t-shirts');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText(/\d+ products in this category/i).or(page.getByText(/Showing 1 to \d+ of \d+/)).first()).toBeVisible();
    await shot(page, testInfo, 'public-category');
  });

  test('All footer informational pages return 200', async ({ page }, testInfo) => {
    const pages: Array<[string, string]> = [
      ['/about', 'About Mentoos'],
      ['/contact', 'Contact Us'],
      ['/shipping', 'Shipping Information'],
      ['/returns', 'Returns & Exchanges'],
      ['/faq', 'Frequently Asked Questions'],
      ['/support', 'Customer Support'],
      ['/privacy', 'Privacy Policy'],
      ['/terms', 'Terms of Service'],
      ['/cookies', 'Cookie Policy'],
    ];

    for (const [path, heading] of pages) {
      await test.step(`${path}`, async () => {
        const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
        expect(response?.status(), `${path} status`).toBe(200);
        await expect(page.getByRole('heading', { level: 1, name: heading }).first()).toBeVisible();
      });
    }
    await shot(page, testInfo, 'public-legal-page');
  });

  test('Track order lookup works', async ({ page }, testInfo) => {
    await page.goto('/track-order');
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Track', exact: true }) });
    await form.locator('input').nth(0).fill(ORDER_NUMBER);
    await form.locator('input').nth(1).fill(ORDER_PHONE);
    await page.getByRole('button', { name: 'Track', exact: true }).click();

    await expect(page.getByText(ORDER_NUMBER).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/PENDING|PROCESSING|PACKED|SHIPPED|DELIVERED/i).first()).toBeVisible();
    await shot(page, testInfo, 'public-track-order');
  });

  test('Guest cart page is publicly accessible', async ({ page }, testInfo) => {
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: /Shopping Cart/i }).first()).toBeVisible();
    await shot(page, testInfo, 'public-guest-cart');
  });

  test('Guest Buy Now prompts sign-in instead of allowing guest checkout', async ({ page }, testInfo) => {
    await page.goto(`/products/${PRODUCT_ID}`);
    await page.getByRole('button', { name: 'Buy Now' }).first().click();

    await expect(page.getByRole('heading', { name: 'Sign in to checkout' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Create an account/i })).toBeVisible();
    await shot(page, testInfo, 'public-guest-buy-now-auth');
  });

  test('404 page for an invalid product', async ({ page }, testInfo) => {
    await page.goto('/products/000000000000000000000000');
    await expect(page.getByText('404').first()).toBeVisible();
    await expect(page.getByText(/This page could not be found/i).first()).toBeVisible();
    await shot(page, testInfo, 'public-404');
  });
});
