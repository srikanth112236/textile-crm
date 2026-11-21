/**
 * One command for the browser preview: starts the CORS proxy on :5050 (unless
 * one is already running) and Expo web on :8081 with EXPO_PUBLIC_WEB_PROXY_URL
 * pointing at it.
 *
 *   npm run dev:web
 */
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const root = path.resolve(__dirname, '..');
const proxyPort = Number(process.env.MENTOOS_PROXY_PORT || 5050);

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.setTimeout(600);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

async function main() {
  const alreadyRunning = await portOpen(proxyPort);
  let proxy = null;

  if (alreadyRunning) {
    console.log(`[dev:web] reusing the CORS proxy already listening on ${proxyPort}`);
  } else {
    proxy = spawn(process.execPath, [path.join(__dirname, 'cors-proxy.js')], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, MENTOOS_PROXY_PORT: String(proxyPort) },
    });
    proxy.on('error', (error) => console.error('[dev:web] proxy failed:', error.message));
  }

  const expo = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['expo', 'start', '--web', '--port', '8081', '--clear'],
    {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        EXPO_PUBLIC_WEB_PROXY_URL: `http://localhost:${proxyPort}`,
      },
    }
  );

  const shutdown = () => {
    proxy?.kill();
    expo.kill();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  expo.on('exit', (code) => {
    proxy?.kill();
    process.exit(code ?? 0);
  });
}

main();
