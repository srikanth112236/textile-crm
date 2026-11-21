import { test, expect, APIRequestContext } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000';

async function adminToken(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: 'admin@ecom.com', password: 'Admin123!@#' },
  });
  expect(login.ok(), `Admin login failed: ${login.status()}`).toBeTruthy();
  return (await login.json()).accessToken;
}

test.describe('P4 Instagram Reels — UGC', () => {
  test('featured UGC Reel opens the click-to-load embed', async ({ page, request }) => {
    const token = await adminToken(request);
    const headers = { Authorization: `Bearer ${token}` };
    const categories = await request.get(`${API_URL}/api/categories?limit=50`);
    const body = await categories.json();
    const category = (body.data || []).find((c: any) => c.slug === 't-shirts') || body.data?.[0];
    const sku = `P4-UGC-${Date.now()}`;

    const created = await request.post(`${API_URL}/api/products`, {
      headers,
      data: {
        name: 'P4 UGC Reel Test',
        sku,
        category: category._id,
        description: 'UGC Reel playback test.',
        price: 799,
        stock: 5,
        status: 'active',
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'],
        shipping: { weight: 500, length: 30, width: 25, height: 3, requiresShipping: true },
      },
    });
    expect(created.ok()).toBeTruthy();
    const productId = (await created.json()).data._id as string;

    const ugc = await request.post(`${API_URL}/api/ugc/admin`, {
      headers,
      data: {
        mediaUrl: 'https://www.instagram.com/reel/CUgcPlay99/',
        customerName: '@p4_reel_test',
        caption: 'P4 featured customer reel',
        productId,
        featured: true,
      },
    });
    expect(ugc.ok(), `UGC create failed: ${ugc.status()}`).toBeTruthy();
    const ugcId = (await ugc.json()).data._id as string;

    try {
      await page.goto('/');
      const card = page.locator('div.group', { hasText: '@p4_reel_test' }).first();
      await expect(card).toBeVisible({ timeout: 20_000 });

      await card.getByRole('button', { name: 'Play Instagram Reel' }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      const iframe = page.locator('iframe[src*="instagram.com/reel/CUgcPlay99/embed/"]');
      await expect(iframe).toBeVisible();
    } finally {
      await request.delete(`${API_URL}/api/ugc/admin/${ugcId}`, { headers }).catch(() => undefined);
      await request.delete(`${API_URL}/api/products/${productId}`, { headers }).catch(() => undefined);
    }
  });
});
