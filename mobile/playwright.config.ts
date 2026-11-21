import { defineConfig } from '@playwright/test';

/**
 * End-to-end checks for the mobile app's web build.
 *
 * `npm run test:e2e` boots `npm run dev:web` (CORS proxy on 5050 + Expo web on
 * 8081) unless something is already listening on 8081, then drives the real
 * production API through the browser.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'test-results/html', open: 'never' }]],
  outputDir: 'test-results/artifacts',
  use: {
    // Tests run against the production web export (:8090) — deterministic, no
    // Metro dev overlay, and it is the same bundle that ships.
    baseURL: 'http://localhost:8090',
    // Phone-sized viewport for screenshots. `isMobile` is deliberately off:
    // Chromium's mobile emulation shrinks the visual viewport (390x670) and the
    // captured PNG ends up shorter than the layout, clipping the tab bar.
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 25_000,
    navigationTimeout: 90_000,
  },
  projects: [{ name: 'mobile-web' }],
  webServer: [
    {
      command: 'npm run proxy',
      url: 'http://localhost:5050/api/health',
      reuseExistingServer: true,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm run build:web && npm run serve:web',
      url: 'http://localhost:8090',
      reuseExistingServer: true,
      timeout: 300_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
