import { test, expect, Page } from '@playwright/test';
import { collectPageErrors, shot } from '../helpers/auth';

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';
const CATEGORY_ID = '6acf3b31e5192c6bafa49ad9';
const ORDER_ID = '6aec4112e0e04fff96b1d156';
const WAREHOUSE_ID = '6ad35608c2a73410f4709e80';

async function expectPage(page: Page, path: string, heading: RegExp) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), `${path} status`).toBe(200);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/Application error|Internal Server Error/i)).toHaveCount(0);
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(2_000);
    }
  }

  throw lastError;
}

test.describe('Admin portal', () => {
  test.describe.configure({ timeout: 300_000 });

  test('Admin dashboard and catalog pages load', async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);
    const routes: Array<[string, RegExp]> = [
      ['/admin/dashboard', /Admin Dashboard/i],
      ['/admin/products', /^Products$/i],
      ['/admin/products/' + PRODUCT_ID, /Edit Product/i],
      ['/admin/categories', /^Categories$/i],
      ['/admin/categories/new', /Create New Category/i],
      ['/admin/categories/' + CATEGORY_ID, /Edit Category/i],
      ['/admin/tags', /Tags Management/i],
      ['/admin/reviews', /Review Management/i],
      ['/admin/shop-look', /Shop the Look/i],
      ['/admin/ugc', /UGC & Social/i],
      ['/admin/ugc/moderate', /UGC & Video Review Moderation/i],
    ];

    for (const [path, text] of routes) {
      await test.step(path, async () => {
        await expectPage(page, path, text);
      });
    }
    await page.goto('/admin/dashboard');
    await shot(page, testInfo, 'admin-dashboard');
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('Sales, deliveries and payment pages load', async ({ page }, testInfo) => {
    const routes: Array<[string, RegExp]> = [
      ['/admin/orders', /Order Management/i],
      ['/admin/orders/' + ORDER_ID, /ORD-20261105-002/i],
      ['/admin/deliveries', /Logistics & Deliveries Operations/i],
      ['/admin/payments', /^Payments$/i],
      ['/admin/payments/refunds', /^Payments$/i],
      ['/admin/invoices', /GST Tax Invoices/i],
      ['/admin/discounts', /Discounts & Coupons/i],
      ['/admin/returns', /Returns & Exchange/i],
    ];

    for (const [path, text] of routes) {
      await test.step(path, async () => {
        await expectPage(page, path, text);
      });
    }
    await page.goto('/admin/orders');
    await shot(page, testInfo, 'admin-orders');
  });

  test('Inventory, stock and user pages load', async ({ page }, testInfo) => {
    const routes: Array<[string, RegExp]> = [
      ['/admin/inventory', /Inventory Dashboard/i],
      ['/admin/inventory/stock', /Adjust Stock/i],
      ['/admin/inventory/movements', /Stock Movements/i],
      ['/admin/inventory/warehouses', /^Warehouses$/i],
      ['/admin/inventory/warehouses/new', /Add Warehouse/i],
      ['/admin/inventory/warehouses/' + WAREHOUSE_ID, /Edit Warehouse/i],
      ['/admin/inventory/transfer', /Stock Transfer/i],
      ['/admin/stock', /Stock Management/i],
      ['/admin/stock-alerts', /Retention Alerts/i],
      ['/admin/users', /User Management/i],
    ];

    for (const [path, text] of routes) {
      await test.step(path, async () => {
        await expectPage(page, path, text);
      });
    }
  });

  test('Analytics, logs, permissions and settings load', async ({ page }, testInfo) => {
    const routes: Array<[string, RegExp]> = [
      ['/admin/analytics', /Analytics Dashboard/i],
      ['/admin/analytics/advanced', /Advanced Analytics/i],
      ['/admin/logs', /Audit Logs/i],
      ['/admin/permissions', /Permissions & Roles/i],
      ['/admin/settings', /Store Settings/i],
      ['/superadmin/dashboard', /Superadmin Dashboard/i],
    ];

    for (const [path, text] of routes) {
      await test.step(path, async () => {
        await expectPage(page, path, text);
      });
    }
    await page.goto('/admin/analytics');
    await expect(page.getByText('Total Revenue').filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
    await shot(page, testInfo, 'admin-analytics');
  });

  test('Admin product search filters the table', async ({ page }, testInfo) => {
    await page.goto('/admin/products');
    await expect(page.getByText('Products').filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
    await page.getByPlaceholder('Search products...').fill('vest');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page).toHaveURL(/search=vest/);
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    const rows = await page.locator('table tbody tr').count();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThan(20);
    await shot(page, testInfo, 'admin-product-search');
  });

  test('Admin order search filters the table', async ({ page }, testInfo) => {
    await page.goto('/admin/orders');
    const input = page.getByPlaceholder(/Order #, customer name/i);
    await input.fill('ORD-20261105');
    await input.press('Enter');
    await expect(page).toHaveURL(/q=ORD-20261105/);
    await expect(page.getByText('ORD-20261105-002').filter({ visible: true }).first()).toBeVisible();
    await shot(page, testInfo, 'admin-order-search');
  });

  test('Store settings shows shipping threshold options and current value', async ({ page }, testInfo) => {
    await page.goto('/admin/settings');
    await expect(page.getByText('Shipping below threshold ₹').filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('₹55').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText('Shiprocket enabled').filter({ visible: true }).first()).toBeVisible();
    await shot(page, testInfo, 'admin-settings');
  });

  test('Storefront announcement marquee is admin-managed with 10+ messages', async ({ page }, testInfo) => {
    await page.goto('/admin/settings');
    await expect(
      page.getByText(/Announcement marquee messages \(10\)/).filter({ visible: true }).first()
    ).toBeVisible({ timeout: 30_000 });

    // One editor row per message, pre-filled from the storefront defaults.
    await expect(page.getByLabel(/^Announcement message \d+$/)).toHaveCount(10);
    await expect(page.getByText('10+ READY').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Message' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restore 10 defaults' })).toBeVisible();

    // Adding a row is possible from the admin panel.
    await page.getByRole('button', { name: 'Add Message' }).click();
    await expect(page.getByLabel(/^Announcement message \d+$/)).toHaveCount(11);
    await page.getByRole('textbox', { name: 'Announcement message 11' }).fill('🧪 ADMIN TEST MESSAGE');
    await expect(page.getByText(/Announcement marquee messages \(11\)/).first()).toBeVisible();

    await shot(page, testInfo, 'admin-announcements');
  });

  test('Product edit shows saved product video and variant tools', async ({ page }, testInfo) => {
    await page.goto(`/admin/products/${PRODUCT_ID}`);
    await expect(page.getByText('Product Video').filter({ visible: true }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Show floating player').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('video').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Product' })).toBeVisible();
    await shot(page, testInfo, 'admin-product-edit');
  });
});
