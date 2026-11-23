'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

const CATEGORIES = [
  {
    slug: 't-shirts',
    num: '01',
    name: 'Oversized Tees',
    badge: '240 GSM',
    specs: 'Heavyweight Combed Cotton',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=80',
    count: '34 Styles',
  },
  {
    slug: 'shirts',
    num: '02',
    name: 'Linen Shirts',
    badge: 'Pure Flax',
    specs: '100% Normandy Weave',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    count: '28 Styles',
  },
  {
    slug: 'pants',
    num: '03',
    name: 'Tailored Trousers',
    badge: 'Pleated',
    specs: 'Gurkha Waist Architecture',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=600&q=80',
    count: '19 Styles',
  },
  {
    slug: 'pants',
    num: '04',
    name: 'Cargo Joggers',
    badge: 'Utility',
    specs: '4-Way Stretch Twill',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
    count: '22 Styles',
  },
  {
    slug: 'shirts',
    num: '05',
    name: 'Festive Kurtas',
    badge: 'Artisan',
    specs: 'Slub Textured Handloom',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80',
    count: '26 Styles',
  },
  {
    slug: 'shirts',
    num: '06',
    name: 'Resort Overshirts',
    badge: '320 GSM',
    specs: 'Textured Waffle Weave',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    count: '16 Styles',
  },
];

export function Demo1Category() {
  return (
    <section className="relative w-full border-b border-line bg-paper py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        {/* Compact Chapter Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-line">
          <div>
            <div className="flex items-center gap-2 mb-1.5 font-mono text-[10px] tracking-widest text-ink-muted uppercase">
              <span className="font-bold text-brand">Chapter 02</span>
              <span>/</span>
              <span>Taxonomy Index</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-ink font-light tracking-tight">
              Curated <span className="italic font-normal">Departments</span>
            </h2>
          </div>
          <p className="max-w-xs text-xs text-ink-muted font-mono leading-relaxed">
            Six foundational menswear silhouettes sorted by fabric mass and architectural cut.
          </p>
        </div>

        {/* Compact 6-Card Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 mt-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.num}
              href={`/products?category=${cat.slug}`}
              className="group relative flex flex-col justify-between border border-line bg-sand/20 hover:border-ink transition-all duration-300"
            >
              {/* Top Index Strip */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-line/60 font-mono text-[9px] text-ink-muted">
                <span>{cat.num}</span>
                <span className="text-brand font-bold uppercase">{cat.badge}</span>
              </div>

              {/* Compact Image */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand/30">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover object-center filter grayscale contrast-[1.03] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              </div>

              {/* Content */}
              <div className="p-3 border-t border-line/60">
                <h3 className="font-serif text-sm font-normal text-ink group-hover:text-brand transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="font-mono text-[9px] text-ink-muted mt-0.5 line-clamp-1">
                  {cat.specs}
                </p>
                <div className="mt-2 pt-1.5 border-t border-line/40 flex items-center justify-between font-mono text-[9px] text-ink/70">
                  <span>{cat.count}</span>
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
