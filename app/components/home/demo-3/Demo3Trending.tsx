'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { plusJakarta, playfair } from './fonts';

const TRENDING_ITEMS = [
  {
    id: 'prod-d3-tr-1',
    metric: '3.4X Reorder Velocity',
    name: '240 GSM Boxy Heavyweight Tee',
    shade: 'Mineral Noir',
    price: 1399,
    category: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    spec: 'Dense ring-spun jersey · Pre-shrunk finish',
  },
  {
    id: 'prod-d3-tr-2',
    metric: '4.8X Reorder Velocity',
    name: 'Camp-Collar Belgian Flax Shirt',
    shade: 'Olive Drab',
    price: 2499,
    category: 'shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    spec: '100% Normandy Flax · Natural slub drape',
  },
  {
    id: 'prod-d3-tr-3',
    metric: '2.9X Reorder Velocity',
    name: 'Double-Pleated Tailored Gurkha',
    shade: 'Mineral Sand',
    price: 2899,
    category: 'pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    spec: 'High-rise waist · Clean weighted fall',
  },
];

export function Demo3Trending() {
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
    <section className={`relative bg-[#F5F3EE] text-[#121214] py-14 sm:py-16 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E0DCD4]">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold block mb-1">
              High Velocity
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#121214] tracking-tight">
              Trending <span className="italic font-normal text-[#78716C]">In Rotation</span>
            </h2>
          </div>
          <p className="text-xs text-[#57534E] font-sans max-w-xs leading-relaxed">
            The three garments requested most by patrons across our regional dispatch hubs.
          </p>
        </div>

        {/* 3 Plates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-8">
          {TRENDING_ITEMS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="group rounded-2xl overflow-hidden bg-[#FAF9F6] border border-[#E0DCD4] hover:border-[#D97706]/60 p-5 flex flex-col justify-between transition-all duration-300 shadow-2xs hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E7E5E0]">
                    <span className="font-mono text-[11px] text-[#D97706] font-bold uppercase tracking-wider">
                      {item.metric}
                    </span>
                    <span className="text-xs text-[#78716C] font-sans">{item.shade}</span>
                  </div>

                  <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#EBE7DF] rounded-xl my-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  <h3 className="font-serif text-xl font-normal text-[#121214] group-hover:text-[#D97706] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#78716C] font-sans mt-1">
                    {item.spec}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#E7E5E0] flex items-center justify-between">
                  <span className="font-serif italic text-2xl text-[#121214]">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      className="px-6 py-2.5 rounded-full bg-[#18181B] hover:bg-[#D97706] text-[#FAF9F6] text-xs font-mono tracking-widest uppercase font-bold transition-all shadow-sm"
                    >
                      {isAdded ? 'Added ✓' : 'Quick Add'}
                    </button>
                    <Link
                      href={`/products?category=${item.category}`}
                      className="w-10 h-10 rounded-full border border-[#D6D3D1] hover:border-[#D97706] text-[#121214] text-xs flex items-center justify-center transition-colors"
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
