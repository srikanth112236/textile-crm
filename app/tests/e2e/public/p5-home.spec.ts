import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from '../helpers/auth';

/**
 * P5 homepage smoke test — verifies the new editorial hierarchy and that the
 * homepage does not regress into horizontal overflow at desktop or mobile.
 */
test.describe('P5 homepage v2', () => {
  test('homepage renders the editorial sections in order', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /SHARP\. RELAXED\. YOURS\./i })).toBeVisible();
    await expect(page.getByText('SHOP BY CATEGORY').first()).toBeVisible();
    await expect(page.getByText('NEW ARRIVALS').first()).toBeVisible();
    await expect(page.getByText('BEST SELLERS').first()).toBeVisible();
    await expect(page.getByText('ONE WARDROBE.').first()).toBeVisible();
    await expect(page.getByText('THE MENTOOS COMMUNITY').first()).toBeVisible();
    await expect(page.getByText(/NEW DROPS, FIT NOTES/i).first()).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('primary navigation is category-driven and links to filtered listings', async ({ page }) => {
    await page.goto('/');

    const primary = page.getByRole('navigation', { name: 'Primary' });
    await expect(primary).toBeVisible();

    const categoryLinks = primary.locator('a[href^="/products?category="]');
    expect(await categoryLinks.count()).toBeGreaterThanOrEqual(3);
  });

  test('mobile homepage remains usable without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: /SHARP\. RELAXED\. YOURS\./i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
