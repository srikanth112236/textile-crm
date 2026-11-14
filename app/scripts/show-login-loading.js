const fs = require('fs');
for (const p of ['app/(auth)/login/page.tsx', 'app/(auth)/register/page.tsx']) {
  const s = fs.readFileSync(p, 'utf8');
  const m = s.match(/Loading[^<]*/);
  if (m) console.log(p, JSON.stringify(m[0]), [...m[0]].map((c) => c.codePointAt(0).toString(16)));
}
