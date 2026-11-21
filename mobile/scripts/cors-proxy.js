/**
 * Dev-only CORS proxy for the browser preview of the mobile app.
 *
 * The production API lives on Render and only allow-lists the deployed web
 * storefront, so a browser on http://localhost:8081 receives no
 * Access-Control-Allow-Origin header and every fetch fails as "offline".
 * React Native itself sends no Origin header, so this proxy is web-only.
 *
 *   npm run proxy        # foreground, port 5050
 *   npm run dev:web      # proxy + expo web together
 *
 * Response bodies are decompressed here and sent as identity encoding, so the
 * browser always gets plain JSON regardless of what the upstream negotiates.
 */
const http = require('http');
const https = require('https');
const zlib = require('zlib');

const TARGET = (process.env.MENTOOS_API_TARGET || 'https://textile-crm-backend.onrender.com').replace(/\/+$/, '');
const PORT = Number(process.env.MENTOOS_PROXY_PORT || 5050);

function decode(upstream, encoding) {
  switch (encoding) {
    case 'gzip':
    case 'x-gzip':
      return upstream.pipe(zlib.createGunzip());
    case 'deflate':
      return upstream.pipe(zlib.createInflate());
    case 'br':
      return upstream.pipe(zlib.createBrotliDecompress());
    default:
      return upstream;
  }
}

const server = http.createServer((req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
    'Access-Control-Max-Age': '600',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  const target = new URL(TARGET + req.url);

  const forwardedHeaders = {
    ...req.headers,
    host: target.hostname,
    origin: TARGET,
    referer: `${TARGET}/`,
  };
  // Never let the browser revalidate against upstream: an earlier proxy build
  // could have poisoned the HTTP cache with a mis-encoded body.
  delete forwardedHeaders['if-none-match'];
  delete forwardedHeaders['if-modified-since'];

  const upstream = https.request(
    {
      hostname: target.hostname,
      path: target.pathname + target.search,
      method: req.method,
      headers: forwardedHeaders,
    },
    (upstreamRes) => {
      const encoding = String(upstreamRes.headers['content-encoding'] || '').toLowerCase();
      const headers = { ...upstreamRes.headers, ...cors };

      // We re-stream a decoded body, so drop the original encoding metadata.
      delete headers['content-security-policy'];
      delete headers['content-encoding'];
      delete headers['content-length'];
      delete headers['transfer-encoding'];
      delete headers.etag;
      delete headers['last-modified'];
      headers['cache-control'] = 'no-store, no-cache, must-revalidate';
      headers.pragma = 'no-cache';

      res.writeHead(upstreamRes.statusCode || 502, headers);

      const stream = decode(upstreamRes, encoding);
      stream.on('error', () => res.end());
      stream.pipe(res);
    }
  );

  upstream.setTimeout(90000, () => upstream.destroy(new Error('upstream timeout')));

  upstream.on('error', (error) => {
    if (res.headersSent) {
      res.end();
      return;
    }
    res.writeHead(502, { ...cors, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: `Proxy could not reach ${TARGET}: ${error.message}` } }));
  });

  req.pipe(upstream);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[cors-proxy] port ${PORT} is already in use — is another proxy running?`);
    process.exit(1);
  }
  throw error;
});

server.listen(PORT, () => {
  console.log(`[cors-proxy] http://localhost:${PORT}  ->  ${TARGET}`);
  console.log('[cors-proxy] leave this running while you preview in a browser');
});
