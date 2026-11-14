const fs = require('fs');
const p = 'app/admin/orders/[id]/OrderDetailAdminClient.tsx';
const s = fs.readFileSync(p, 'utf8');
s.split(/\r?\n/).forEach((l, i) => {
  if (/[\uFFFD]|â‚|â€™|â€“|â€”|â€œ/.test(l)) console.log(`${i + 1}: ${l.trim()}`);
});
