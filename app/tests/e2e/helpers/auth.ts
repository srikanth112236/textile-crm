import { Page, TestInfo, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

export const CUSTOMER = { email: 'test.user@mentoos.in', password: 'Test@1234' };
export const ADMIN = { email: 'admin@ecom.com', password: 'Admin123!@#' };

/** Wait until React has hydrated the page (props attached to DOM nodes). */
async function waitForHydration(page: Page) {
  await page.waitForFunction(
    () => {
      const form = document.querySelector('form');
      if (!form) return false;
      return Object.keys(form).some((key) => key.startsWith('__reactProps$'));
    },
    null,
    { timeout: 60_000 }
  );
}

/** Sign in through the real UI and wait until the backend access token is stored. */
export async function loginAs(page: Page, email: string, password: string) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    const accept = page.getByRole('button', { name: 'Accept All Cookies' });
    if (await accept.isVisible().catch(() => false)) {
      await accept.click().catch(() => {});
    }

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    try {
      await page.waitForURL(/\/(user|admin|superadmin)\/dashboard/, { timeout: 30_000 });
      await page.waitForFunction(() => !!localStorage.getItem('accessToken'), null, { timeout: 20_000 });
      await expect(page.locator('body')).not.toContainText('Invalid credentials');
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

export function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('response', (res) => {
    if (res.url().includes(':5000/api') && res.status() >= 500) {
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
  await page.evaluate(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    await fetch('http://localhost:5000/api/cart', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  });
}
