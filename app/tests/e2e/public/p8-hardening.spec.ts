import { test, expect } from '@playwright/test';

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';

test.describe('P8 hardening — SEO and errors', () => {
  test('product page exposes valid product and breadcrumb structured data', async ({ page }) => {
    await page.goto(`/products/${PRODUCT_ID}`);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.flatMap((block) => {
      try {
        const value = JSON.parse(block);
        return Array.isArray(value) ? value : [value];
      } catch {
        return [];
      }
    });

    const product = parsed.find((item: any) => item['@type'] === 'Product');
    expect(product).toBeTruthy();
    expect(product.sku).toBeTruthy();
    expect(product.offers?.priceCurrency).toBe('INR');
    expect(product.offers?.seller?.name).toBe('Mentoos');

    const breadcrumb = parsed.find((item: any) => item['@type'] === 'BreadcrumbList');
    expect(breadcrumb?.itemListElement?.length).toBeGreaterThanOrEqual(3);
  });

  test('unknown product route renders the branded not-found page', async ({ page }) => {
    await page.goto('/products/000000000000000000000000');
    await expect(page.getByText(/could not be found|not found/i).first()).toBeVisible();
  });
});
