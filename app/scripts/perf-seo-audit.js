/* Performance (Core Web Vitals) + SEO audit for the Mentoos storefront. */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'reports', 'perf-seo');
const OUT = path.join(OUT_DIR, 'perf-seo.json');
fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'http://localhost:3001';
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

async function newPage(browser, opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 1000 },
    storageState: opts.storageState,
    isMobile: opts.isMobile || false,
    hasTouch: opts.hasTouch || false,
  });
  await context.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
  await context.addInitScript(perfScript);
  const page = await context.newPage();
  return { context, page };
}

async function measure(browser, name, url, opts = {}) {
  const { context, page } = await newPage(browser, opts);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const t0 = Date.now();
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2500);
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const resources = performance.getEntriesByType('resource');
    const sum = (type) =>
      resources
        .filter((r) => r.initiatorType === type)
        .reduce((s, r) => s + (r.transferSize || 0), 0);
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
      viewportMeta: !!document.querySelector('meta[name="viewport"]'),
    };
  });
  const result = {
    name,
    url,
    viewport: opts.viewport || { width: 1440, height: 1000 },
    status: response?.status() || 0,
    wallMs: Date.now() - t0,
    ...metrics,
    pageErrors: errors,
  };
  await context.close();
  return result;
}

async function seoAudit(browser) {
  const paths = [
    ['/', 'Home'],
    ['/products', 'Product listing'],
    [`/products/${PRODUCT_ID}`, 'Product detail'],
    ['/categories/t-shirts', 'Category page'],
    ['/about', 'About'],
    ['/contact', 'Contact'],
    ['/shipping', 'Shipping'],
    ['/returns', 'Returns'],
    ['/faq', 'FAQ'],
    ['/support', 'Support'],
    ['/privacy', 'Privacy'],
    ['/terms', 'Terms'],
    ['/cookies', 'Cookies'],
    ['/track-order', 'Track order'],
    ['/search?q=shirt', 'Search results'],
    ['/login', 'Login'],
    ['/register', 'Register'],
  ];

  const { context, page } = await newPage(browser, {});
  const rows = [];

  for (const [path, label] of paths) {
    const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(900);
    const meta = await page.evaluate(() => {
      const get = (name) =>
        document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ||
        document.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ||
        '';
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
      const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((s) => {
          try {
            const data = JSON.parse(s.textContent || '{}');
            return Array.isArray(data) ? data.map((d) => d['@type']) : [data['@type']];
          } catch {
            return [];
          }
        })
        .flat();
      const imgs = [...document.querySelectorAll('img')];
      const links = [...document.querySelectorAll('a[href^="/"]')];
      return {
        title: document.title,
        titleLength: document.title.length,
        description: get('description'),
        descriptionLength: get('description').length,
        canonical,
        robots: get('robots'),
        ogTitle: get('og:title'),
        ogDescription: get('og:description'),
        ogImage: get('og:image'),
        h1Count: document.querySelectorAll('h1').length,
        h1: document.querySelector('h1')?.innerText?.trim() || '',
        images: imgs.length,
        imagesMissingAlt: imgs.filter((i) => !i.hasAttribute('alt')).length,
        internalLinks: links.length,
        jsonLd: [...new Set(jsonLd)],
        lang: document.documentElement.lang,
        wordCount: (document.body.innerText || '').trim().split(/\s+/).filter(Boolean).length,
        viewportMeta: !!document.querySelector('meta[name="viewport"]'),
      };
    });
    rows.push({ path, label, status: response?.status() || 0, ...meta });
  }

  await context.close();

  const robots = await fetch(`${BASE}/robots.txt`).then(async (r) => ({ status: r.status, text: await r.text() })).catch((e) => ({ status: 0, text: String(e) }));
  const sitemap = await fetch(`${BASE}/sitemap.xml`).then(async (r) => ({ status: r.status, text: await r.text() })).catch((e) => ({ status: 0, text: String(e) }));
  const sitemapLocs = [...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

  return {
    rows,
    robots: { status: robots.status, hasSitemap: /Sitemap:/i.test(robots.text), text: robots.text.slice(0, 800) },
    sitemap: { status: sitemap.status, urlCount: sitemapLocs.length, sample: sitemapLocs.slice(0, 10) },
  };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });

  const performance = [];
  performance.push(await measure(browser, 'Home (desktop)', `${BASE}/`));
  performance.push(await measure(browser, 'Product listing (desktop)', `${BASE}/products`));
  performance.push(await measure(browser, 'Product detail (desktop)', `${BASE}/products/${PRODUCT_ID}`));
  performance.push(await measure(browser, 'Search results (desktop)', `${BASE}/search?q=shirt`));
  performance.push(await measure(browser, 'Cart (desktop)', `${BASE}/cart`));
  performance.push(await measure(browser, 'Home (mobile)', `${BASE}/`, { viewport: { width: 393, height: 812 }, isMobile: true, hasTouch: true }));
  performance.push(await measure(browser, 'Product listing (mobile)', `${BASE}/products`, { viewport: { width: 393, height: 812 }, isMobile: true, hasTouch: true }));
  performance.push(await measure(browser, 'Product detail (mobile)', `${BASE}/products/${PRODUCT_ID}`, { viewport: { width: 393, height: 812 }, isMobile: true, hasTouch: true }));

  const customerState = path.join(ROOT, 'app', '.auth', 'customer.json');
  const adminState = path.join(ROOT, 'app', '.auth', 'admin.json');
  if (fs.existsSync(customerState)) {
    performance.push(await measure(browser, 'Customer dashboard', `${BASE}/user/dashboard`, { storageState: customerState }));
    performance.push(await measure(browser, 'Express checkout', `${BASE}/checkout/express?product=${PRODUCT_ID}&qty=1&size=L&color=Grey`, { storageState: customerState }));
  }
  if (fs.existsSync(adminState)) {
    performance.push(await measure(browser, 'Admin dashboard', `${BASE}/admin/dashboard`, { storageState: adminState }));
    performance.push(await measure(browser, 'Admin product list', `${BASE}/admin/products`, { storageState: adminState }));
    performance.push(await measure(browser, 'Admin settings', `${BASE}/admin/settings`, { storageState: adminState }));
    performance.push(await measure(browser, 'Admin analytics', `${BASE}/admin/analytics`, { storageState: adminState }));
  }

  const seo = await seoAudit(browser);
  await browser.close();

  const output = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    browser: 'Chromium (installed Chrome)',
    performance,
    seo,
  };
  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUT}`);
  console.log(JSON.stringify(output.performance.map((p) => ({ name: p.name, lcp: p.lcpMs, cls: p.cls, load: p.loadMs, kb: p.transferKb })), null, 2));
  console.log('SEO rows', seo.rows.length, 'sitemap', seo.sitemap);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
