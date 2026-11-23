'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { cinzel, outfit } from './fonts';

const CRAFT_WORDS = [
  '100% NORMANDY FLAX',
  'BOTANICAL OAT DYE',
  '280 GSM COMBED YARN',
  'HAND-PLEATED GURKHA',
];

export function Demo5Hero() {
  const { addItem } = useCart();
  const [wordIdx, setWordIdx] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % CRAFT_WORDS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const handleHeroQuickAdd = () => {
    addItem('prod-d5-hero-linen', 1, [{ name: 'Size', value: 'L' }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className={`relative bg-[#F4EFEA] text-[#2C241E] py-16 sm:py-24 border-b border-[#E3DACD] overflow-hidden ${cinzel.variable} ${outfit.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Top Seal */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-px bg-[#B85D3B]" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#B85D3B] font-serif font-bold">
            Mediterranean Craft Edition · Harvest 2026
          </span>
        </div>

        {/* Hero Title and Flip Words */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
          <div className="lg:col-span-8">
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#2C241E] leading-[1.05] tracking-tight">
              Shaped By Sun, <br />
              <span className="italic font-normal text-[#B85D3B]">
                Woven By Hand.
              </span>
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-[#6B5C52] font-sans">
                Material Origin:
              </span>
              <div className="h-8 overflow-hidden inline-flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIdx}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="font-serif text-lg sm:text-xl font-bold tracking-wider text-[#B85D3B] uppercase"
                  >
                    {CRAFT_WORDS[wordIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 lg:text-right">
            <p className="text-xs text-[#6B5C52] font-sans leading-relaxed tracking-wide max-w-sm ml-auto">
              Natural fibers sourced from European family mills, washed in pure well water, and tailored for effortless coastal living.
            </p>
          </div>
        </div>

        {/* Arched Architectural Hero Centerpiece */}
        <div className="relative rounded-t-[4rem] sm:rounded-t-[6rem] overflow-hidden border border-[#E3DACD] bg-[#EBE4DC] shadow-[0_20px_50px_rgba(44,36,30,0.08)] group">
          <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full">
            <Image
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=2000&q=85"
              alt="Mediterranean Pure Linen Ensemble"
              fill
              priority
              className="object-cover object-center filter contrast-[1.03] group-hover:scale-105 transition-all duration-1000 ease-out"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2C241E]/80 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Bottom Card Strip */}
          <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-[#F4EFEA]">
            <div className="space-y-1">
              <span className="text-[10px] tracking-[0.25em] text-[#E08F6E] uppercase font-serif block">
                Artisanal Look 01 · 100% Normandy Flax
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal">
                Camp-Collar Belgian Linen Shirt · Natural Oat
              </h3>
              <p className="text-xs text-[#F4EFEA]/80 font-sans">
                Airy loose weave designed to soften and drape with every wear
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-serif italic text-2xl text-[#E08F6E]">₹2,499</span>
              <button
                onClick={handleHeroQuickAdd}
                className="px-8 py-3.5 rounded-full bg-[#B85D3B] hover:bg-[#9F4B2D] text-[#F4EFEA] font-sans text-xs tracking-widest uppercase font-semibold transition-all shadow-md"
              >
                {added ? 'Added to Bag ✓' : 'Acquire Piece'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
