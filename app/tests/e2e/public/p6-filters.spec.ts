import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from '../helpers/auth';

test.describe('P6 filters & listing', () => {
  test('desktop rail applies a category filter and Clear all resets URL state', async ({ page }) => {
    await page.goto('/products');

    const aside = page.locator('aside');
    await expect(aside.getByText('Filter Products')).toBeVisible();

    await aside.getByRole('button', { name: /T-Shirts/i }).first().click();

    await expect(page).toHaveURL(/category=/);

    const activeFilters = page.getByRole('region', { name: 'Active filters' });
    await expect(activeFilters.getByText('T-Shirts').first()).toBeVisible();

    await activeFilters.getByRole('button', { name: /Clear all/i }).click();
    await expect(page).toHaveURL(/\/products(\?|$)/);
    await expectNoHorizontalOverflow(page);
  });

  test('filter state survives a refresh', async ({ page }) => {
    await page.goto('/products?fit=Oversized');
    await page.reload();

    const activeFilters = page.getByRole('region', { name: 'Active filters' });
    await expect(activeFilters.getByText('Oversized')).toBeVisible();
    await expect(page).toHaveURL(/fit=Oversized/);
  });

  test('mobile filter sheet is full-height, applies and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/products');

    await page.getByRole('button', { name: /^Filter/ }).first().click();

    const sheet = page.getByRole('dialog', { name: 'Product filters' });
    await expect(sheet).toBeVisible();

    await sheet.getByRole('button', { name: /^Size/ }).click();
    await sheet.locator('button[title^="M "]').first().click();

    await sheet.getByRole('button', { name: /Show \d+ results/ }).click();
    await expect(sheet).toBeHidden();

    await expect(page).toHaveURL(/size=M/);
    await expect(
      page.getByRole('region', { name: 'Active filters' }).getByRole('button', { name: 'Remove size filter M' })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
