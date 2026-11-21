/**
 * Serves the exported web build (dist-web) on :8090 with SPA fallback.
 * Production-mode screenshots come from here: no Metro dev overlay, which
 * otherwise paints a dev-menu badge over the tab bar.
 *
 *   npm run build:web && npm run serve:web
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../dist-web');
const port = Number(process.env.MENTOOS_EXPORT_PORT || 8090);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

if (!fs.existsSync(root)) {
  console.error(`[serve-export] ${root} is missing — run "npm run build:web" first.`);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const candidates = [
    path.join(root, urlPath),
    path.join(root, `${urlPath}.html`),
    path.join(root, urlPath, 'index.html'),
  ];

  const file = candidates.find((candidate) => {
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  });

  const target = file ?? path.join(root, 'index.html');
  const ext = path.extname(target).toLowerCase();

  res.writeHead(200, {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  fs.createReadStream(target).pipe(res);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`[serve-export] port ${port} already serving — reusing it.`);
    process.exit(0);
  }
  throw error;
});

server.listen(port, () => console.log(`[serve-export] http://localhost:${port}  ->  ${root}`));
