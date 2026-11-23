'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { fraunces, manrope } from './fonts';

interface Hotspot {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  title: string;
  category: string;
  spec: string;
  price: number;
  productId: string;
  href: string;
  image: string;
}

const LOOKS = [
  {
    id: 'look-1',
    title: 'The Riviera Atelier',
    subtitle: 'Editorial Look 08 · Late Summer Linen Ensemble',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85',
    hotspots: [
      {
        id: 'hs-1',
        x: 48,
        y: 35,
        title: 'Camp-Collar Belgian Linen Shirt',
        category: 'Shirts',
        spec: '100% Pure Flax · 165 GSM · Natural Oat',
        price: 2499,
        productId: 'look-shirt-1',
        href: '/products?category=shirts',
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'hs-2',
        x: 52,
        y: 72,
        title: 'Double-Pleated Linen Gurkha Trouser',
        category: 'Pants',
        spec: 'High-Rise Relaxed Drape · Bone White',
        price: 2899,
        productId: 'look-trouser-1',
        href: '/products?category=pants',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
  {
    id: 'look-2',
    title: 'Monochrome Nocturne',
    subtitle: 'Editorial Look 09 · Structured Heavyweight Cotton',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1600&q=85',
    hotspots: [
      {
        id: 'hs-3',
        x: 50,
        y: 38,
        title: '280 GSM Boxy Drop-Shoulder Tee',
        category: 'T-Shirts',
        spec: 'Ring-spun combed jersey · Mineral Black',
        price: 1499,
        productId: 'look-tee-2',
        href: '/products?category=t-shirts',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'hs-4',
        x: 46,
        y: 78,
        title: 'Relaxed Tailored Pleated Chino',
        category: 'Pants',
        spec: 'Heavy twill · Deep Charcoal',
        price: 2699,
        productId: 'look-chino-2',
        href: '/products?category=pants',
        image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
      },
    ],
  },
];

export function Demo1ShopTheLook() {
  const { addItem } = useCart();
  const [activeLookIdx, setActiveLookIdx] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(LOOKS[0].hotspots[0]);
  const [addedId, setAddedId] = useState<string | null>(null);

  const look = LOOKS[activeLookIdx];

  const handleQuickAdd = (spot: Hotspot) => {
    addItem(spot.productId, 1, [{ name: 'Size', value: 'L' }]);
    setAddedId(spot.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <section className={`relative bg-paper py-24 sm:py-32 border-b border-line/60 ${manrope.variable} ${fraunces.variable} font-sans overflow-hidden`}>
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-line">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">Chapter 08</span>
              <span className="w-8 h-px bg-ink/20" />
              <span className="font-mono text-[10px] tracking-widest text-brand uppercase">Curated Ensembles</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-ink tracking-tight">
              Shop The <span className="italic font-normal">Lookbook</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {LOOKS.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveLookIdx(idx);
                  setActiveHotspot(item.hotspots[0]);
                }}
                className={`px-4 py-2 text-xs tracking-widest uppercase transition-all duration-300 ${
                  activeLookIdx === idx
                    ? 'bg-ink text-paper'
                    : 'bg-transparent text-ink/60 border border-line hover:border-ink/40'
                }`}
              >
                Look {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Look Canvas with Hotspots */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Main Editorial Image with Hotspots */}
          <div className="relative lg:col-span-8 aspect-[4/5] sm:aspect-[16/11] bg-sand/40 overflow-hidden">
            <Image
              src={look.image}
              alt={look.title}
              fill
              className="object-cover object-center filter contrast-[1.03] transition-all duration-700"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent pointer-events-none" />

            {/* Look Caption Overlay */}
            <div className="absolute bottom-6 left-6 right-6 sm:left-8 sm:bottom-8 text-paper pointer-events-none">
              <p className="font-mono text-[10px] tracking-widest uppercase opacity-80">{look.subtitle}</p>
              <h3 className="font-serif text-2xl sm:text-3xl font-light mt-1">{look.title}</h3>
            </div>

            {/* Hotspots */}
            {look.hotspots.map((spot, i) => {
              const isSelected = activeHotspot?.id === spot.id;
              return (
                <div
                  key={spot.id}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    onClick={() => setActiveHotspot(spot)}
                    className="relative group p-2 focus:outline-none"
                    aria-label={`Inspect ${spot.title}`}
                  >
                    <span className={`block w-7 h-7 rounded-full border transition-all duration-300 flex items-center justify-center ${
                      isSelected
                        ? 'bg-ink border-paper text-paper scale-110 shadow-lg'
                        : 'bg-paper/90 border-ink/40 text-ink hover:scale-105'
                    }`}>
                      <span className="font-mono text-[10px] font-bold">{i + 1}</span>
                    </span>
                    <span className="absolute inset-0 rounded-full bg-brand/30 animate-ping -z-10 opacity-75" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Garment Card */}
          <div className="lg:col-span-4 bg-sand/30 border border-line p-6 sm:p-8 flex flex-col justify-between min-h-[460px]">
            <AnimatePresence mode="wait">
              {activeHotspot && (
                <motion.div
                  key={activeHotspot.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col h-full"
                >
                  <div className="relative aspect-[4/3] w-full bg-paper overflow-hidden mb-6 border border-line/60">
                    <Image
                      src={activeHotspot.image}
                      alt={activeHotspot.title}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 33vw"
                    />
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">
                        {activeHotspot.category}
                      </span>
                      <span className="font-serif italic text-base text-ink font-normal">
                        ₹{activeHotspot.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <h4 className="font-serif text-xl text-ink font-light leading-snug">
                      {activeHotspot.title}
                    </h4>

                    <p className="text-xs text-ink/60 font-sans tracking-tight">
                      {activeHotspot.spec}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-line mt-6 flex flex-col gap-3">
                    <button
                      onClick={() => handleQuickAdd(activeHotspot)}
                      className="w-full py-3.5 bg-ink text-paper text-xs font-mono tracking-widest uppercase hover:bg-ink/90 transition-all duration-300"
                    >
                      {addedId === activeHotspot.id ? 'Added to Bag ✓' : 'Quick Add — Size L'}
                    </button>
                    <Link
                      href={activeHotspot.href}
                      className="text-center text-xs tracking-wider uppercase text-ink/70 hover:text-ink transition-colors underline underline-offset-4 font-mono text-[11px]"
                    >
                      View Piece Details →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
