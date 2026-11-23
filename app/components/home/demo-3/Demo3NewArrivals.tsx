'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ArrowUpRight } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { plusJakarta, playfair } from './fonts';

const NEW_ARRIVALS = [
  {
    id: 'prod-d3-na-1',
    name: '260 GSM Raw Chalk Heavy Tee',
    category: 't-shirts',
    spec: 'Long-staple ring-spun cotton · Pre-shrunk finish',
    price: 1399,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d3-na-2',
    name: 'Camp-Collar Flax Shirt · Olive Drab',
    category: 'shirts',
    spec: '100% Belgian Flax · Natural slub texture',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d3-na-3',
    name: 'Pleated Gurkha Trouser · Mineral Sand',
    category: 'pants',
    spec: 'High-rise extended buckle · Weighted drape',
    price: 2899,
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d3-na-4',
    name: 'Textured Waffle Knit Overshirt',
    category: 'shirts',
    spec: '320 GSM structural weave · Hand-turned horn buttons',
    price: 2799,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
];

export function Demo3NewArrivals() {
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
    <section className={`relative bg-[#FAF9F6] text-[#121214] py-14 sm:py-16 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E7E5E0]">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold block mb-1">
              Fresh Off The Needles
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#121214] tracking-tight">
              New <span className="italic font-normal text-[#78716C]">Arrivals</span>
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-xs uppercase tracking-widest text-[#78716C] hover:text-[#D97706] transition-colors flex items-center gap-2 font-mono font-bold"
          >
            <span>View Full Studio Release</span>
            <span>→</span>
          </Link>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mt-8">
          {NEW_ARRIVALS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="group rounded-2xl overflow-hidden bg-[#F5F3EE] border border-[#E7E5E0] hover:border-[#D97706]/60 transition-all duration-300 flex flex-col justify-between shadow-2xs hover:shadow-sm"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBE7DF]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-700 ease-out"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full font-serif italic text-[#121214] text-xs font-semibold shadow-xs">
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between bg-[#F5F3EE]">
                  <div>
                    <span className="font-mono text-[9px] tracking-widest uppercase text-[#D97706] font-bold block mb-1">
                      {item.category}
                    </span>
                    <h3 className="font-serif text-lg font-normal text-[#121214] group-hover:text-[#D97706] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#78716C] font-sans mt-1 line-clamp-2">
                      {item.spec}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E0DCD4] flex gap-2">
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      className="flex-1 py-2.5 rounded-full bg-[#18181B] hover:bg-[#D97706] text-[#FAF9F6] text-xs font-mono tracking-widest uppercase font-bold transition-all"
                    >
                      {isAdded ? 'Added ✓' : 'Quick Add'}
                    </button>
                    <Link
                      href={`/products?category=${item.category}`}
                      className="w-10 h-10 rounded-full border border-[#D6D3D1] hover:border-[#D97706] text-[#121214] text-xs flex items-center justify-center transition-colors"
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
