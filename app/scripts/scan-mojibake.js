const fs = require('fs');
const path = require('path');
function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git' || e.name === 'reports') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|css|md|json)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = walk('.');
const hits = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const n = (s.match(/\uFFFD|â‚|â€™|â€“|â€”|â€œ|â€‌|â€‹/g) || []).length;
  if (n) hits.push([f, n]);
}
hits.sort((a, b) => b[1] - a[1]);
console.log('files', hits.length, 'total', hits.reduce((s, [, n]) => s + n, 0));
console.log(hits.slice(0, 40).map(([f, n]) => `${f}: ${n}`).join('\n'));
