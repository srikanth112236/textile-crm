'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { cinzel, outfit } from './fonts';

const BEST_SELLERS = [
  {
    id: 'prod-d5-bs-1',
    name: '280 GSM Heavyweight Oversized Tee',
    shade: 'Mineral Noir',
    rating: '★ 4.98 · 1,420 Patrons',
    price: 1499,
    category: 't-shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    details: '24s combed compact cotton · High spandex neckband · Zero cling',
  },
  {
    id: 'prod-d5-bs-2',
    name: 'Relaxed Pure Linen Camp Shirt',
    shade: 'Raw Ivory',
    rating: '★ 4.95 · 980 Patrons',
    price: 2499,
    category: 'shirts',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    details: '100% Normandy flax linen · Hand-finished camp collar · Breezy airiness',
  },
  {
    id: 'prod-d5-bs-3',
    name: 'Double-Pleated Tailored Gurkha',
    shade: 'Bone Sand',
    rating: '★ 4.96 · 1,150 Patrons',
    price: 2899,
    category: 'pants',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    details: 'High-rise extended buckle waistband · Architectural pleat depth',
  },
];

export function Demo5BestSellers() {
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
    <section className={`relative bg-[#F4EFEA] text-[#2C241E] py-14 sm:py-16 border-b border-[#E3DACD] ${cinzel.variable} ${outfit.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 sm:pb-8 border-b border-[#E3DACD]">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B85D3B] font-serif font-bold block mb-1">
              Permanent Archetypes
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#2C241E] tracking-tight">
              Best <span className="italic font-normal text-[#B85D3B]">Sellers</span>
            </h2>
          </div>
          <p className="text-xs text-[#6B5C52] font-sans max-w-sm leading-relaxed">
            The wardrobe foundations reordered continually by over 80,000 discerning patrons.
          </p>
        </div>

        {/* 3 Arched Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
          {BEST_SELLERS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="group rounded-t-3xl overflow-hidden bg-[#EAE2D8] border border-[#E3DACD] hover:border-[#B85D3B]/60 p-4 sm:p-5 flex flex-col justify-between transition-all duration-500 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#D9CFC2]">
                    <span className="text-xs text-[#B85D3B] font-serif italic font-bold">{item.rating}</span>
                    <span className="text-xs text-[#6B5C52] font-sans">{item.shade}</span>
                  </div>

                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#DDD4C7] rounded-t-2xl my-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-700 ease-out"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>

                  <h3 className="font-serif text-base sm:text-lg font-normal text-[#2C241E] group-hover:text-[#B85D3B] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#6B5C52] font-sans mt-1 line-clamp-1">
                    {item.details}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#D9CFC2] flex items-center justify-between">
                  <span className="font-serif italic text-lg sm:text-xl text-[#B85D3B]">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      className="px-4 py-2 rounded-full bg-[#B85D3B] hover:bg-[#9F4B2D] text-[#F4EFEA] text-[11px] tracking-wider uppercase font-sans font-medium transition-all shadow-sm"
                    >
                      {isAdded ? 'Added ✓' : 'Acquire'}
                    </button>
                    <Link
                      href={`/products?category=${item.category}`}
                      className="w-8 h-8 rounded-full border border-[#D9CFC2] hover:border-[#B85D3B] text-[#2C241E] text-xs flex items-center justify-center transition-colors"
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
