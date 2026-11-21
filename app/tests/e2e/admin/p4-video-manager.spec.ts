import { test, expect, APIRequestContext } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000';

async function adminToken(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: 'admin@ecom.com', password: 'Admin123!@#' },
  });
  expect(login.ok()).toBeTruthy();
  return (await login.json()).accessToken;
}

test.describe('P4 Instagram Reels — admin media picker', () => {
  test('pasting a Reel URL shows a detected preview before saving', async ({ page, request }) => {
    const token = await adminToken(request);
    const headers = { Authorization: `Bearer ${token}` };
    const categories = await request.get(`${API_URL}/api/categories?limit=50`);
    const body = await categories.json();
    const category = (body.data || []).find((c: any) => c.slug === 't-shirts') || body.data?.[0];

    const created = await request.post(`${API_URL}/api/products`, {
      headers,
      data: {
        name: 'P4 Video Manager Test',
        sku: `P4-VM-${Date.now()}`,
        category: category._id,
        description: 'Admin video manager test.',
        price: 799,
        stock: 5,
        status: 'draft',
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'],
      },
    });
    expect(created.ok()).toBeTruthy();
    const productId = (await created.json()).data._id as string;

    try {
      await page.goto(`/admin/products/${productId}`);
      await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole('textbox', { name: /Product Name/i })).toHaveValue('P4 Video Manager Test');

      await page.getByRole('button', { name: 'Paste URL' }).click();
      await page.getByPlaceholder('MP4 URL or Instagram Reel link').fill('https://www.instagram.com/reel/CAdminPick99/');

      await expect(page.getByText(/Instagram reel detected/i)).toBeVisible();
      await page.getByRole('button', { name: 'Add', exact: true }).click();

      await expect(page.getByText('Reel detected')).toBeVisible();
      await expect(page.getByText('CAdminPick99').first()).toBeVisible();
    } finally {
      await request.delete(`${API_URL}/api/products/${productId}`, { headers }).catch(() => undefined);
    }
  });
});
