'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Sparkles } from 'lucide-react';

const STYLES = [
  {
    title: 'CASUAL STREET',
    tagline: 'Heavyweight Boxy Tees & Cargo Pants',
    description: 'Effortless daily rotation built for durable comfort.',
    link: '/products?occasion=Casual',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
    count: '42 Styles',
  },
  {
    title: 'OFFICE & FORMAL',
    tagline: 'Linen Shirts & Tailored Pleated Trousers',
    description: 'Sharp silhouette with breathable all-day ease.',
    link: '/products?occasion=Formal',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    count: '28 Styles',
  },
  {
    title: 'FESTIVE ETHNIC',
    tagline: 'Textured Slub Kurtas & Nehru Jackets',
    description: 'Modern Indian celebrations with artisan handloom weaves.',
    link: '/products?occasion=Festive',
    imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80',
    count: '31 Styles',
  },
  {
    title: 'RESORT & TRAVEL',
    tagline: 'Open Collar Cuban Polos & Lightweight Shorts',
    description: 'Pre-washed French flax linen for tropical sun.',
    link: '/products?search=linen',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    count: '19 Styles',
  },
  {
    title: 'ACTIVE PERFORMANCE',
    tagline: 'Quick-Dry Honeycomb Tees & Track Pants',
    description: 'Gym to commute mobility with anti-odor yarn.',
    link: '/products?occasion=Sports',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    count: '16 Styles',
  },
  {
    title: 'EVENING DINNER',
    tagline: 'Structured Overshirts & Tapered Chinos',
    description: 'Elevated layers with understated luxury tones.',
    link: '/products?occasion=Party',
    imageUrl: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&q=80',
    count: '24 Styles',
  },
];

export function ShopByStyle() {
  return (
    <section aria-labelledby="shop-by-style-title" className="py-4">
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Curated Occasions
          </span>
          <h2
            id="shop-by-style-title"
            className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white"
          >
            SHOP BY OCCASION & STYLE
          </h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Curated wardrobes organized by where you are headed — from weekend coffee to festival nights.
          </p>
        </div>

        <Link
          href="/products"
          className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-amber-600 transition-colors dark:text-neutral-200"
        >
          View All Occasions
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Modern 6-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {STYLES.map((style) => (
          <Link
            key={style.title}
            href={style.link}
            className="group relative aspect-[16/10] overflow-hidden rounded-[22px] border border-neutral-200/80 bg-neutral-950 p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
            }}
          >
            <Image
              src={style.imageUrl}
              alt={style.title}
              fill
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Scrim Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-black/20" />

            {/* Top Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full bg-neutral-950/70 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 backdrop-blur-md border border-white/10">
                {style.count}
              </span>
            </div>

            {/* Bottom Content */}
            <div className="relative z-10 flex flex-col justify-end mt-auto pt-8">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                {style.tagline}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
                  {style.title}
                </h3>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors group-hover:bg-amber-400 group-hover:text-neutral-950">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
