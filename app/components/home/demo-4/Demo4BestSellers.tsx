'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { bebasNeue, dmSans } from './fonts';

const BEST_SELLERS = [
  {
    id: 'prod-d4-bs-1',
    name: '280 GSM Heavyweight Oversized Tee',
    shade: 'Mineral Noir',
    rating: '4.98 / 5.0 (1,420 RUNS)',
    price: 1499,
    category: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    spec: '24s Combed Ring-Spun Cotton · High-Spandex Collar · Zero Cling',
  },
  {
    id: 'prod-d4-bs-2',
    name: 'Relaxed Pure Linen Camp Shirt',
    shade: 'Raw Ivory',
    rating: '4.95 / 5.0 (980 RUNS)',
    price: 2499,
    category: 'shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    spec: '100% Normandy Flax Linen · Open Camp Collar · Pure Airflow',
  },
  {
    id: 'prod-d4-bs-3',
    name: 'Double-Pleated Tailored Gurkha',
    shade: 'Bone Sand',
    rating: '4.96 / 5.0 (1,150 RUNS)',
    price: 2899,
    category: 'pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    spec: 'High-Rise Extended Waist Tab · Deep Front Double Pleats',
  },
];

export function Demo4BestSellers() {
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
              ALL-TIME CORE ARCHIVES
            </span>
            <h2 className="font-bebas text-3xl sm:text-5xl text-ink uppercase tracking-tight">
              PERMANENT <span className="text-brand">FOUNDATIONS</span>
            </h2>
          </div>
          <p className="font-sans text-xs text-ink/70 max-w-xs font-medium leading-relaxed uppercase">
            The fundamental wardrobe foundation pieces reordered continually by over 80,000 patrons.
          </p>
        </div>

        {/* 3 Large Plates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-8">
          {BEST_SELLERS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="border-2 border-ink bg-paper flex flex-col justify-between"
              >
                <div className="p-3 border-b-2 border-ink flex items-center justify-between font-mono text-xs uppercase bg-sand/30 font-bold">
                  <span>{item.shade}</span>
                  <span className="text-brand">{item.rating}</span>
                </div>

                <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand/20 border-b-2 border-ink group">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-center filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bebas text-3xl uppercase tracking-wide text-ink">
                      {item.name}
                    </h3>
                    <p className="font-mono text-xs text-ink/70 mt-2 uppercase leading-relaxed">
                      {item.spec}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t-2 border-ink flex items-center justify-between">
                    <span className="font-bebas text-3xl text-ink">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickAdd(item.id)}
                        className="px-6 py-2.5 bg-brand hover:bg-ink text-paper font-sans text-xs font-black tracking-widest uppercase transition-all shadow-md"
                      >
                        {isAdded ? 'LOCKED ✓' : 'ACQUIRE [L]'}
                      </button>
                      <Link
                        href={`/products?category=${item.category}`}
                        className="px-3.5 py-2.5 border border-ink hover:bg-sand/30 font-mono text-xs"
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
