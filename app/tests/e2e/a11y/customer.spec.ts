import { test } from '@playwright/test';
import { expectAccessible } from '../helpers/a11y';
import { shot } from '../helpers/auth';

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';

const pages: Array<[string, string]> = [
  ['/user/dashboard', 'customer-dashboard'],
  ['/user/orders', 'customer-orders'],
  ['/user/profile', 'customer-profile'],
  ['/user/wishlist', 'customer-wishlist'],
  ['/user/invoices', 'customer-invoices'],
  ['/user/returns', 'customer-returns'],
  [`/checkout/express?product=${PRODUCT_ID}&qty=1&size=L&color=Grey`, 'express-checkout'],
];

test.describe('Accessibility — customer portal (WCAG 2.1 A/AA)', () => {
  for (const [path, name] of pages) {
    test(`${name} (${path})`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForTimeout(1500);
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 25_000 }).catch(() => {});
      await expectAccessible(page, testInfo, name);
      await shot(page, testInfo, `a11y-${name}`);
    });
  }
});
