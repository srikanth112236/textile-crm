import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mentoos — Modern Men’s Fashion',
    short_name: 'Mentoos',
    description: 'Shop oversized tees, shirts, trousers, joggers and ethnic wear at Mentoos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
