'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const TRENDING_ITEMS = [
  {
    id: 'prod-d2-tr-1',
    metric: 'VELOCITY: 3.4X REORDER',
    units: 'BATCH 04 // 500 UNITS',
    name: '240 GSM Boxy Drop-Shoulder Tee',
    price: 1399,
    category: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    spec: 'Dense ring-spun jersey · Pre-shrunk',
  },
  {
    id: 'prod-d2-tr-2',
    metric: 'VELOCITY: 4.8X REORDER',
    units: 'BATCH 02 // 350 UNITS',
    name: 'Camp-Collar Belgian Linen Shirt',
    price: 2499,
    category: 'shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    spec: '100% Normandy Flax · Slub texture',
  },
  {
    id: 'prod-d2-tr-3',
    metric: 'VELOCITY: 2.9X REORDER',
    units: 'BATCH 06 // 450 UNITS',
    name: 'Double-Pleated Tailored Gurkha',
    price: 2899,
    category: 'pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    spec: 'High-rise waist · Clean weighted fall',
  },
];

export function Demo2Trending() {
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
    <section className={`relative bg-sand/20 py-14 sm:py-16 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-1">
              <span className="w-1.5 h-1.5 bg-brand animate-pulse" />
              SYSTEM // 04 · LIVE PATRON DEMAND
            </div>
            <h2 className="font-syne text-2xl sm:text-4xl font-black uppercase text-ink tracking-tight">
              TRENDING <span className="text-brand">IN ROTATION</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 max-w-xs uppercase leading-relaxed">
            Real-time fulfillment telemetry. Highest velocity garments dispatched within 72 hours.
          </p>
        </div>

        {/* 3 Large Velocity Plates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-8">
          {TRENDING_ITEMS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="group border-2 border-ink bg-paper p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Velocity Gauge */}
                  <div className="flex items-center justify-between pb-2.5 border-b-2 border-ink font-mono text-[10px] uppercase">
                    <span className="bg-brand text-paper px-2 py-0.5 font-bold">
                      {item.metric}
                    </span>
                    <span className="text-ink/60">{item.units}</span>
                  </div>

                  {/* Garment Plate */}
                  <div className="relative aspect-[16/11] w-full bg-sand/30 overflow-hidden border-2 border-ink my-3">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover object-center filter grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  {/* Titles */}
                  <div className="space-y-1">
                    <h3 className="font-syne text-lg font-bold uppercase tracking-tight text-ink">
                      {item.name}
                    </h3>
                    <p className="font-mono text-[11px] text-ink/60 uppercase">
                      {item.spec}
                    </p>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-4 mt-6 border-t-2 border-ink flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-ink">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      className="px-4 py-2 bg-ink text-paper hover:bg-brand font-mono text-[11px] font-bold tracking-widest uppercase transition-all"
                    >
                      {isAdded ? 'LOCKED ✓' : 'ADD [L]'}
                    </button>
                    <Link
                      href={`/products?category=${item.category}`}
                      className="px-3 py-2 border border-ink hover:bg-sand/40 font-mono text-[11px] transition-colors"
                    >
                      SPEC →
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
