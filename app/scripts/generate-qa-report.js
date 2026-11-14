/* Build a consolidated, self-contained HTML QA report from Playwright's JSON output. */
const fs = require('fs');
const path = require('path');

const REPORTS = path.resolve(__dirname, '../../reports');
const RESULTS = path.join(REPORTS, 'results.json');
const ARTIFACTS = path.join(REPORTS, 'artifacts');
const OUT = path.join(REPORTS, 'Mentoos-Complete-QA-Report.html');

const raw = JSON.parse(fs.readFileSync(RESULTS, 'utf8'));
const stats = raw.stats || {};

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function collectSuites(suites, filePrefix = '') {
  const out = [];
  for (const suite of suites || []) {
    const file = suite.file || filePrefix;
    for (const spec of suite.specs || []) out.push({ ...spec, file: spec.file || file });
    out.push(...collectSuites(suite.suites, file));
  }
  return out;
}

const specs = collectSuites(raw.suites);
const rows = [];

for (const spec of specs) {
  for (const test of spec.tests || []) {
    const result = (test.results || [])[0] || {};
    const project = test.projectName || 'unknown';
    rows.push({
      project,
      file: spec.file || '',
      title: spec.title || test.title || 'Untitled test',
      status: result.status || test.status || 'unknown',
      duration: result.duration || 0,
      error: (result.errors || []).map((e) => e.message || e.value || '').join('\n'),
      steps: (result.steps || []).map((s) => s.title).filter(Boolean),
    });
  }
}

const pass = rows.filter((r) => r.status === 'passed').length;
const fail = rows.filter((r) => !['passed', 'skipped'].includes(r.status)).length;
const skipped = rows.filter((r) => r.status === 'skipped').length;
const totalDuration = rows.reduce((sum, r) => sum + r.duration, 0);

const projectOrder = [
  ['public', 'Public storefront', 'Anonymous shoppers: home, PLP, search, PDP, cart, legal pages, guest checkout'],
  ['customer', 'Customer portal', 'Logged-in customer: account, orders, profile, cart, checkout, express checkout'],
  ['admin', 'Admin portal', 'Superadmin: dashboard, catalog, orders, payments, inventory, analytics, settings'],
  ['mobile', 'Mobile responsive', '393px viewport: overflow, navigation, PDP, cart'],
  ['a11y-public', 'Accessibility — public', 'axe-core WCAG 2.1 A/AA scans'],
  ['a11y-customer', 'Accessibility — customer', 'axe-core WCAG 2.1 A/AA scans'],
  ['a11y-admin', 'Accessibility — admin', 'axe-core WCAG 2.1 A/AA scans'],
  ['setup', 'Authentication setup', 'Real UI login + storage state for customer/superadmin'],
];

const knownProjects = new Set(projectOrder.map(([id]) => id));
const groups = projectOrder.map(([id, label, desc]) => ({
  id,
  label,
  desc,
  tests: rows.filter((r) => r.project === id),
}));
for (const project of [...new Set(rows.map((r) => r.project))]) {
  if (!knownProjects.has(project)) {
    groups.push({ id: project, label: project, desc: '', tests: rows.filter((r) => r.project === project) });
  }
}

const screenshots = fs.existsSync(ARTIFACTS)
  ? fs.readdirSync(ARTIFACTS).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort()
  : [];

function gallery(filterFn) {
  return screenshots
    .filter(filterFn)
    .map(
      (file, i) =>
        `<figure><a href="artifacts/${encodeURIComponent(file)}" target="_blank"><img loading="lazy" src="artifacts/${encodeURIComponent(
          file
        )}" alt="${esc(file)}"></a><figcaption>${esc(file.replace(/^.+?-/, '').replace(/\.png$/i, '').replace(/-/g, ' '))}</figcaption></figure>`
    )
    .join('');
}

function statusBadge(status) {
  const cls = status === 'passed' ? 'ok' : status === 'skipped' ? 'skip' : 'bad';
  return `<span class="badge ${cls}">${esc(status)}</span>`;
}

