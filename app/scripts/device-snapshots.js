/* Desktop / tablet / mobile visual audit + overflow checks. */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'reports', 'device-shots');
fs.mkdirSync(OUT, { recursive: true });

const BASE = 'http://localhost:3001';
const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';

const devices = [
  { id: 'desktop', width: 1440, height: 1000, label: 'Desktop 1440×1000' },
  { id: 'tablet', width: 834, height: 1112, label: 'Tablet 834×1112 (iPad)' },
  { id: 'mobile', width: 393, height: 812, label: 'Mobile 393×812' },
];

const publicPages = [
  { id: 'home', path: '/', wait: /THE OVERSIZED REVOLUTION|NEW ARRIVALS/i },
  { id: 'products', path: '/products', wait: /Showing 1 to/i },
  { id: 'pdp', path: `/products/${PRODUCT_ID}`, wait: /Select Size:|Pro-Gym/i },
  { id: 'category', path: '/categories/t-shirts', wait: /products in this category/i },
  { id: 'search', path: '/search?q=shirt', wait: /Found \d+ results/i },
  { id: 'cart', path: '/cart', wait: /Shopping Cart/i },
  { id: 'track-order', path: '/track-order', wait: /Track Your Mentoos Order/i },
  { id: 'login', path: '/login', wait: /Welcome|Sign In|Login/i },
];

const authPages = [
  { id: 'customer-dashboard', path: '/user/dashboard', role: 'customer', wait: /Dashboard|Welcome/i },
  { id: 'admin-dashboard', path: '/admin/dashboard', role: 'admin', wait: /Dashboard|Welcome/i },
];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const rows = [];

  for (const device of devices) {
    for (const pageDef of publicPages) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: 1,
        isMobile: device.id === 'mobile',
        hasTouch: device.id === 'mobile',
      });
      await context.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      try {
        const response = await page.goto(`${BASE}${pageDef.path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForTimeout(1200);
        const file = `${device.id}-${pageDef.id}.png`;
        await page.screenshot({ path: path.join(OUT, file), fullPage: false });
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        }));
        rows.push({
          device: device.id,
          deviceLabel: device.label,
          page: pageDef.id,
          path: pageDef.path,
          status: response?.status() || 0,
          overflowPx: overflow.overflow,
          screenshot: `device-shots/${file}`,
          errors,
        });
      } catch (e) {
        rows.push({
          device: device.id,
          deviceLabel: device.label,
          page: pageDef.id,
          path: pageDef.path,
          status: 0,
          overflowPx: null,
          screenshot: '',
          errors: [String(e.message)],
        });
      }
      await context.close();
    }
  }

  for (const pageDef of authPages) {
    const statePath = path.join(ROOT, 'app', '.auth', pageDef.role === 'admin' ? 'admin.json' : 'customer.json');
    if (!fs.existsSync(statePath)) continue;
    for (const device of devices) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        storageState: statePath,
      });
      await context.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      try {
        const response = await page.goto(`${BASE}${pageDef.path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForTimeout(1500);
        const file = `${device.id}-${pageDef.id}.png`;
        await page.screenshot({ path: path.join(OUT, file), fullPage: false });
        const overflow = await page.evaluate(() => ({
          overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        }));
        rows.push({
          device: device.id,
          deviceLabel: device.label,
          page: pageDef.id,
          path: pageDef.path,
          status: response?.status() || 0,
          overflowPx: overflow.overflow,
          screenshot: `device-shots/${file}`,
          errors,
        });
      } catch (e) {
        rows.push({
          device: device.id,
          deviceLabel: device.label,
          page: pageDef.id,
          path: pageDef.path,
          status: 0,
          overflowPx: null,
          screenshot: '',
          errors: [String(e.message)],
        });
      }
      await context.close();
    }
  }

  await browser.close();
  const output = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    devices,
    rows,
  };
  fs.writeFileSync(path.join(ROOT, 'reports', 'device-shots', 'device-audit.json'), JSON.stringify(output, null, 2));
  console.log('Wrote reports/device-shots/device-audit.json');
  console.log(rows.map((r) => `${r.device}/${r.page}: ${r.status} overflow=${r.overflowPx}`).join('\n'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
