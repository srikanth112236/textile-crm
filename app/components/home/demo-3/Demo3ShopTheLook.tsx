'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { plusJakarta, playfair } from './fonts';

interface Hotspot {
  id: string;
  x: number;
  y: number;
  title: string;
  category: string;
  spec: string;
  price: number;
  image: string;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'hs-1',
    x: 48,
    y: 35,
    title: 'Camp-Collar Belgian Linen Shirt',
    category: 'shirts',
    spec: '100% Pure Flax · Natural Oat · Open Resort Weave',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hs-2',
    x: 52,
    y: 72,
    title: 'Double-Pleated Gurkha Trouser',
    category: 'pants',
    spec: 'High-Rise Architectural Fall · Bone White',
    price: 2899,
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
  },
];

export function Demo3ShopTheLook() {
  const { addItem } = useCart();
  const [activeSpot, setActiveSpot] = useState<Hotspot>(HOTSPOTS[0]);
  const [added, setAdded] = useState(false);

  const handleQuickAdd = () => {
    addItem(activeSpot.id, 1, [{ name: 'Size', value: 'L' }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className={`relative bg-[#FAF9F6] text-[#121214] py-24 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#E7E5E0]">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold block mb-2">
              Curated Lookbook
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#121214] tracking-tight">
              Shop The <span className="italic font-normal text-[#78716C]">Ensemble</span>
            </h2>
          </div>
          <p className="text-xs text-[#57534E] font-sans max-w-sm leading-relaxed">
            Tap the interactive pins on the look to inspect the yarn composition and tailored cut of each garment.
          </p>
        </div>

        {/* Hotspot Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 items-stretch">
          {/* Main Visual */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-[#E7E5E0] bg-[#F5F3EE] aspect-[4/5] sm:aspect-[16/11]">
            <Image
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85"
              alt="Mentoos Studio Look"
              fill
              className="object-cover object-center filter contrast-[1.03]"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#18181B]/40 via-transparent to-transparent pointer-events-none" />

            {/* Hotspots */}
            {HOTSPOTS.map((spot, i) => {
              const isSelected = activeSpot.id === spot.id;
              return (
                <div
                  key={spot.id}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    onClick={() => setActiveSpot(spot)}
                    className="relative group p-2 focus:outline-none"
                    aria-label={`Inspect ${spot.title}`}
                  >
                    <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#D97706] border-white text-white scale-110 shadow-lg'
                        : 'bg-white/90 border-[#18181B] text-[#18181B] hover:scale-105'
                    }`}>
                      0{i + 1}
                    </span>
                    <span className="absolute inset-0 rounded-full bg-[#D97706]/40 animate-ping -z-10" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Detail */}
          <div className="lg:col-span-4 rounded-3xl bg-[#F5F3EE] border border-[#E7E5E0] p-8 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSpot.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <span className="text-[10px] tracking-widest uppercase text-[#D97706] font-mono font-bold block mb-1">
                    {activeSpot.category}
                  </span>
                  <h3 className="font-serif text-2xl font-normal text-[#121214]">
                    {activeSpot.title}
                  </h3>
                </div>

                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#EBE7DF] border border-[#E0DCD4]">
                  <Image
                    src={activeSpot.image}
                    alt={activeSpot.title}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-[#78716C] font-sans leading-relaxed">
                    {activeSpot.spec}
                  </p>
                  <div className="font-serif italic text-2xl text-[#121214]">
                    ₹{activeSpot.price.toLocaleString('en-IN')}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-6 border-t border-[#E0DCD4] space-y-3 mt-6">
              <button
                onClick={handleQuickAdd}
                className="w-full py-3.5 rounded-full bg-[#18181B] hover:bg-[#D97706] text-[#FAF9F6] font-mono text-xs uppercase font-bold tracking-widest transition-all shadow-md"
              >
                {added ? 'Added to Bag ✓' : 'Add Piece to Bag'}
              </button>
              <Link
                href={`/products?category=${activeSpot.category}`}
                className="text-center block text-xs tracking-widest uppercase text-[#78716C] hover:text-[#121214] transition-colors font-mono font-bold"
              >
                Inspect Piece Details →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
