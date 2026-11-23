'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const NEW_ARRIVALS = [
  {
    id: 'prod-d2-na-1',
    code: 'ART-2026-01',
    name: '260 GSM Raw Chalk Heavy Tee',
    category: 't-shirts',
    spec: 'Ring-Spun Long-Staple · Zero Shrinkage',
    price: 1399,
    status: 'IN STOCK',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d2-na-2',
    code: 'ART-2026-02',
    name: 'Camp-Collar Flax Shirt · Olive Drab',
    category: 'shirts',
    spec: '100% Belgian Flax · Natural Slub',
    price: 2499,
    status: 'LOW STOCK',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d2-na-3',
    code: 'ART-2026-03',
    name: 'Pleated Gurkha Trouser · Mineral Sand',
    category: 'pants',
    spec: 'High-Rise Extended Waistband · Heavy Drape',
    price: 2899,
    status: 'IN STOCK',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d2-na-4',
    code: 'ART-2026-04',
    name: 'Structure Waffle Knit Overshirt',
    category: 'shirts',
    spec: '320 GSM Heavy Thermal Weave · Horn Buttons',
    price: 2799,
    status: 'LIMITED RUN',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
];

export function Demo2NewArrivals() {
  const { addItem } = useCart();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  const handleQuickAdd = (id: string) => {
    addItem(id, 1, [{ name: 'Size', value: 'L' }]);
    setAddedMap((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  return (
    <section className={`relative bg-paper py-14 sm:py-16 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-1">
              <span className="w-1.5 h-1.5 bg-brand" />
              SYSTEM // 03 · FRESH PRODUCTION RUN
            </div>
            <h2 className="font-syne text-2xl sm:text-4xl font-black uppercase text-ink tracking-tight">
              NEW ARRIVALS <span className="text-brand">[OCT/NOV]</span>
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="font-mono text-xs font-bold uppercase tracking-widest text-ink hover:text-brand transition-colors flex items-center gap-2"
          >
            <span>VIEW ALL 42 NEW SPECIMENS</span>
            <span>→</span>
          </Link>
        </div>

        {/* 4-Column Technical Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mt-8">
          {NEW_ARRIVALS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="group relative border-2 border-ink bg-paper flex flex-col justify-between"
              >
                {/* Top Spec Ribbon */}
                <div className="p-3 border-b-2 border-ink flex items-center justify-between font-mono text-[10px] uppercase bg-sand/30">
                  <span className="font-bold text-ink">{item.code}</span>
                  <span className={item.status === 'LOW STOCK' ? 'text-amber-600 font-bold' : 'text-emerald-700 font-bold'}>
                    {item.status}
                  </span>
                </div>

                {/* Garment Image */}
                <div className="relative aspect-[4/5] w-full bg-sand/20 overflow-hidden border-b-2 border-ink">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-center filter grayscale contrast-[1.08] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute top-2 right-2 bg-ink text-paper font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider">
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Content & Specs */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-ink/50">
                      CATEGORY // {item.category}
                    </span>
                    <h3 className="font-syne text-base font-bold uppercase tracking-tight text-ink line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="font-mono text-[10px] text-ink/70 leading-relaxed uppercase pt-1">
                      {item.spec}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-ink/20 flex gap-2">
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      className="flex-1 py-2.5 bg-ink text-paper hover:bg-brand font-mono text-[11px] font-bold tracking-widest uppercase transition-all"
                    >
                      {isAdded ? 'ADDED ✓' : 'QUICK ADD [L]'}
                    </button>
                    <Link
                      href={`/products?category=${item.category}`}
                      className="px-3 py-2.5 border border-ink hover:bg-sand/40 font-mono text-[11px] transition-colors flex items-center justify-center"
                      title="Inspect Spec"
                    >
                      ↗
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
