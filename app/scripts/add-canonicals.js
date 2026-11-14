const fs = require('fs');
const pages = ['about', 'contact', 'shipping', 'returns', 'faq', 'support', 'privacy', 'terms', 'cookies', 'track-order'];
for (const slug of pages) {
  const p = `app/(store)/${slug}/page.tsx`;
  let s = fs.readFileSync(p, 'utf8');
  if (s.includes('alternates:')) continue;
  s = s.replace(/(\n\s*description:\s*'[^']*',\n)/, `$1  alternates: { canonical: '/${slug}' },\n`);
  fs.writeFileSync(p, s);
  console.log('updated', p);
}