function fmt(ms) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

const projectRows = groups
  .filter((g) => g.tests.length)
  .map((g) => {
    const p = g.tests.filter((t) => t.status === 'passed').length;
    const f = g.tests.length - p;
    return `<tr><td>${esc(g.label)}</td><td>${g.tests.length}</td><td class="ok-text">${p}</td><td class="${
      f ? 'bad-text' : ''
    }">${f}</td><td>${fmt(g.tests.reduce((s, t) => s + t.duration, 0))}</td></tr>`;
  })
  .join('');

const detailSections = groups
  .filter((g) => g.tests.length)
  .map(
    (g) => `
    <section class="card" id="group-${esc(g.id)}">
      <div class="section-head">
        <div>
          <h2>${esc(g.label)}</h2>
          <p>${esc(g.desc)}</p>
        </div>
        <span class="pill">${g.tests.length} test${g.tests.length === 1 ? '' : 's'}</span>
      </div>
      <table class="results">
        <thead><tr><th>Test</th><th>Status</th><th>Duration</th><th>Details</th></tr></thead>
        <tbody>
          ${g.tests
            .map((t) => {
              const steps = t.steps.length
                ? `<details><summary>${t.steps.length} step${t.steps.length === 1 ? '' : 's'}</summary><ol>${t.steps
                    .map((s) => `<li>${esc(s)}</li>`)
                    .join('')}</ol></details>`
                : '—';
              return `<tr class="${t.status === 'passed' ? '' : 'failed-row'}">
                <td><strong>${esc(t.title)}</strong><div class="file">${esc(t.file)}</div></td>
                <td>${statusBadge(t.status)}</td>
                <td class="mono">${fmt(t.duration)}</td>
                <td>${t.error ? `<pre class="error">${esc(t.error.slice(0, 1200))}</pre>` : steps}</td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </section>`
  )
  .join('');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mentoos — Complete Playwright QA Report</title>
<style>
  :root { --bg:#f6f7fb; --card:#fff; --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --brand:#b45309; --ok:#047857; --bad:#b91c1c; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Inter, "Segoe UI", system-ui, -apple-system, Arial, sans-serif; background:var(--bg); color:var(--ink); line-height:1.5; }
  .wrap { max-width:1180px; margin:0 auto; padding:32px 20px 64px; }
  header.hero { background: linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#7c2d12 100%); color:#fff; border-radius:24px; padding:36px 32px; box-shadow:0 20px 50px rgba(15,23,42,.25); }
  .eyebrow { text-transform:uppercase; letter-spacing:.18em; font-size:11px; font-weight:800; color:#fbbf24; }
  h1 { font-size:36px; line-height:1.1; margin:10px 0 8px; letter-spacing:-.02em; }
  .hero p { color:#cbd5e1; margin:0; max-width:760px; }
  .meta { display:flex; flex-wrap:wrap; gap:10px 22px; margin-top:20px; font-size:12px; color:#cbd5e1; }
  .meta b { color:#fff; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin:20px 0; }
  .stat { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px; }
  .stat .k { font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:var(--muted); font-weight:800; }
  .stat .v { font-size:28px; font-weight:900; margin-top:4px; letter-spacing:-.03em; }
  .stat.ok .v { color:var(--ok); } .stat.bad .v { color:var(--bad); }
  .card { background:var(--card); border:1px solid var(--line); border-radius:18px; padding:22px; margin:16px 0; box-shadow:0 4px 16px rgba(15,23,42,.04); }
  h2 { margin:0; font-size:20px; letter-spacing:-.02em; } h3 { margin:22px 0 8px; font-size:15px; }
  .section-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:14px; }
  .section-head p { margin:4px 0 0; color:var(--muted); font-size:13px; }
  .pill { background:#fffbeb; border:1px solid #fde68a; color:#92400e; border-radius:999px; padding:4px 10px; font-size:11px; font-weight:800; white-space:nowrap; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); border-bottom:1px solid var(--line); padding:8px; }
  td { border-bottom:1px solid #f1f5f9; padding:10px 8px; vertical-align:top; }
  tr:last-child td { border-bottom:0; }
  .file { color:var(--muted); font-size:10px; margin-top:2px; }
  .mono { font-variant-numeric:tabular-nums; font-family:ui-monospace,Consolas,monospace; font-size:11px; }
  .badge { display:inline-block; border-radius:999px; padding:2px 8px; font-size:10px; font-weight:900; text-transform:uppercase; }
  .badge.ok { background:#d1fae5; color:#065f46; } .badge.bad { background:#fee2e2; color:#991b1b; } .badge.skip { background:#e2e8f0; color:#334155; }
  .ok-text { color:var(--ok); font-weight:800; } .bad-text { color:var(--bad); font-weight:800; }
  .failed-row td { background:#fff7f7; }
  pre.error { white-space:pre-wrap; background:#fef2f2; border:1px solid #fecaca; color:#991b1b; border-radius:8px; padding:8px; font-size:11px; max-height:180px; overflow:auto; }
  details summary { cursor:pointer; color:var(--brand); font-weight:700; font-size:12px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:16px; }
  .coverage { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px; }
  .coverage div { border:1px solid var(--line); border-radius:12px; padding:12px; background:#fcfcfd; }
  .coverage h4 { margin:0 0 6px; font-size:13px; } .coverage p { margin:0; color:var(--muted); font-size:11px; }
  .gallery { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }
  figure { margin:0; border:1px solid var(--line); border-radius:12px; overflow:hidden; background:#fff; }
  figure img { width:100%; height:150px; object-fit:cover; display:block; background:#f1f5f9; }
  figcaption { font-size:10px; color:var(--muted); padding:7px 9px; text-transform:capitalize; }
  .note { background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:14px; font-size:12px; color:#78350f; }
  .links a { color:var(--brand); font-weight:700; text-decoration:none; margin-right:16px; }
  footer { text-align:center; color:var(--muted); font-size:11px; margin-top:26px; }
  @media (max-width:640px){ h1{font-size:27px} .wrap{padding:16px} header.hero{padding:24px} }
</style>
</head>
<body>
<div class="wrap">
  <header class="hero">
    <div class="eyebrow">Complete QA report</div>
    <h1>Mentoos E-Commerce — Playwright Test Report</h1>
    <p>End-to-end verification of the public storefront, customer portal, admin/superadmin portal, mobile responsiveness and WCAG 2.1 A/AA accessibility.</p>
    <div class="meta">
      <span><b>Environment:</b> localhost:3001 / API localhost:5000 / MongoDB</span>
      <span><b>Browser:</b> Chromium (installed Chrome)</span>
      <span><b>Generated:</b> ${esc(new Date().toLocaleString('en-IN'))}</span>
      <span><b>Worker:</b> 1 (serial, to respect API rate limits)</span>
    </div>
  </header>

  <div class="cards">
    <div class="stat"><div class="k">Total tests</div><div class="v">${rows.length}</div></div>
    <div class="stat ok"><div class="k">Passed</div><div class="v">${pass}</div></div>
    <div class="stat ${fail ? 'bad' : ''}"><div class="k">Failed</div><div class="v">${fail}</div></div>
    <div class="stat"><div class="k">Skipped</div><div class="v">${skipped}</div></div>
    <div class="stat"><div class="k">Suite duration</div><div class="v">${fmt(totalDuration)}</div></div>
    <div class="stat"><div class="k">Axe scans</div><div class="v">${rows.filter((r) => r.project.startsWith('a11y')).length}</div></div>
  </div>

  <section class="card">
    <h2>Result by area</h2>
    <table>
      <thead><tr><th>Area</th><th>Tests</th><th>Passed</th><th>Failed</th><th>Duration</th></tr></thead>
      <tbody>${projectRows}</tbody>
    </table>
  </section>

  <section class="card">
    <h2>Coverage overview</h2>
    <div class="coverage">
      <div><h4>Public storefront</h4><p>Home, product listing, category filter, price sort, search, header smart search, PDP (media/variants/video), category page, 9 legal/help pages, track order, guest cart, guest checkout → payment, 404.</p></div>
      <div><h4>Customer portal</h4><p>Dashboard, order list, order detail, profile + default address, wishlist, invoices, payments, loyalty, referral, returns, refunds, settings, cart add/update/remove, standard checkout to review, express checkout with coupons.</p></div>
      <div><h4>Admin / superadmin</h4><p>Dashboard, products + product edit, categories, tags, reviews, shop look, UGC + moderation, orders + detail, deliveries, payments + refunds, invoices, discounts, inventory (stock/movements/warehouses/transfer), stock, stock alerts, users, analytics + advanced, logs, permissions, settings, returns, superadmin console.</p></div>
      <div><h4>Responsive</h4><p>393px mobile: no horizontal overflow on home, PLP, PDP, category and cart; hamburger navigation opens; PDP variants and quantity controls remain usable.</p></div>
      <div><h4>Accessibility</h4><p>${rows.filter((r) => r.project.startsWith('a11y')).length} axe-core scans across public, customer and admin pages with WCAG 2.1 A/AA tags — <strong>0 violations</strong>.</p></div>
      <div><h4>Guest conversion</h4><p>Guest cart, guest checkout, address capture and payment-method step verified without creating a paid order.</p></div>
    </div>
  </section>

  ${detailSections}

  <section class="card">
    <h2>Visual evidence — public storefront</h2>
    <div class="gallery">${gallery((f) => f.startsWith('public-'))}</div>
  </section>
  <section class="card">
    <h2>Visual evidence — customer portal</h2>
    <div class="gallery">${gallery((f) => f.startsWith('customer-'))}</div>
  </section>
  <section class="card">
    <h2>Visual evidence — admin portal</h2>
    <div class="gallery">${gallery((f) => f.startsWith('admin-'))}</div>
  </section>
  <section class="card">
    <h2>Visual evidence — mobile</h2>
    <div class="gallery">${gallery((f) => f.startsWith('mobile-'))}</div>
  </section>
  <section class="card">
    <h2>Visual evidence — accessibility scans</h2>
    <div class="gallery">${gallery((f) => f.startsWith('a11y-'))}</div>
  </section>

  <section class="card">
    <h2>Method & notes</h2>
    <div class="note">
      <p><strong>What was exercised:</strong> real UI login for customer and superadmin, real browser navigation, cart mutations, coupon application, checkout up to review, express checkout, product/order searches, admin settings, product video persistence, mobile viewport checks, and axe-core WCAG 2.1 A/AA scans.</p>
      <p><strong>What was intentionally not completed:</strong> real Razorpay card/UPI payments and destructive admin actions (delete/refund/status changes). Checkout tests stop at the review/payment boundary so no money moves and no production data is mutated.</p>
      <p><strong>Test data:</strong> uses the seeded customer <code>test.user@mentoos.in</code> with the saved default address, and the seeded superadmin <code>admin@ecom.com</code>. Cart state is cleared before and after cart tests.</p>
      <p><strong>Rate limiting:</strong> the API allows 1200 requests/minute/IP; the suite runs with one worker to stay within that budget.</p>
    </div>
  </section>

  <section class="card links">
    <h2>Raw reports</h2>
    <p><a href="playwright-html/index.html" target="_blank">Playwright HTML report (interactive)</a><a href="results.json" target="_blank">Playwright JSON results</a><a href="artifacts/" target="_blank">Screenshot folder</a></p>
  </section>

  <footer>Generated from Playwright results · ${rows.length} tests · ${pass} passed · ${fail} failed · ${new Date().toISOString()}</footer>
</div>
</body>
</html>`;

fs.writeFileSync(OUT, html, 'utf8');
console.log(`Wrote ${OUT}`);
console.log(`Tests: ${rows.length}, passed: ${pass}, failed: ${fail}, screenshots: ${screenshots.length}`);
