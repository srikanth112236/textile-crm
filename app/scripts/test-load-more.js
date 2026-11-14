const { chromium } = require('@playwright/test');
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 393, height: 812 }, isMobile: true, hasTouch: true });
  await p.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
  await p.goto('http://localhost:3001/products', { waitUntil: 'domcontentloaded' });
  await p.getByText(/Showing 1 to 20 of/i).waitFor();
  const before = await p.locator('a[href^="/products/"]').count();
  const btn = p.getByRole('button', { name: /Load more products/i });
  console.log('button visible', await btn.isVisible().catch(() => false));
  await btn.click();
  await p.waitForTimeout(1200);
  const after = await p.locator('a[href^="/products/"]').count();
  console.log({ before, after, url: p.url() });
  await b.close();
})();
