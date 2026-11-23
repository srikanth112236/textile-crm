'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const FLIP_WORDS = [
  '280 GSM HEAVYWEIGHT',
  '100% PURE BELGIAN FLAX',
  'ZERO POLYESTER DENSITY',
  'TAILORED GURKHA PLEAT',
];

export function Demo2Hero() {
  const { addItem } = useCart();
  const [wordIdx, setWordIdx] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % FLIP_WORDS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const handleHeroQuickAdd = () => {
    addItem('prod-d2-hero-tee', 1, [{ name: 'Size', value: 'L' }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <section className={`relative bg-paper border-b-2 border-ink py-12 lg:py-20 overflow-hidden ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      {/* Background Blueprint Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 relative z-10">
        {/* Top Spec Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-ink/30 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="bg-ink text-paper px-2 py-0.5 text-[10px] font-bold">SYSTEM // 01</span>
            <span className="text-ink/60 uppercase tracking-widest text-[11px]">
              SPECIFICATION SHEET · AUTUMN/WINTER ARCHIVE
            </span>
          </div>
          <div className="flex items-center gap-6 text-[11px] text-ink/70">
            <span>BARCODE: 890441920014</span>
            <span className="hidden md:inline">REF: ARCH-MEN-2026</span>
            <span className="text-brand font-bold">STATUS: PRODUCTION READY</span>
          </div>
        </div>

        {/* Hero Title and Flip Word Terminal */}
        <div className="pt-8 pb-10">
          <div className="font-mono text-xs text-brand tracking-widest uppercase mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-brand" />
            ENGINEERED MENSWEAR FOUNDATION
          </div>

          <h1 className="font-syne text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-ink tracking-tight uppercase leading-[0.9] max-w-5xl">
            RIGID STRUCTURE. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ink via-ink/80 to-brand">
              PERFECT DRAPE.
            </span>
          </h1>

          {/* Dynamic Flip Words Box */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase text-ink/60 bg-sand/60 px-3 py-1 border border-ink/20">
              FABRIC SPECIFICATION:
            </span>
            <div className="h-8 sm:h-9 overflow-hidden bg-ink text-paper px-4 flex items-center border border-ink">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIdx}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -24, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="font-mono text-xs sm:text-sm font-bold tracking-wider text-brand"
                >
                  {FLIP_WORDS[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Brutalist Hero Grid Assembly */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-6">
          {/* Main Hero Specimen Centerpiece */}
          <div className="lg:col-span-8 relative border-2 border-ink bg-sand/20 overflow-hidden group">
            {/* Corner Crop Marks */}
            <span className="absolute top-2 left-2 font-mono text-[11px] text-ink/60 z-20 select-none">┌ ARCH-01</span>
            <span className="absolute top-2 right-2 font-mono text-[11px] text-ink/60 z-20 select-none">┐ 280GSM</span>
            <span className="absolute bottom-2 left-2 font-mono text-[11px] text-ink/60 z-20 select-none">└ HEAVY-COTTON</span>
            <span className="absolute bottom-2 right-2 font-mono text-[11px] text-ink/60 z-20 select-none">┘ SPEC-VERIFIED</span>

            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
              <Image
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=85"
                alt="280 GSM Heavyweight Oversized Tee"
                fill
                priority
                className="object-cover object-center filter grayscale contrast-[1.1] group-hover:grayscale-0 transition-all duration-700 ease-out"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            </div>

            {/* Bottom Spec Strip on Hero Card */}
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-paper flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] text-brand tracking-widest uppercase">SPECIMEN #001 · CORE DROP</span>
                <h3 className="font-syne text-2xl sm:text-3xl font-extrabold uppercase mt-1">
                  280 GSM Boxy Drop-Shoulder Specimen
                </h3>
                <p className="font-mono text-xs text-paper/70 mt-1">
                  Combed compact yarn · High-density collar rib · Zero torso cling
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-paper">₹1,499</span>
                <button
                  onClick={handleHeroQuickAdd}
                  className="px-5 py-2.5 bg-brand text-paper hover:bg-paper hover:text-ink font-mono text-xs tracking-wider uppercase font-bold transition-all border border-brand"
                >
                  {added ? 'LOCKED TO BAG ✓' : 'ACQUIRE [L]'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Technical Spec Blueprint Column */}
          <div className="lg:col-span-4 border-2 border-ink p-6 bg-paper flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-ink pb-4">
                <span className="font-mono text-[10px] tracking-widest text-brand uppercase block">CALIBRATION INDEX</span>
                <h4 className="font-syne text-xl font-bold uppercase mt-1">Physical Metrics</h4>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-ink/20">
                  <span className="text-ink/60">YARN GAUGE:</span>
                  <span className="font-bold text-ink">24s COMPACT COMBED</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-ink/20">
                  <span className="text-ink/60">FABRIC MASS:</span>
                  <span className="font-bold text-ink">280 GSM REAL</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-ink/20">
                  <span className="text-ink/60">COLLAR STABILITY:</span>
                  <span className="font-bold text-ink">3.5CM SPANDEX RIB</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-ink/20">
                  <span className="text-ink/60">DROP SHOULDER:</span>
                  <span className="font-bold text-ink">+4.5 CM EXTENDED</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-ink/20">
                  <span className="text-ink/60">WASH DEVIATION:</span>
                  <span className="font-bold text-ink">&lt; 1.2% TOLERANCE</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-6 border-t-2 border-ink space-y-3">
              <Link
                href="/products?sort=newest"
                className="w-full py-3 bg-ink text-paper hover:bg-brand font-mono text-xs tracking-widest uppercase font-bold transition-all text-center block"
              >
                BROWSE COMPLETE ARCHIVE →
              </Link>
              <div className="font-mono text-[10px] text-ink/50 text-center uppercase tracking-widest">
                VERIFIED DOMESTIC DISPATCH WITHIN 24H
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
