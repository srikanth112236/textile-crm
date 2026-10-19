'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ICategory } from '@/lib/api/types';
import { Sparkles, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface CategoryGridProps {
  categories: ICategory[];
}

const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=80`;

// Spec §5 order. Every tile links to a pre-filtered listing page.
const SPEC_ORDER: Array<{ slug: string; name: string; image: string }> = [
  { slug: 't-shirts', name: 'T-Shirts', image: IMG('photo-1521572267360-ee0c2909d518') },
  { slug: 'shirts', name: 'Shirts', image: IMG('photo-1602810318383-e386cc2a3ccf') },
  { slug: 'formal-trousers', name: 'Formal Trousers', image: IMG('photo-1479064555552-3ef4979f8908') },
  { slug: 'casual-trousers', name: 'Casual Trousers', image: IMG('photo-1624378439575-d8705ad7ae80') },
  { slug: 'joggers', name: 'Joggers', image: IMG('photo-1516257984-b1b4d707412e') },
  { slug: 'shorts', name: 'Shorts', image: IMG('photo-1591195853828-11db59a44f6b') },
  { slug: 'gym-tshirts', name: 'Gym T-Shirts', image: IMG('photo-1581009146145-b5ef050c2e1e') },
  { slug: 'gym-vests', name: 'Gym Vests', image: IMG('photo-1517838277536-f5f99be501cd') },
  { slug: 'sweatshirts', name: 'Sweatshirts', image: IMG('photo-1556821840-3a63f95609a7') },
  { slug: 'jackets', name: 'Jackets', image: IMG('photo-1551028719-00167b16eac5') },
  { slug: 'kurta', name: 'Kurta', image: IMG('photo-1617137968427-85924c800a22') },
  { slug: 'kurta-pajama', name: 'Kurta Pajama', image: IMG('photo-1507679799987-c73779587ccf') },
  { slug: 'nehru-jackets', name: 'Nehru Jackets', image: IMG('photo-1594938298603-c8148c4dae35') },
  { slug: 'boxers', name: 'Boxers', image: IMG('photo-1441986300917-64674bd600d8') },
];

const CATEGORY_MAP: Record<string, { name: string; image: string }> = Object.fromEntries(
  SPEC_ORDER.map((s) => [s.slug, { name: s.name, image: s.image }])
);

export function CategoryGrid({ categories }: CategoryGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Spec §5 order first; any backend categories outside the spec (umbrellas
  // like Trousers / Activewear / Ethnic Wear) append after, so admin-added
  // categories never disappear from the rail.
  const bySlug = new Map((categories || []).map((c: any) => [c.slug, c]));
  const displayList = [
    ...SPEC_ORDER.map((spec, i) => {
      const live = bySlug.get(spec.slug) as any;
      return {
        _id: live?._id || `spec-${i}`,
        name: live?.name || spec.name,
        slug: spec.slug,
        image: live?.image && !String(live.image).includes('placeholder') ? live.image : spec.image,
      };
    }),
    ...(categories || [])
      .filter((c: any) => !SPEC_ORDER.some((s) => s.slug === c.slug))
      .map((c: any) => ({ _id: c._id, name: c.name, slug: c.slug, image: c.image })),
  ];

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Wardrobe Essentials
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            SHOP BY CATEGORY
          </h2>
        </div>

        {/* Scroll Controls & View All */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors border border-slate-200 dark:border-slate-700"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors border border-slate-200 dark:border-slate-700"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Overflow Slider Carousel */}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 overflow-x-auto scrollbar-none py-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayList.map((category: any) => {
          const categorySlug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
          const fallbackData = CATEGORY_MAP[categorySlug] || {
            name: category.name,
            image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
          };

          const imgSrc = category.image && !category.image.includes('placeholder')
            ? category.image.startsWith('/')
              ? `/api/images${category.image}`
              : category.image
            : fallbackData.image;

          return (
            <Link
              key={category._id}
              href={`/products?category=${categorySlug}`}
              className="group shrink-0 w-32 sm:w-40 flex flex-col items-center text-center space-y-2"
            >
              {/* Circular Fashion Image Thumbnail */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 group-hover:border-amber-500 group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                <Image
                  src={imgSrc}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 112px, 144px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
              </div>

              {/* Category Name Label */}
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider group-hover:text-amber-500 transition-colors">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
