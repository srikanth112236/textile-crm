/* Production-build performance audit (port 3002). */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'reports', 'perf-seo', 'prod-perf.json');
const BASE = 'http://localhost:3002';
const PRODUCT_ID = '6acf3b31e5192c6bafa49ed8';

const perfScript = `
  window.__perf = { lcp: 0, cls: 0 };
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__perf.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
`;

async function measure(browser, name, url, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 1000 },
    storageState: opts.storageState,
    isMobile: opts.isMobile || false,
    hasTouch: opts.hasTouch || false,
  });
  await context.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
  await context.addInitScript(perfScript);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.enable');
  const netInfo = new Map();
  const netBytes = { total: 0, script: 0, stylesheet: 0, image: 0, font: 0, document: 0, other: 0 };
  let netRequests = 0;
  cdp.on('Network.responseReceived', (e) => {
    netInfo.set(e.requestId, { url: e.response.url, type: e.type });
  });
  cdp.on('Network.loadingFinished', (e) => {
    const info = netInfo.get(e.requestId);
    if (!info) return;
    netRequests += 1;
    netBytes.total += e.encodedDataLength || 0;
    const t = info.type === 'Script' ? 'script' : info.type === 'Stylesheet' ? 'stylesheet' : info.type === 'Image' ? 'image' : info.type === 'Font' ? 'font' : info.type === 'Document' ? 'document' : 'other';
    netBytes[t] += e.encodedDataLength || 0;
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2500);
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const resources = performance.getEntriesByType('resource');
    const sum = (type) => resources.filter((r) => r.initiatorType === type).reduce((s, r) => s + (r.transferSize || 0), 0);
    return {
      ttfbMs: Math.round(nav.responseStart || 0),
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd || 0),
      loadMs: Math.round(nav.loadEventEnd || 0),
      lcpMs: Math.round(window.__perf?.lcp || 0),
      cls: Number((window.__perf?.cls || 0).toFixed(3)),
      requests: resources.length,
      transferKb: Math.round(resources.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
      jsKb: Math.round(sum('script') / 1024),
      cssKb: Math.round(sum('link') / 1024),
      imageKb: Math.round(sum('img') / 1024),
      title: document.title,
      h1: document.querySelector('h1')?.innerText?.trim() || '',
    };
  });
  await context.close();
  return {
    name,
    url,
    viewport: opts.viewport || { width: 1440, height: 1000 },
    status: response?.status() || 0,
    ...metrics,
    networkKb: Math.round(netBytes.total / 1024),
    networkRequests: netRequests,
    networkByTypeKb: {
      script: Math.round(netBytes.script / 1024),
      stylesheet: Math.round(netBytes.stylesheet / 1024),
      image: Math.round(netBytes.image / 1024),
      font: Math.round(netBytes.font / 1024),
      document: Math.round(netBytes.document / 1024),
      other: Math.round(netBytes.other / 1024),
    },
    pageErrors: errors,
  };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--disable-web-security'] });

  // Warm the production server / image optimizer before measuring.
  const warm = await browser.newContext();
  const warmPage = await warm.newPage();
  await warmPage.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await warmPage.waitForTimeout(1500);
  await warm.close();

  const rows = [];
  const customerState = path.join(ROOT, 'app', '.auth', 'customer.json');
  const adminState = path.join(ROOT, 'app', '.auth', 'admin.json');

  rows.push(await measure(browser, 'Home (desktop)', `${BASE}/`));
  rows.push(await measure(browser, 'Product listing (desktop)', `${BASE}/products`));
  rows.push(await measure(browser, 'Product detail (desktop)', `${BASE}/products/${PRODUCT_ID}`));
  rows.push(await measure(browser, 'Search results (desktop)', `${BASE}/search?q=shirt`));
  rows.push(await measure(browser, 'Cart (desktop)', `${BASE}/cart`));
  rows.push(await measure(browser, 'Home (mobile)', `${BASE}/`, { viewport: { width: 393, height: 812 }, isMobile: true, hasTouch: true }));
  rows.push(await measure(browser, 'Product listing (mobile)', `${BASE}/products`, { viewport: { width: 393, height: 812 }, isMobile: true, hasTouch: true }));
  rows.push(await measure(browser, 'Product detail (mobile)', `${BASE}/products/${PRODUCT_ID}`, { viewport: { width: 393, height: 812 }, isMobile: true, hasTouch: true }));
  if (fs.existsSync(customerState)) {
    rows.push(await measure(browser, 'Customer dashboard', `${BASE}/user/dashboard`, { storageState: customerState }));
    rows.push(await measure(browser, 'Express checkout', `${BASE}/checkout/express?product=${PRODUCT_ID}&qty=1&size=L&color=Grey`, { storageState: customerState }));
  }
  if (fs.existsSync(adminState)) {
    rows.push(await measure(browser, 'Admin dashboard', `${BASE}/admin/dashboard`, { storageState: adminState }));
    rows.push(await measure(browser, 'Admin product list', `${BASE}/admin/products`, { storageState: adminState }));
  }

  await browser.close();
  const output = { generatedAt: new Date().toISOString(), baseUrl: BASE, mode: 'production build', rows };
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUT}`);
  console.log(rows.map((r) => `${r.name}: LCP ${r.lcpMs}ms · CLS ${r.cls} · TTFB ${r.ttfbMs}ms · ${r.networkKb}KB (JS ${r.networkByTypeKb.script}KB)`).join('\n'));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
