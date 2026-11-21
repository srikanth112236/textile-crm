import { test, expect } from '@playwright/test';

test.describe('P8 hardening — admin', () => {
  test('system health page surfaces services, flags and imports', async ({ page }) => {
    await page.goto('/admin/system');

    await expect(page.getByRole('heading', { name: 'System health' })).toBeVisible();
    await expect(page.getByText('Services')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Feature flags' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent imports' })).toBeVisible();
    await expect(page.getByText(/mongodb/i).first()).toBeVisible();
  });
});
