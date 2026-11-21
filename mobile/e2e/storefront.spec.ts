import { expect, test } from '@playwright/test';
import { collectConsoleErrors, gotoHome, REACH_ERROR, waitForData } from './helpers';

test.describe('public pages use the live backend', () => {
  test('home renders categories and product rails', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await gotoHome(page);

    // First paint after a Render cold start can take ~50s; give the rails room.
    await expect(page.getByText('Shop by category')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('New arrivals').first()).toBeVisible();
    await expect(page.getByText('Trending now').first()).toBeVisible();

    // Real prices from the API, not placeholders.
    await expect(page.getByText(/₹\d/).first()).toBeVisible();
    await expect(page.getByText(/Pro-Gym|Heavyweight|Korean|Sweatshirt/i).first()).toBeVisible();
    await expect(page.getByText(REACH_ERROR)).toHaveCount(0);

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('shop lists the category tree', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });

    await waitForData(page, /styles across 10 collections/);
    await expect(page.getByText('All products')).toBeVisible();
    await expect(page.getByText('Activewear')).toBeVisible();
    await expect(page.getByText('Ethnic Wear')).toBeVisible();
    await expect(page.getByText(REACH_ERROR)).toHaveCount(0);

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('category page shows its products', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/categories/gym-vests', { waitUntil: 'domcontentloaded' });

    await waitForData(page, /Gym Vests/);
    await expect(page.getByText(/8 products/)).toBeVisible();
    await expect(page.getByText(/₹\d/).first()).toBeVisible();
    await expect(page.getByText(REACH_ERROR)).toHaveCount(0);

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('content pages render store copy', async ({ page }) => {
    for (const [slug, heading] of [
      ['shipping', 'Shipping & delivery'],
      ['returns', 'Returns & refunds'],
      ['faq', 'Frequently asked questions'],
      ['privacy', 'Privacy policy'],
    ] as const) {
      await page.goto(`/content/${slug}`, { waitUntil: 'domcontentloaded' });
      await waitForData(page, heading);
      await expect(page.getByText(heading).filter({ visible: true }).first()).toBeVisible();
    }
  });
});
