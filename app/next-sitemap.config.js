/** @type {import('next-sitemap').IConfig} */
const siteUrl = process.env.SITE_URL || 'https://textile-crm-frontend.onrender.com';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com';

async function fetchJson(path) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${apiUrl}${path}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // sitemap build must never fail the deploy
  }
}

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/admin/*', '/api/*', '/login', '/register', '/user/*', '/orders/*', '/checkout', '/cart', '/wishlist'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/user/', '/orders/', '/checkout', '/cart', '/wishlist'],
      },
    ],
    additionalSitemaps: [`${siteUrl}/sitemap.xml`],
  },
  additionalPaths: async () => {
    const paths = [];
    // All active products → /products/:id
    const products = await fetchJson('/api/products?status=active&limit=1000');
    for (const p of products?.data || []) {
      paths.push({
        loc: `/products/${p._id}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: p.updatedAt || new Date().toISOString(),
      });
    }
    // All active categories → /categories/:slug
    const categories = await fetchJson('/api/categories?status=active');
    for (const c of categories?.data || []) {
      paths.push({ loc: `/categories/${c.slug}`, changefreq: 'weekly', priority: 0.7 });
    }
    return paths;
  },
};
