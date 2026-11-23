'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { bebasNeue, dmSans } from './fonts';

const TRENDING_ITEMS = [
  {
    id: 'prod-d4-tr-1',
    velocity: '3.4X REORDER VELOCITY',
    name: '240 GSM Boxy Heavyweight Tee',
    price: 1399,
    category: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    spec: 'Dense ring-spun jersey · Pre-shrunk finish',
  },
  {
    id: 'prod-d4-tr-2',
    velocity: '4.8X REORDER VELOCITY',
    name: 'Camp-Collar Belgian Flax Shirt',
    price: 2499,
    category: 'shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    spec: '100% Normandy Flax · Natural slub drape',
  },
  {
    id: 'prod-d4-tr-3',
    velocity: '2.9X REORDER VELOCITY',
    name: 'Double-Pleated Tailored Gurkha',
    price: 2899,
    category: 'pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    spec: 'High-rise waist · Clean weighted fall',
  },
];

export function Demo4Trending() {
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
    <section className={`relative bg-sand/20 py-14 sm:py-16 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              SPEED & REORDER INDEX
            </span>
            <h2 className="font-bebas text-3xl sm:text-5xl text-ink uppercase tracking-tight">
              TRENDING <span className="text-brand">IN ROTATION</span>
            </h2>
          </div>
          <p className="font-sans text-xs text-ink/70 max-w-xs font-medium leading-relaxed uppercase">
            The highest velocity pieces moving across our dispatch hubs right now.
          </p>
        </div>

        {/* 3 Large Plates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-8">
          {TRENDING_ITEMS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="group border-2 border-ink bg-paper p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b-2 border-ink font-mono text-[10px] uppercase font-bold">
                    <span className="bg-brand text-paper px-2 py-0.5">{item.velocity}</span>
                    <span className="text-ink/60">RAPID RUN</span>
                  </div>

                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-sand/30 border-2 border-ink my-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover object-center filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  <h3 className="font-bebas text-2xl uppercase tracking-wide text-ink">
                    {item.name}
                  </h3>
                  <p className="font-mono text-xs text-ink/60 uppercase mt-1">
                    {item.spec}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t-2 border-ink flex items-center justify-between">
                  <span className="font-bebas text-2xl text-ink">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      className="px-5 py-2.5 bg-ink text-paper hover:bg-brand font-sans text-xs font-black tracking-widest uppercase transition-all"
                    >
                      {isAdded ? 'LOCKED ✓' : 'ADD [L]'}
                    </button>
                    <Link
                      href={`/products?category=${item.category}`}
                      className="px-3 py-2.5 border border-ink hover:bg-sand/40 font-mono text-xs"
                    >
                      →
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
