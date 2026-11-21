import { test, expect } from '@playwright/test';

/**
 * P2 bulk-import smoke test.
 *
 * Validates the upload -> server validation -> preview path without committing,
 * so the test does not add catalogue rows. A valid row and an invalid row are
 * included to prove partial validation is surfaced correctly.
 */
test.describe('P2 bulk import — admin', () => {
  test('admin can validate a CSV and review errors before importing', async ({ page }) => {
    const csv = [
      'name,sku,category,price,stock,description,images',
      'P2 Import Test Tee,IMP-P2-001,t-shirts,799,5,Valid import row.,https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      'P2 Broken Category Tee,IMP-P2-002,missing-category,799,5,Invalid import row.,https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
    ].join('\n');

    await page.goto('/admin/products/import');
    await expect(page.getByRole('heading', { name: 'Bulk import products' })).toBeVisible();

    await page.locator('#product-import-file').setInputFiles({
      name: 'p2-import-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });

    await page.getByRole('button', { name: /Validate & preview/i }).click();

    await expect(page.getByText('Ready to import').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('IMP-P2-001').first()).toBeVisible();
    await expect(page.getByText('Rows that will be skipped').first()).toBeVisible();
    await expect(page.getByText(/Category "missing-category" was not found/i).first()).toBeVisible();

    await expect(page.getByRole('button', { name: /Import 1 row/i })).toBeEnabled();
  });
});
