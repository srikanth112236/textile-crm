import { test, expect, APIRequestContext } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000';

async function adminToken(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: 'admin@ecom.com', password: 'Admin123!@#' },
  });
  expect(login.ok()).toBeTruthy();
  return (await login.json()).accessToken;
}

test.describe('P7 admin feature wave', () => {
  test('bulk edit updates stock from the products table', async ({ page, request }) => {
    const token = await adminToken(request);
    const headers = { Authorization: `Bearer ${token}` };
    const categories = await request.get(`${API_URL}/api/categories?limit=50`);
    const categoryBody = await categories.json();
    const category = (categoryBody.data || []).find((c: any) => c.slug === 't-shirts') || categoryBody.data?.[0];
    const sku = `P7-BULK-${Date.now()}`;

    const created = await request.post(`${API_URL}/api/products`, {
      headers,
      data: {
        name: 'P7 Bulk Test Tee',
        sku,
        category: category._id,
        description: 'P7 bulk edit test product.',
        price: 500,
        stock: 5,
        status: 'draft',
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'],
      },
    });
    expect(created.ok()).toBeTruthy();
    const productId = (await created.json()).data._id as string;

    try {
      await page.goto('/admin/products');
      await page.getByPlaceholder('Search products...').fill(sku);
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      const select = page.locator('input[aria-label="Select P7 Bulk Test Tee"]');
      await expect(select).toBeVisible({ timeout: 30_000 });
      await select.check();

      await page.getByRole('button', { name: 'Bulk edit' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.locator('#bulk-stock').fill('77');
      await page.getByRole('button', { name: /Apply to selected/i }).click();

      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 30_000 });

      await expect.poll(async () => {
        const response = await request.get(`${API_URL}/api/products?search=${encodeURIComponent(sku)}&limit=5`, { headers });
        const body = await response.json();
        const product = (body.data || []).find((item: any) => item.sku === sku);
        return product?.stock;
      }, { timeout: 20_000 }).toBe(77);
    } finally {
      await request.delete(`${API_URL}/api/products/${productId}`, { headers }).catch(() => undefined);
    }
  });

  test('media and SEO health page is available', async ({ page }) => {
    await page.goto('/admin/media');
    await expect(page.getByRole('heading', { name: 'Media & SEO health' })).toBeVisible();
    await expect(page.getByText('Alt-text score')).toBeVisible();
  });
});
