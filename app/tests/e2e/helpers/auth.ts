import { Page, TestInfo, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

export const CUSTOMER = { email: 'test.user@mentoos.in', password: 'Test@1234' };
export const ADMIN = { email: 'admin@ecom.com', password: 'Admin123!@#' };

/** Wait until React has hydrated the login form (props attached to a field). */
async function waitForHydration(page: Page) {
  await page.waitForFunction(
    () => {
      // The login screen uses a div-based form in some layouts, so anchor on
      // the field itself rather than document.querySelector('form').
      const field = document.querySelector('#email') || document.querySelector('form input');
      if (!field) return false;
      return Object.keys(field).some((key) => key.startsWith('__reactProps$'));
    },
    null,
    { timeout: 60_000 }
  );
}

/**
 * Sign in through the real UI.
 *
 * P1 removed the automatic dashboard redirect: a shopper returns to `/` or
 * the callback page. The helper therefore waits for the access token, not a
 * dashboard URL. Tests that need a dashboard navigate there explicitly.
 */
export async function loginAs(page: Page, email: string, password: string) {
  // Keep the cookie banner from covering the primary action during tests.
  await page.addInitScript(() => {
    try { localStorage.setItem('cookie-consent-accepted', 'true'); } catch { /* ignore */ }
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Wait for either the form or the already-signed-in card. Checking
    // visibility immediately after goto races React hydration.
    await page.waitForFunction(
      () => !!document.querySelector('#email') || /already signed in/i.test(document.body.innerText),
      null,
      { timeout: 60_000 }
    );

    // A retry can land on the already-signed-in card. In that case the
    // session is already usable.
    if (await page.locator('#email').isVisible().catch(() => false)) {
      await waitForHydration(page);
      await page.locator('#email').fill(email);
      await page.locator('#password').fill(password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    }

    try {
      await page.waitForFunction(() => !!localStorage.getItem('accessToken'), null, {
        timeout: 40_000,
      });
      await expect(page.locator('body')).not.toContainText(/invalid credentials|incorrect/i);
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

export function collectPageErrors(page: Page) {
  const errors: string[] = [];
  const apiUrl = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000';
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('response', (res) => {
    if (res.url().startsWith(`${apiUrl}/api`) && res.status() >= 500) {
      errors.push(`API ${res.status()}: ${res.url()}`);
    }
  });
  return errors;
}

export async function shot(page: Page, info: TestInfo, name: string) {
  const slug = name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const file = path.resolve(__dirname, '../../../..', 'reports', 'artifacts', `${info.project.name}-${slug}.png`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage: false });
  await info.attach(name, { path: file, contentType: 'image/png' });
  return file;
}

export async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(
    metrics.scrollWidth,
    `Horizontal overflow: scrollWidth=${metrics.scrollWidth}px vs viewport=${metrics.innerWidth}px`
  ).toBeLessThanOrEqual(metrics.innerWidth + 1);
  return metrics;
}

/** Clear the customer's cart via the API so tests don't leak state. */
export async function clearCart(page: Page) {
  const apiUrl = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5000';
  await page.evaluate(async (baseUrl) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    await fetch(`${baseUrl}/api/cart`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }, apiUrl);
}
