/* Focused audit: product listing filters, shop UX, timings, accessibility and mobile behaviour. */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'reports', 'filter-audit');
const ART_DIR = path.join(OUT_DIR, 'shots');
fs.mkdirSync(ART_DIR, { recursive: true });

const BASE = 'http://localhost:3001';
const metrics = [];

function now() {
  return Date.now();
}

async function apiEntries(page) {
  return page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .filter((e) => e.name.includes('/api/'))
      .map((e) => ({ name: e.name.replace('http://localhost:5000', ''), duration: Math.round(e.duration), start: Math.round(e.startTime) }))
  );
}

async function shot(page, name) {
  const file = path.join(ART_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return path.relative(OUT_DIR, file).replace(/\\/g, '/');
}

async function waitForProducts(page) {
  await page.getByText(/Showing 1 to \d+ of \d+ products/).first().waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('.animate-pulse').first().waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {});
}

async function measureAction(page, label, action, shotName) {
  const before = await apiEntries(page);
  const t0 = now();
  await action();
  const tClick = now();
  await page.waitForTimeout(150);
  await page.locator('.animate-pulse').first().waitFor({ state: 'detached', timeout: 30_000 }).catch(() => {});
  const tSettled = now();
  const after = await apiEntries(page);
  const newCalls = after.filter((e) => !before.some((b) => b.name === e.name && b.start === e.start));
  const productCalls = newCalls.filter((e) => e.name.startsWith('/api/products?'));
  const record = {
    action: label,
    url: page.url(),
    clickToSettledMs: tSettled - tClick,
    totalMs: tSettled - t0,
    apiCalls: newCalls.map((e) => e.name),
    productApiCalls: productCalls.length,
    productApiDurations: productCalls.map((e) => e.duration),
    screenshot: shotName ? await shot(page, shotName) : null,
  };
  metrics.push(record);
  return record;
}

async function dismissCookies(page) {
  const accept = page.getByRole('button', { name: 'Accept All Cookies' });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click().catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function desktopProducts(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
  const page = await context.newPage();
  await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await waitForProducts(page);

  const initial = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd || 0),
      loadMs: Math.round(nav?.loadEventEnd || 0),
      resultText: document.body.innerText.match(/Showing[^\n]+/)?.[0] || '',
    };
  });
  const sidebar = await page.locator('aside').first().evaluate((el) => ({
    visible: !!el.offsetParent,
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    sections: el.querySelectorAll('[data-state]').length,
  }));
  await shot(page, 'desktop-products');

  const sizeM = page.locator('aside button').filter({ hasText: /^M/ });
  await measureAction(page, 'Desktop: toggle size M', async () => {
    await sizeM.first().click();
    await page.waitForTimeout(1200);
    await page.waitForLoadState('networkidle').catch(() => {});
  }, 'desktop-size-active');

  const colorBlack = page.locator('aside button').filter({ hasText: /Black/i }).first();
  await measureAction(page, 'Desktop: toggle colour Black', async () => {
    await colorBlack.click();
    await page.waitForTimeout(1200);
    await page.waitForLoadState('networkidle').catch(() => {});
  }, 'desktop-color-active');

  const under500 = page.locator('aside button').filter({ hasText: /Under/ }).first();
  await measureAction(page, 'Desktop: price preset Under â‚¹500', async () => {
    await under500.click();
    await page.waitForTimeout(1200);
    await page.waitForLoadState('networkidle').catch(() => {});
  }, 'desktop-empty-state');

  const clear = page.getByRole('button', { name: /Clear All|Reset All/i }).first();
  await measureAction(page, 'Desktop: clear all filters', async () => {
    await clear.click();
    await page.waitForTimeout(1200);
    await page.waitForLoadState('networkidle').catch(() => {});
  }, 'desktop-cleared');

  await context.close();
  return { initial, sidebar };
}

async function desktopCategory(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
  const page = await context.newPage();
  const t0 = now();
  await page.goto(`${BASE}/categories/t-shirts`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.getByText(/products in this category|Showing 1 to/i).first().waitFor({ state: 'visible', timeout: 30_000 });
  const initialMs = now() - t0;

  const sizeL = page.locator('aside button').filter({ hasText: /^L/ }).first();
  await measureAction(page, 'Category: toggle size L', async () => {
    await sizeL.click();
    await page.waitForTimeout(1200);
    await page.waitForLoadState('networkidle').catch(() => {});
  }, 'category-size-active');

  await shot(page, 'category-desktop');
  await context.close();
  return { initialMs };
}

async function mobileProducts(browser) {
  const context = await browser.newContext({ viewport: { width: 393, height: 812 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
  const page = await context.newPage();
  await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await waitForProducts(page);
  await shot(page, 'mobile-products');

  const t0 = now();
  await page.getByRole('button', { name: /^Filter/i }).first().click();
  await page.getByText('Mentoos Filters').waitFor({ state: 'visible', timeout: 10_000 });
  const openMs = now() - t0;
  await shot(page, 'mobile-filter-drawer');

  const closeName = await page.locator('div.fixed.inset-0 button').filter({ has: page.locator('svg') }).first().getAttribute('aria-label').catch(() => null);
  const closeBtn = page.locator('div.fixed.inset-0 button').filter({ has: page.locator('svg') }).first();
  const closeBox = await closeBtn.boundingBox().catch(() => null);

  const sizeL = page.locator('div.fixed.inset-0 button').filter({ hasText: /^L/ }).first();
  await measureAction(page, 'Mobile: toggle size L in drawer', async () => {
    await sizeL.click();
    await page.waitForTimeout(1200);
    await page.waitForTimeout(600);
  }, 'mobile-filter-active');

  const drawerStillOpen = await page.getByText('Mentoos Filters').isVisible().catch(() => false);
  const applyText = await page.getByRole('button', { name: /View/ }).innerText().catch(() => '');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const escapeClosed = !(await page.getByText('Mentoos Filters').isVisible().catch(() => false));

  // Re-open and close via the Apply button to capture the intended flow.
  if (!(await page.getByText('Mentoos Filters').isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /^Filter/i }).first().click();
    await page.getByText('Mentoos Filters').waitFor({ state: 'visible', timeout: 10_000 });
  }
  const tApply = now();
  await page.getByRole('button', { name: /View/ }).click();
  await page.waitForTimeout(700);
  const applyMs = now() - tApply;
  await shot(page, 'mobile-filter-applied');

  await context.close();
  return {
    openMs,
    drawerStillOpenAfterToggle: drawerStillOpen,
    applyButtonText: applyText.trim(),
    escapeClosed,
    closeButtonAriaLabel: closeName,
    closeButtonSize: closeBox ? { width: Math.round(closeBox.width), height: Math.round(closeBox.height) } : null,
    applyToClosedMs: applyMs,
  };
}

async function desktopSearch(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
  const page = await context.newPage();
  const t0 = now();
  await page.goto(`${BASE}/search?q=shirt`, { waitUntil: 'domcontentloaded' });
  await dismissCookies(page);
  await page.getByText(/Found \d+ results/).first().waitFor({ state: 'visible', timeout: 30_000 });
  const initialMs = now() - t0;
  await shot(page, 'search-desktop');
  await context.close();
  return { initialMs };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const summary = {};
  summary.desktopProducts = await desktopProducts(browser);
  summary.desktopCategory = await desktopCategory(browser);
  summary.mobileProducts = await mobileProducts(browser);
  summary.desktopSearch = await desktopSearch(browser);
  await browser.close();

  const output = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    viewport: { desktop: '1440x1000', mobile: '393x812' },
    summary,
    metrics,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'filter-audit.json'), JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});


