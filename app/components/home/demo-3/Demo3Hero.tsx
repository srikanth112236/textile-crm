'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Sparkles, Check } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { plusJakarta, playfair } from './fonts';

const FLIP_ITEMS = [
  '280 GSM HEAVYWEIGHT JERSEY',
  '100% PURE NORMANDY FLAX',
  'DOUBLE-PLEATED GURKHA ARCHITECTURE',
  'STRUCTURAL BOX-SHOULDER DRAPE',
];

export function Demo3Hero() {
  const { addItem } = useCart();
  const [flipIdx, setFlipIdx] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlipIdx((prev) => (prev + 1) % FLIP_ITEMS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const handleHeroQuickAdd = () => {
    addItem('prod-d3-hero-tee', 1, [{ name: 'Size', value: 'L' }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <section className={`relative bg-[#FAF9F6] text-[#121214] py-12 sm:py-20 border-b border-[#E7E5E0] overflow-hidden ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Top Tag */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-6 h-px bg-[#D97706]" />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold">
            Studio Collection 2026 · Drop 03
          </span>
        </div>

        {/* Headline & Flip Words */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
          <div className="lg:col-span-8">
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-[#121214] leading-[1.05] tracking-tight">
              Sculpted In Silence. <br />
              <span className="italic font-normal text-[#78716C]">
                Tailored for Permanence.
              </span>
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs uppercase text-[#78716C] bg-[#F0EEE9] px-3 py-1 rounded-full border border-[#E0DCD4]">
                MATERIAL FOCUS:
              </span>
              <div className="h-8 overflow-hidden inline-flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={flipIdx}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="font-mono text-xs sm:text-sm font-bold tracking-wider text-[#D97706] uppercase"
                  >
                    {FLIP_ITEMS[flipIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 lg:text-right">
            <p className="text-xs text-[#57534E] font-sans leading-relaxed tracking-wide max-w-sm ml-auto">
              Heavyweight ring-spun cotton and pure Belgian flax linen constructed without polyester shortcuts. Clean drape, substantial shoulder structure.
            </p>
          </div>
        </div>

        {/* Masterpiece Split Photographic Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Hero Lookplate */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden border border-[#E7E5E0] bg-[#F0EEE9] shadow-sm group">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
              <Image
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=85"
                alt="280 GSM Heavy Boxy Studio Drop"
                fill
                priority
                className="object-cover object-center filter contrast-[1.04] group-hover:scale-105 transition-all duration-1000 ease-out"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#18181B]/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Bottom Card Strip */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-[#FAF9F6]">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-[#FBBF24] uppercase font-bold block mb-1">
                  CORE SPECIMEN · 280 GSM JERSEY
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-normal">
                  Heavy Boxy Drop-Shoulder Tee · Mineral Noir
                </h3>
                <p className="text-xs text-[#FAF9F6]/80 font-sans mt-0.5">
                  Dense ring-spun jersey · High-spandex collar rib · Zero torso cling
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-serif italic text-2xl text-[#FBBF24]">₹1,499</span>
                <button
                  onClick={handleHeroQuickAdd}
                  className="px-6 py-3 rounded-full bg-[#FAF9F6] hover:bg-[#D97706] text-[#18181B] hover:text-[#FAF9F6] font-mono text-xs uppercase font-bold tracking-wider transition-all shadow-md flex items-center gap-1.5"
                >
                  {added ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Added ✓</span>
                    </>
                  ) : (
                    <span>Acquire Size L</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Studio Spec Sheet */}
          <div className="lg:col-span-4 rounded-3xl border border-[#E7E5E0] bg-[#F5F3EE] p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b border-[#E0DCD4] pb-4">
                <span className="font-mono text-[10px] tracking-widest uppercase text-[#D97706] font-bold block">
                  GARMENT CALIBRATION
                </span>
                <h4 className="font-serif text-2xl text-[#121214] mt-1 font-normal">
                  Architectural Metrics
                </h4>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between pb-2 border-b border-[#E0DCD4]">
                  <span className="text-[#78716C]">FABRIC WEIGHT:</span>
                  <span className="font-bold text-[#121214]">280 GSM RING-SPUN</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E0DCD4]">
                  <span className="text-[#78716C]">SHOULDER DROP:</span>
                  <span className="font-bold text-[#121214]">+4.5 CM EXTENDED</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E0DCD4]">
                  <span className="text-[#78716C]">NECK RIBBING:</span>
                  <span className="font-bold text-[#121214]">3.5 CM ANTI-BACON</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-[#E0DCD4]">
                  <span className="text-[#78716C]">SHRINK TOLERANCE:</span>
                  <span className="font-bold text-[#121214]">&lt; 1% PRE-SHRUNK</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E0DCD4] space-y-3">
              <Link
                href="/products?sort=newest"
                className="w-full py-3.5 rounded-full bg-[#18181B] hover:bg-[#D97706] text-[#FAF9F6] font-mono text-xs uppercase font-bold tracking-widest transition-all text-center block shadow-sm"
              >
                Browse Complete Drop →
              </Link>
              <p className="font-mono text-[10px] text-center text-[#78716C] uppercase">
                Free Doorstep Size Exchange · 19,000+ Pincodes
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
