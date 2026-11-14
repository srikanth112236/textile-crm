import { test } from '@playwright/test';
import { expectAccessible } from '../helpers/a11y';
import { shot } from '../helpers/auth';

const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';

const pages: Array<[string, string]> = [
  ['/', 'home'],
  ['/products', 'products'],
  [`/products/${PRODUCT_ID}`, 'product-detail'],
  ['/search?q=shirt', 'search'],
  ['/about', 'about'],
  ['/track-order', 'track-order'],
  ['/cart', 'guest-cart'],
];

test.describe('Accessibility — public website (WCAG 2.1 A/AA)', () => {
  for (const [path, name] of pages) {
    test(`${name} (${path})`, async ({ page }, testInfo) => {
      await page.goto(path);
      await page.waitForTimeout(1500);
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
      await expectAccessible(page, testInfo, name);
      await shot(page, testInfo, `a11y-${name}`);
    });
  }
});
