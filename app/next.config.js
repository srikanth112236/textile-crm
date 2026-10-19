/** @type {import('next').NextConfig} */
const nextConfig = {
  // Smaller payloads on average Indian mobile connections (doc §32)
  compress: true,
  poweredByHeader: false,
  // Account pages consolidated under /user/* (dashboard shell). Old
  // store-layout URLs redirect permanently so bookmarks keep working.
  async redirects() {
    return [
      { source: '/profile/settings', destination: '/user/settings', permanent: true },
      { source: '/profile', destination: '/user/profile', permanent: true },
      { source: '/orders/:id/invoice', destination: '/user/orders/:id/invoice', permanent: true },
      { source: '/orders/:id', destination: '/user/orders/:id', permanent: true },
      { source: '/orders', destination: '/user/orders', permanent: true },
      { source: '/wishlist', destination: '/user/wishlist', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Serve modern formats first, keep JPEG fallback automatic
    formats: ['image/avif', 'image/webp'],
    // Allow local images
    unoptimized: false,
  },
};

module.exports = nextConfig;
