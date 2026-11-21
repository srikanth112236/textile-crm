import { test, expect } from '@playwright/test';

/**
 * P3 advanced import UI smoke:
 * - upsert mode is selectable
 * - CSV + XLSX templates are offered
 * - server reports the chosen mode in review
 */
test.describe('P3 advanced import — admin', () => {
  test('admin can validate in upsert mode with the advanced controls', async ({ page }) => {
    const csv = [
      'name,sku,category,price,stock,description,images',
      'P3 UI Test Tee,IMP-P3-UI-001,t-shirts,799,5,Upsert UI test row.,https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
    ].join('\n');

    await page.goto('/admin/products/import');
    await expect(page.getByRole('heading', { name: 'Bulk import products' })).toBeVisible();

    await expect(page.getByRole('link', { name: /CSV template/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /XLSX template/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create or update by SKU/i })).toBeVisible();

    await page.getByRole('button', { name: /Create or update by SKU/i }).click();

    await page.locator('#product-import-file').setInputFiles({
      name: 'p3-ui-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });

    await page.getByRole('button', { name: /Validate & preview/i }).click();

    await expect(page.getByText(/mode:/i)).toContainText('upsert', { timeout: 30_000 });
    await expect(page.getByText('IMP-P3-UI-001').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Import 1 row/i })).toBeEnabled();
  });

  test('history page and catalogue export entry are available', async ({ page }) => {
    await page.goto('/admin/products/import/history');
    await expect(page.getByRole('heading', { name: 'Import history' })).toBeVisible();

    await page.goto('/admin/products');
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Import CSV\/XLSX/i })).toBeVisible();
  });
});
