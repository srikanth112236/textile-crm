#!/usr/bin/env node
/**
 * Production-build validation that is safe to run while `next dev` is up.
 *
 * `next build` normally writes to .next — the same directory the dev server
 * reads from. Running a validation build therefore deletes routes-manifest.json
 * and friends out from under the dev server, producing ENOENT 500s until it is
 * restarted. next.config.js honours NEXT_DIST_DIR, so this script builds into
 * `.next-verify` instead and leaves the dev server untouched.
 *
 * Usage: npm run build:verify
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const env = { ...process.env, NEXT_DIST_DIR: '.next-verify' };
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// `next build` rewrites tsconfig.json (reformats it and appends the build's
// types dir). Snapshot it so validation leaves the working tree clean.
const tsconfigPath = path.resolve(__dirname, '..', 'tsconfig.json');
const tsconfigBefore = fs.existsSync(tsconfigPath)
  ? fs.readFileSync(tsconfigPath)
  : null;

const result = spawnSync(npm, ['run', 'build'], {
  stdio: 'inherit',
  env,
  cwd: path.resolve(__dirname, '..'),
  shell: process.platform === 'win32',
});

if (tsconfigBefore) fs.writeFileSync(tsconfigPath, tsconfigBefore);

if (result.error) {
  console.error('[verify-build] failed to start build:', result.error);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
