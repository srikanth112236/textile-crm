'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/products/ProductCard';
import type { IProduct } from '@/lib/api/types';
import { Sparkles, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface ProductSliderProps {
  products: IProduct[];
  title: string;
  subtitle?: string;
}

export function ProductSlider({ products, title, subtitle }: ProductSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Top Rated & Most Popular
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Product Cards Slider */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-5 overflow-x-auto scrollbar-none py-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product._id} className="shrink-0 w-64 sm:w-72">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
