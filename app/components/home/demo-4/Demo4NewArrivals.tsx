'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { bebasNeue, dmSans } from './fonts';

const NEW_ARRIVALS = [
  {
    id: 'prod-d4-na-1',
    name: '260 GSM Raw Chalk Heavy Tee',
    category: 't-shirts',
    spec: 'Ring-Spun Long-Staple · Zero Shrinkage',
    price: 1399,
    status: 'IN STOCK',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d4-na-2',
    name: 'Camp-Collar Flax Shirt · Olive Drab',
    category: 'shirts',
    spec: '100% Belgian Flax · Natural Slub',
    price: 2499,
    status: 'LOW STOCK',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d4-na-3',
    name: 'Pleated Gurkha Trouser · Mineral Sand',
    category: 'pants',
    spec: 'High-Rise Extended Waistband · Heavy Drape',
    price: 2899,
    status: 'IN STOCK',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d4-na-4',
    name: 'Structure Waffle Knit Overshirt',
    category: 'shirts',
    spec: '320 GSM Heavy Thermal Weave · Horn Buttons',
    price: 2799,
    status: 'LIMITED RUN',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
];

export function Demo4NewArrivals() {
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
    <section className={`relative bg-paper py-14 sm:py-16 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              CURRENT RUNWAY RELEASES
            </span>
            <h2 className="font-bebas text-3xl sm:text-5xl text-ink uppercase tracking-tight">
              NEW <span className="text-brand">ARRIVALS</span>
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="font-sans text-xs font-black uppercase tracking-wider text-ink hover:text-brand transition-colors flex items-center gap-2"
          >
            <span>VIEW COMPLETE RUNWAY RELEASES</span>
            <span>→</span>
          </Link>
        </div>

        {/* 4 Items Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mt-8">
          {NEW_ARRIVALS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="group border-2 border-ink bg-paper flex flex-col justify-between"
              >
                <div className="p-2.5 border-b-2 border-ink flex items-center justify-between font-mono text-[9px] uppercase bg-sand/30 font-bold">
                  <span>{item.category}</span>
                  <span className={item.status === 'LOW STOCK' ? 'text-amber-600' : 'text-emerald-700'}>
                    {item.status}
                  </span>
                </div>

                <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand/20 border-b-2 border-ink">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-center filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute top-2 right-2 bg-ink text-paper font-bebas text-lg px-2.5 py-0.5 tracking-wider">
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bebas text-xl text-ink uppercase tracking-wide line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="font-mono text-[10px] text-ink/70 mt-1 uppercase line-clamp-1">
                      {item.spec}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-ink/20 flex gap-2">
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      className="flex-1 py-2.5 bg-ink text-paper hover:bg-brand font-sans text-xs font-black tracking-widest uppercase transition-all"
                    >
                      {isAdded ? 'ADDED ✓' : 'QUICK ADD'}
                    </button>
                    <Link
                      href={`/products?category=${item.category}`}
                      className="px-3 py-2.5 border border-ink hover:bg-sand/30 font-mono text-xs flex items-center justify-center transition-colors"
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
