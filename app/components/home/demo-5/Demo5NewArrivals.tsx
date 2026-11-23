'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { cinzel, outfit } from './fonts';

const NEW_ARRIVALS = [
  {
    id: 'prod-d5-na-1',
    name: '260 GSM Raw Chalk Heavy Tee',
    category: 't-shirts',
    spec: 'Long-staple ring-spun cotton · Mineral wash',
    price: 1399,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d5-na-2',
    name: 'Camp-Collar Flax Shirt · Olive Drab',
    category: 'shirts',
    spec: '100% Normandy Flax · Open resort weave',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d5-na-3',
    name: 'Pleated Gurkha Trouser · Mineral Sand',
    category: 'pants',
    spec: 'High-rise extended buckle · Weighted drape',
    price: 2899,
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prod-d5-na-4',
    name: 'Textured Waffle Knit Overshirt',
    category: 'shirts',
    spec: '320 GSM structural weave · Horn buttons',
    price: 2799,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
];

export function Demo5NewArrivals() {
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
              Fresh Harvest
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#2C241E] tracking-tight">
              New <span className="italic font-normal text-[#B85D3B]">Arrivals</span>
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-xs uppercase tracking-widest text-[#6B5C52] hover:text-[#B85D3B] transition-colors flex items-center gap-2 font-serif"
          >
            <span>View Full Lookbook</span>
            <span>→</span>
          </Link>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mt-8 sm:mt-10">
          {NEW_ARRIVALS.map((item) => {
            const isAdded = !!addedMap[item.id];

            return (
              <div
                key={item.id}
                className="group rounded-t-3xl overflow-hidden bg-[#EAE2D8] border border-[#E3DACD] hover:border-[#B85D3B]/60 transition-all duration-500 flex flex-col justify-between"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#DDD4C7]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-700 ease-out"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-[#F4EFEA]/90 backdrop-blur-sm rounded-full font-serif italic text-[#B85D3B] text-[11px]">
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between bg-[#EAE2D8]">
                  <div>
                    <span className="text-[9px] tracking-widest uppercase text-[#B85D3B] font-sans block mb-1">
                      {item.category}
                    </span>
                    <h3 className="font-serif text-sm sm:text-base font-normal text-[#2C241E] group-hover:text-[#B85D3B] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-[#6B5C52] font-sans mt-0.5 line-clamp-1">
                      {item.spec}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-[#D9CFC2] flex gap-2">
                    <button
                      onClick={() => handleQuickAdd(item.id)}
                      className="flex-1 py-2 rounded-full bg-[#B85D3B] hover:bg-[#9F4B2D] text-[#F4EFEA] text-[10px] tracking-wider uppercase font-sans font-medium transition-all"
                    >
                      {isAdded ? 'Added ✓' : 'Quick Add'}
                    </button>
                    <Link
                      href={`/products?category=${item.category}`}
                      className="w-8 h-8 rounded-full border border-[#D9CFC2] hover:border-[#B85D3B] text-[#2C241E] text-xs flex items-center justify-center transition-colors"
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
