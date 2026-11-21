'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import type { IProduct } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface ProductSectionProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  products: IProduct[];
  limit?: number;
  className?: string;
  showFilters?: boolean;
}

const FILTER_TABS = [
  { id: 'all', label: 'All Silhouettes' },
  { id: 't-shirts', label: 'Oversized Tees' },
  { id: 'shirts', label: 'Linen Shirts' },
  { id: 'joggers', label: 'Cargo Pants' },
  { id: 'ethnic-wear', label: 'Festive Kurtas' },
];

export function ProductSection({
  eyebrow,
  title,
  subtitle,
  href,
  products,
  limit = 8,
  className,
  showFilters = true,
}: ProductSectionProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    if (activeTab === 'all') return products.slice(0, limit);

    const matches = products.filter((p) => {
      const catSlug = typeof p.category === 'object' && p.category !== null ? p.category.slug : String(p.category || '');
      const name = (p.name || '').toLowerCase();
      if (activeTab === 't-shirts') return catSlug.includes('shirt') && !catSlug.includes('button') || name.includes('tee') || name.includes('polo');
      if (activeTab === 'shirts') return catSlug.includes('shirt') || name.includes('linen') || name.includes('shirt');
      if (activeTab === 'joggers') return catSlug.includes('jogger') || catSlug.includes('trouser') || name.includes('cargo') || name.includes('pant');
      if (activeTab === 'ethnic-wear') return catSlug.includes('ethnic') || name.includes('kurta');
      return true;
    });

    return matches.length > 0 ? matches.slice(0, limit) : products.slice(0, limit);
  }, [products, activeTab, limit]);

  if (!products || products.length === 0) return null;

  return (
    <section className={cn('relative', className)}>
      {/* Header with Title and Category Filter Tabs */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {eyebrow}
          </span>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            {subtitle}
          </p>
        </div>

        {/* View All Department CTA */}
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-amber-600 transition-colors shrink-0 dark:text-neutral-200"
        >
          View Full Collection
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* Interactive Category Filter Pills */}
      {showFilters && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-neutral-950 text-amber-300 shadow-md dark:bg-white dark:text-neutral-950 font-black'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid of Chamfered Products */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 lg:gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
