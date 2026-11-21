import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import { ADMIN, CUSTOMER, loginAs } from './helpers/auth';

const AUTH_DIR = '.auth';

test.describe('Authentication setup', () => {
  test('customer session', async ({ browser }) => {
    await fs.mkdir(AUTH_DIR, { recursive: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAs(page, CUSTOMER.email, CUSTOMER.password);
    await page.goto('/user/dashboard');
    await expect(page).toHaveURL(/\/user\/dashboard/);
    await context.storageState({ path: `${AUTH_DIR}/customer.json` });
    await context.close();
  });

  test('superadmin session', async ({ browser }) => {
    await fs.mkdir(AUTH_DIR, { recursive: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto('/superadmin/dashboard');
    await expect(page).toHaveURL(/\/superadmin\/dashboard/);
    await context.storageState({ path: `${AUTH_DIR}/admin.json` });
    await context.close();
  });
});
