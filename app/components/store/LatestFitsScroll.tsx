'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ChevronLeft, ChevronRight, ArrowRight, Flame } from 'lucide-react';

const TRENDS = [
  {
    title: 'KO-OVERSIZED TEES',
    fit: 'Boxy Drop Shoulder',
    fabric: '240 GSM Heavy Cotton',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=t-shirts&search=oversized',
  },
  {
    title: 'MANDARIN LINEN KURTAS',
    fit: 'Relaxed Short Cut',
    fabric: '100% Breathable Linen',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=ethnic-wear',
  },
  {
    title: 'TACTICAL CARGO JOGGERS',
    fit: 'Tapered Utility Fit',
    fabric: 'Stretch Twill Cotton',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=joggers',
  },
  {
    title: 'CUBAN COLLAR PRINTED',
    fit: 'Resort Casual Fit',
    fabric: 'Rayon Viscose Blend',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=shirts',
  },
  {
    title: 'PLEATED CHINO TROUSERS',
    fit: 'Smart Tapered Cut',
    fabric: 'Wrinkle-Resistant Cotton',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=600&q=80',
    link: '/products?category=trousers',
  },
];

export function LatestFitsScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            Season 2026 Drops
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            LATEST FITS & TRENDS
          </h2>
        </div>

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

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-5 overflow-x-auto scrollbar-none py-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TRENDS.map((item, idx) => (
          <Link
            key={idx}
            href={item.link}
            className="group shrink-0 w-64 h-80 relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800"
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="256px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent p-4 flex flex-col justify-end text-white">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 w-max mb-1">
                {item.fit}
              </span>
              <h3 className="text-base font-extrabold tracking-tight group-hover:text-amber-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {item.fabric}
              </p>
              <div className="mt-2 flex items-center text-[11px] font-bold text-amber-400 gap-1">
                <span>VIEW TREND</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
