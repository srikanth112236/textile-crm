'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const BEST_SELLERS = [
  {
    id: 'prod-d2-bs-1',
    barcode: '890441920101',
    name: '280 GSM Heavyweight Oversized Tee',
    shade: 'Mineral Noir',
    rating: '4.98 / 5.0 (1,420 AUDITS)',
    price: 1499,
    category: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    specs: [
      '280 GSM COMBED RING-SPUN',
      'HIGH SPANDEX COLLAR RIB (NO SAGGING)',
      '+4.5CM RELAXED SHOULDER DROP',
    ],
  },
  {
    id: 'prod-d2-bs-2',
    barcode: '890441920102',
    name: 'Relaxed Pure Linen Camp Shirt',
    shade: 'Raw Ivory',
    rating: '4.95 / 5.0 (980 AUDITS)',
    price: 2499,
    category: 'shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    specs: [
      '100% NORMANDY FLAX FIBERS',
      'OPEN CAMP COLLAR PROFILE',
      'AIR-COOLED OPEN RESORT WEAVE',
    ],
  },
  {
    id: 'prod-d2-bs-3',
    barcode: '890441920103',
    name: 'Double-Pleated Tailored Gurkha',
    shade: 'Bone Sand',
    rating: '4.96 / 5.0 (1,150 AUDITS)',
    price: 2899,
    category: 'pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    specs: [
      'DEEP FRONT DOUBLE-PLEAT',
      'EXTENDED TAB WAIST ADJUSTER',
      'WEIGHTED STRAIGHT CUFF FALL',
    ],
  },
];

export function Demo2BestSellers() {
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
              SYSTEM // 05 · SIGNATURE ARCHIVES
            </div>
            <h2 className="font-syne text-2xl sm:text-4xl font-black uppercase text-ink tracking-tight">
              PERMANENT <span className="text-brand">FOUNDATIONS</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 max-w-xs uppercase leading-relaxed">
            The core wardrobe architecture that will never be discontinued. Reordered continually by 80,000+ patrons.
          </p>
        </div>

        {/* 3 Heavyweight Cassettes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-8">
          {BEST_SELLERS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="border-2 border-ink bg-paper flex flex-col justify-between"
              >
                {/* Header Strip with Barcode */}
                <div className="p-3 border-b-2 border-ink flex items-center justify-between font-mono text-[10px] uppercase bg-sand/30">
                  <span className="font-bold text-ink">BC: {item.barcode}</span>
                  <span className="text-brand font-bold">{item.rating}</span>
                </div>

                {/* Specimen Visual */}
                <div className="relative aspect-[3/4] w-full bg-sand/20 overflow-hidden border-b-2 border-ink group">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-center filter grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 bg-ink text-paper font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider">
                    {item.shade}
                  </div>
                </div>

                {/* Specs Matrix */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-syne text-xl font-black uppercase tracking-tight text-ink">
                      {item.name}
                    </h3>

                    {/* Bullet Specs */}
                    <div className="mt-4 space-y-2 border-t border-ink/20 pt-3">
                      {item.specs.map((spec, i) => (
                        <div key={i} className="flex items-center gap-2 font-mono text-[10px] text-ink/70 uppercase">
                          <span className="w-1.5 h-1.5 bg-ink" />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-6 mt-6 border-t-2 border-ink flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[9px] uppercase text-ink/50 block">SPEC PRICE</span>
                      <span className="font-mono text-xl font-bold text-ink">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickAdd(item.id)}
                        className="px-5 py-2.5 bg-ink text-paper hover:bg-brand font-mono text-xs font-bold tracking-widest uppercase transition-all"
                      >
                        {isAdded ? 'LOCKED ✓' : 'ACQUIRE [L]'}
                      </button>
                      <Link
                        href={`/products?category=${item.category}`}
                        className="px-3 py-2.5 border border-ink hover:bg-sand/30 font-mono text-xs transition-colors"
                      >
                        SPEC →
                      </Link>
                    </div>
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
