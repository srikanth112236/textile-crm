import { expect, test } from '@playwright/test';
import { gotoHome, waitForData } from './helpers';

// Screenshots are taken from the production web export (port 8090) so Metro's
// dev overlay never appears in them.
test.use({ baseURL: 'http://localhost:8090' });

/**
 * Device-sized screenshots of every public screen, written to
 * mobile/e2e/screenshots. These double as the visual record for design review.
 */
const SHOTS: Array<{ path: string; file: string; wait: RegExp }> = [
  { path: '/', file: '01-home', wait: /New arrivals/ },
  { path: '/shop', file: '02-shop', wait: /styles across/ },
  { path: '/categories/gym-vests', file: '03-category', wait: /products/ },
  { path: '/products', file: '04-listing', wait: /\d+ products/ },
  { path: '/search', file: '05-search', wait: /SHOP BY CATEGORY/ },
  { path: '/cart', file: '06-bag', wait: /Your bag/ },
  { path: '/account', file: '07-account', wait: /Account/ },
  { path: '/auth', file: '08-auth', wait: /Welcome back/ },
  { path: '/content/shipping', file: '09-content', wait: /Shipping & delivery/ },
  { path: '/track-order', file: '10-track-order', wait: /Track your order/ },
];

test('capture storefront screens', async ({ page }) => {
  test.setTimeout(420_000);

  // Brand splash: capture before the session/minimum-delay gate releases.
  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForTimeout(450);
  await page.screenshot({ path: 'e2e/screenshots/00-splash.png' });

  await gotoHome(page);

  for (const shot of SHOTS) {
    await page.goto(shot.path, { waitUntil: 'domcontentloaded' });
    await waitForData(page, shot.wait, 60_000);
    // Every full page load boots the app, so let the brand splash fade out.
    await page.getByTestId('brand-splash').waitFor({ state: 'detached', timeout: 20_000 }).catch(() => {});
    // Wait for the remote product imagery, not just the DOM.
    await page
      .waitForFunction(
        () =>
          Array.from(document.images)
            .filter((img) => img.getBoundingClientRect().width > 8)
            .every((img) => img.complete && img.naturalWidth > 0),
        undefined,
        { timeout: 20_000 }
      )
      .catch(() => {});
    await page.waitForTimeout(700);
    await page.screenshot({ path: `e2e/screenshots/${shot.file}.png` });
  }

  // Search suggestions (mid-typing, before committing the query).
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await waitForData(page, /SHOP BY CATEGORY/, 60_000);
  await page.getByPlaceholder(/Search “oversized tee”/).fill('kurta');
  await expect(page.getByText(/See all \d+ results/)).toBeVisible({ timeout: 40_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'e2e/screenshots/05b-search-suggestions.png' });

  // Product detail.
  await page.goto('/products', { waitUntil: 'domcontentloaded' });
  await waitForData(page, /\d+ products/, 60_000);
  await page.locator('a[href^="/product/"]').first().click();
  await expect(page.getByText('Product details')).toBeVisible({ timeout: 40_000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'e2e/screenshots/11-product-detail.png' });

  expect(SHOTS.length).toBeGreaterThan(0);
});
