const { chromium } = require('@playwright/test');
const path = require('path');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--disable-web-security'] });
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 1000 },
    storageState: path.resolve(__dirname, '../.auth/customer.json'),
  });
  await ctx.addInitScript(() => localStorage.setItem('cookie-consent-accepted', 'true'));
  await ctx.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__shifts.push({
          value: e.value,
          startTime: e.startTime,
          sources: (e.sources || []).map((s) => ({
            tag: s.node?.tagName,
            cls: s.node?.className,
            text: (s.node?.textContent || '').slice(0, 80),
            prev: s.previousRect,
            current: s.currentRect,
          })),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3002/checkout/express?product=6acf3b31e5192c6bafa49ed8&qty=1&size=L&color=Grey', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(4000);
  const data = await p.evaluate(() => ({ shifts: window.__shifts, cls: window.__shifts.reduce((s, x) => s + x.value, 0) }));
  console.log(JSON.stringify(data, null, 2));
  await b.close();
})();
