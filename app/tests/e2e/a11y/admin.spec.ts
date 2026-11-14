import { test } from '@playwright/test';
import { expectAccessible } from '../helpers/a11y';
import { shot } from '../helpers/auth';

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';
const ORDER_ID = '6aec4112e0e04fff96b1d156';

const pages: Array<[string, string]> = [
  ['/admin/dashboard', 'admin-dashboard'],
  ['/admin/products', 'admin-products'],
  [`/admin/products/${PRODUCT_ID}`, 'admin-product-edit'],
  ['/admin/orders', 'admin-orders'],
  [`/admin/orders/${ORDER_ID}`, 'admin-order-detail'],
  ['/admin/analytics', 'admin-analytics'],
  ['/admin/discounts', 'admin-discounts'],
  ['/admin/ugc', 'admin-ugc'],
  ['/admin/payments', 'admin-payments'],
  ['/admin/settings', 'admin-settings'],
  ['/superadmin/dashboard', 'superadmin-dashboard'],
];

test.describe('Accessibility — admin portal (WCAG 2.1 A/AA)', () => {
  for (const [path, name] of pages) {
    test(`${name} (${path})`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForTimeout(1500);

      if (name === 'admin-analytics') {
        await page.getByRole('heading', { name: 'Analytics Dashboard' }).first().waitFor({ state: 'visible', timeout: 35_000 });
      } else {
        await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
      }

      await expectAccessible(page, testInfo, name);
      await shot(page, testInfo, `a11y-${name}`);
    });
  }
});
