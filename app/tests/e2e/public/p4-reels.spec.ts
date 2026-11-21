import { test, expect, APIRequestContext } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000';

async function adminToken(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: 'admin@ecom.com', password: 'Admin123!@#' },
  });
  expect(login.ok(), `Admin login failed: ${login.status()}`).toBeTruthy();
  return (await login.json()).accessToken;
}

test.describe('P4 Instagram Reels — product page', () => {
  test('PDP shows a Reel facade and loads the embed only after click', async ({ page, request }) => {
    const token = await adminToken(request);
    const headers = { Authorization: `Bearer ${token}` };
    const categories = await request.get(`${API_URL}/api/categories?limit=50`);
    const body = await categories.json();
    const category = (body.data || []).find((c: any) => c.slug === 't-shirts') || body.data?.[0];
    const sku = `P4-REEL-${Date.now()}`;

    const created = await request.post(`${API_URL}/api/products`, {
      headers,
      data: {
        name: 'P4 Reel Playback Test',
        sku,
        category: category._id,
        description: 'P4 Instagram Reel playback test.',
        price: 799,
        stock: 5,
        status: 'active',
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800'],
        shipping: {
          weight: 500,
          length: 30,
          width: 25,
          height: 3,
          requiresShipping: true,
        },
        videos: [{ url: 'https://www.instagram.com/reel/CPlayback99/', title: 'P4 Reel' }],
      },
    });
    expect(created.ok(), `Product create failed: ${created.status()}`).toBeTruthy();
    const productId = (await created.json()).data._id as string;

    try {
      await page.goto(`/products/${productId}`);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

      // No Instagram iframe before the shopper asks for it.
      await expect(page.locator('iframe[src*="instagram.com"]')).toHaveCount(0);

      const watch = page.getByRole('button', { name: /Watch Reel/i }).first();
      await expect(watch).toBeVisible();
      await watch.click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(
        page.locator('iframe[src*="instagram.com/reel/"][src*="/embed/"]')
      ).toBeVisible();

      const src = await page.locator('iframe[src*="instagram.com/reel/"]').getAttribute('src');
      expect(src).toContain('instagram.com/reel/CPlayback99/embed/');
    } finally {
      await request.delete(`${API_URL}/api/products/${productId}`, { headers }).catch(() => undefined);
    }
  });
});
