'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { ICategory } from '@/lib/api/types';

const CATEGORIES_DATA = [
  {
    slug: 't-shirts',
    name: 'Oversized Tees',
    badge: '240 GSM',
    count: '34 Styles',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80',
    tagline: 'Heavyweight Boxy Silhouette',
  },
  {
    slug: 'shirts',
    name: 'Linen Shirts',
    badge: 'Pure Flax',
    count: '28 Styles',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80',
    tagline: 'Breathable Resort Weave',
  },
  {
    slug: 'joggers',
    name: 'Cargo Joggers',
    badge: 'Utility',
    count: '22 Styles',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
    tagline: '6-Pocket Ergonomic Fit',
  },
  {
    slug: 'trousers',
    name: 'Tailored Trousers',
    badge: 'Pleated',
    count: '19 Styles',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=700&q=80',
    tagline: 'Sharp Proportional Taper',
  },
  {
    slug: 'ethnic-wear',
    name: 'Festive Kurtas',
    badge: 'Artisan',
    count: '26 Styles',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80',
    tagline: 'Slub Textured Mandarin',
  },
  {
    slug: 'activewear',
    name: 'Gym Activewear',
    badge: 'Quick-Dry',
    count: '16 Styles',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80',
    tagline: 'Moisture-Wicking Honeycomb',
  },
];

interface CategoryRailProps {
  categories?: ICategory[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function CategoryRail({
  title = 'SHOP BY CATEGORY',
  subtitle = 'Curated Menswear Silhouettes',
  compact = false,
}: CategoryRailProps) {
  return (
    <section aria-labelledby="shop-by-category" className={compact ? 'py-2' : 'py-4'}>
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {subtitle}
          </span>
          <h2
            id="shop-by-category"
            className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white"
          >
            {title}
          </h2>
        </div>
        <Link
          href="/products"
          className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-amber-600 transition-colors dark:text-neutral-200"
        >
          View All Departments
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Modern Compact Editorial Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
        {CATEGORIES_DATA.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-[20px] border border-neutral-200/80 bg-neutral-950 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
            }}
          >
            {/* Aspect Ratio Image Container */}
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
                loading="lazy"
              />
              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-black/20" />

              {/* Top Badge */}
              <div className="absolute left-2.5 top-2.5 flex items-center justify-between right-2.5">
                <span className="rounded-full bg-neutral-950/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-md border border-white/10">
                  {cat.badge}
                </span>
                <span className="text-[10px] text-white/70 font-medium">
                  {cat.count}
                </span>
              </div>

              {/* Bottom Card Copy */}
              <div className="absolute bottom-0 left-0 right-0 p-3 transition-transform duration-300">
                <p className="text-[10px] font-semibold text-neutral-300 uppercase tracking-wider truncate">
                  {cat.tagline}
                </p>
                <div className="mt-0.5 flex items-center justify-between">
                  <h3 className="text-sm font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    {cat.name}
                  </h3>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors group-hover:bg-amber-400 group-hover:text-neutral-950">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
