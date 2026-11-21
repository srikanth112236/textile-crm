import { test, expect, Page } from '@playwright/test';
import { CUSTOMER, collectPageErrors } from '../helpers/auth';

/** The login screen renders before React attaches; wait for the real field. */
async function waitForLoginHydration(page: Page) {
  await page.waitForFunction(
    () => {
      const email = document.querySelector('#email');
      if (!email) return false;
      return Object.keys(email).some((key) => key.startsWith('__reactProps$'));
    },
    null,
    { timeout: 60_000 }
  );
}

/**
 * P0 foundation smoke tests.
 *
 * These are intentionally small and selector-light: they verify the four
 * journeys every later phase must not break — sign in, product discovery,
 * filters/sort and the PDP add-to-cart entry point.
 */

test.describe('P0 foundations — public smoke', () => {
  test('customer can sign in through the real login form', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await waitForLoginHydration(page);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    const accept = page.getByRole('button', { name: 'Accept All Cookies' });
    if (await accept.isVisible().catch(() => false)) {
      await accept.click().catch(() => {});
    }

    await page.locator('#email').fill(CUSTOMER.email);
    await page.locator('#password').fill(CUSTOMER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // P1 returns to `/` (or callbackUrl), never an automatic dashboard.
    await expect
      .poll(async () => page.evaluate(() => Boolean(localStorage.getItem('accessToken'))), {
        timeout: 30_000,
      })
      .toBe(true);
    await expect(page).not.toHaveURL(/\/login/);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('product listing loads and sort state reaches the URL', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/products');
    await expect(page.getByText(/Showing 1 to \d+ of \d+ products/).first()).toBeVisible();

    // Desktop uses a Radix combobox; mobile uses a native select.
    const sort = page.getByRole('combobox', { name: 'Sort products' }).first();
    await expect(sort).toBeVisible();
    await sort.click();
    await page.getByRole('option', { name: 'Price: Low to High' }).click();

    await expect(page).toHaveURL(/sort=price/);
    await expect(page).toHaveURL(/order=asc/);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('category filter narrows the listing and keeps a shareable URL', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/products?category=t-shirts');
    await expect(page.getByText(/in this category|Showing 1 to \d+ of \d+/i).first()).toBeVisible();

    await page.goto('/products?category=shirts&fit=Slim%20Fit');
    await expect(page).toHaveURL(/category=shirts/);
    await expect(page).toHaveURL(/fit=Slim/);

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('listing card opens a product detail page with purchase controls', async ({ page }) => {
    const errors = collectPageErrors(page);

    await page.goto('/products?inStock=true');
    const firstProduct = page.locator('main a[href^="/products/"]').first();
    await expect(firstProduct).toBeVisible();

    const href = await firstProduct.getAttribute('href');
    expect(href).toMatch(/^\/products\/[a-f0-9]{24}$/);

    await firstProduct.click();
    await page.waitForURL(/\/products\/[a-f0-9]{24}$/);

    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.getByText(/Select Size:/i).first()).toBeVisible();
    await expect(page.locator('button:visible', { hasText: /^Add to Cart$/ }).first()).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
