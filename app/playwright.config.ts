import { defineConfig, devices } from '@playwright/test';

/**
 * Complete QA suite for the Mentoos e-commerce app.
 *
 * Projects:
 *  - setup     → logs in customer + superadmin and saves storage state
 *  - public    → anonymous storefront journeys
 *  - customer  → logged-in customer portal + cart/checkout/express
 *  - admin     → admin & superadmin portal
 *  - mobile    → 393px responsive checks
 *  - a11y-*    → axe-core WCAG 2.1 AA scans
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: '../reports/test-results',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../reports/playwright-html', open: 'never' }],
    ['json', { outputFile: '../reports/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    viewport: { width: 1440, height: 1000 },
    actionTimeout: 20_000,
    navigationTimeout: 60_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { channel: 'chrome' } },
    {
      name: 'public',
      testMatch: /public\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'customer',
      testMatch: /customer\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: '.auth/customer.json' },
    },
    {
      name: 'admin',
      testMatch: /admin\/.*\.spec\.ts/,
      dependencies: ['setup'],
      retries: 1,
      use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: '.auth/admin.json' },
    },
    {
      name: 'mobile',
      testMatch: /mobile\/.*\.spec\.ts/,
      use: { ...devices['Pixel 5'], channel: 'chrome' },
    },
    {
      name: 'compat-chromium',
      testMatch: /compat\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'compat-firefox',
      testMatch: /compat\/.*\.spec\.ts/,
      use: { ...devices['Desktop Firefox'], channel: undefined },
    },
    {
      name: 'compat-webkit',
      testMatch: /compat\/.*\.spec\.ts/,
      use: { ...devices['Desktop Safari'], channel: undefined },
    },
    {
      name: 'a11y-public',
      testMatch: /a11y\/public\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'a11y-customer',
      testMatch: /a11y\/customer\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: '.auth/customer.json' },
    },
    {
      name: 'a11y-admin',
      testMatch: /a11y\/admin\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], channel: 'chrome', storageState: '.auth/admin.json' },
    },
  ],
});
