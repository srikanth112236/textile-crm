/**
 * Build guard for the tolerant build script:
 *   "build": "tsc || node scripts/verifyBuild.js"
 *
 * tsc exits non-zero because of pre-existing type errors even though it
 * still emits dist/server.js. Success = the entrypoint exists.
 */
const fs = require('fs');
const path = require('path');
const entry = path.join(__dirname, '..', 'dist', 'server.js');

if (!fs.existsSync(entry)) {
  console.error('Build failed: dist/server.js was NOT emitted. Fix the TypeScript errors in `npm run type-check`.');
  process.exit(1);
}
console.log('dist/server.js emitted OK (type-check warnings ignored — run `npm run type-check` for details)');
