import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from '../helpers/auth';

test.describe('P7 storefront feature wave', () => {
  test('quick add exposes the size guide without leaving the listing', async ({ page }) => {
    await page.goto('/products?category=gym-vests');

    await page.getByRole('button', { name: /Quick Add/i }).first().click();
    await page.getByRole('button', { name: 'Size guide' }).first().click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/Size Guide/i).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
