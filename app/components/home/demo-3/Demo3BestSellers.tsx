'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { plusJakarta, playfair } from './fonts';

const BEST_SELLERS = [
  {
    id: 'prod-d3-bs-1',
    name: '280 GSM Heavyweight Oversized Tee',
    shade: 'Mineral Noir',
    rating: '★ 4.98 · 1,420 Patrons',
    price: 1499,
    category: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    details: '24s combed compact cotton · High spandex neckband · Zero torso cling',
  },
  {
    id: 'prod-d3-bs-2',
    name: 'Relaxed Pure Linen Camp Shirt',
    shade: 'Raw Ivory',
    rating: '★ 4.95 · 980 Patrons',
    price: 2499,
    category: 'shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    details: '100% Normandy flax linen · Hand-finished camp collar · Airy breathability',
  },
  {
    id: 'prod-d3-bs-3',
    name: 'Double-Pleated Tailored Gurkha',
    shade: 'Bone Sand',
    rating: '★ 4.96 · 1,150 Patrons',
    price: 2899,
    category: 'pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    details: 'High-rise extended buckle waistband · Architectural pleat depth',
  },
];

export function Demo3BestSellers() {
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
              Signature Pillars
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#121214] tracking-tight">
              Permanent <span className="italic font-normal text-[#78716C]">Classics</span>
            </h2>
          </div>
          <p className="text-xs text-[#57534E] font-sans max-w-xs leading-relaxed">
            The fundamental wardrobe pieces chosen and continually reordered by over 80,000 discerning patrons.
          </p>
        </div>

        {/* 3 Signature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-8">
          {BEST_SELLERS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="group rounded-2xl overflow-hidden bg-[#F5F3EE] border border-[#E7E5E0] hover:border-[#D97706]/60 p-5 flex flex-col justify-between transition-all duration-300 shadow-2xs hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E0DCD4]">
                    <span className="text-xs text-[#D97706] font-mono font-bold">{item.rating}</span>
                    <span className="text-xs text-[#78716C] font-sans">{item.shade}</span>
                  </div>

                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBE7DF] rounded-xl my-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-700 ease-out"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>

                  <h3 className="font-serif text-2xl font-normal text-[#121214] group-hover:text-[#D97706] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#78716C] font-sans mt-2 leading-relaxed">
                    {item.details}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#E0DCD4] flex items-center justify-between">
                  <span className="font-serif italic text-2xl text-[#121214]">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      className="px-6 py-2.5 rounded-full bg-[#18181B] hover:bg-[#D97706] text-[#FAF9F6] text-xs font-mono tracking-widest uppercase font-bold transition-all shadow-sm"
                    >
                      {isAdded ? 'Added ✓' : 'Acquire'}
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
