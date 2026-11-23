'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { bebasNeue, dmSans } from './fonts';

const RUNWAY_WORDS = [
  'STREET OVERSIZED',
  'KINETIC BELGIAN FLAX',
  '280 GSM COMPACT JERSEY',
  'STRUCTURAL GURKHA DRAPE',
];

export function Demo4Hero() {
  const { addItem } = useCart();
  const [wordIdx, setWordIdx] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % RUNWAY_WORDS.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const handleHeroQuickAdd = () => {
    addItem('prod-d4-hero-tee', 1, [{ name: 'Size', value: 'L' }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className={`relative bg-paper py-16 sm:py-24 border-b-2 border-ink overflow-hidden ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Top Runway Badge Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-ink/20 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="bg-brand text-paper px-2.5 py-0.5 font-bold uppercase text-[10px]">
              LIVE RUNWAY
            </span>
            <span className="text-ink/60 uppercase tracking-widest font-bold">
              AUTUMN/WINTER SHOWCASE · LOOK 01
            </span>
          </div>
          <div className="font-mono text-xs font-bold text-ink/70">
            SPEED: 120BPM · METRIC DRAPE
          </div>
        </div>

        {/* Massive Runway Headline */}
        <div className="pt-8 pb-10">
          <div className="flex items-center gap-2 text-brand font-mono text-xs uppercase font-extrabold tracking-widest mb-2">
            <span>●</span> MOTION IN HIGH DEFINITION
          </div>

          <h1 className="font-bebas text-6xl sm:text-8xl md:text-9xl lg:text-[130px] leading-[0.88] text-ink tracking-tight uppercase">
            VELOCITY <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-ink to-ink/70">
              MEETS STRUCTURE.
            </span>
          </h1>

          {/* Flip Word Strip */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase text-ink/60 bg-sand/60 px-3 py-1 font-bold border border-ink/20">
              CORE SILHOUETTE:
            </span>
            <div className="h-9 overflow-hidden bg-ink text-paper px-4 flex items-center border border-ink">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIdx}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -24, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-xs sm:text-sm font-bold tracking-wider text-brand uppercase"
                >
                  {RUNWAY_WORDS[wordIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Dynamic Split Runway Visual Plate */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
          {/* Main Visual */}
          <div className="lg:col-span-8 relative border-2 border-ink bg-sand/30 overflow-hidden group">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full">
              <Image
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=85"
                alt="280 GSM Heavy Boxy Runway Drop"
                fill
                priority
                className="object-cover object-center filter contrast-[1.08] group-hover:scale-105 transition-all duration-700 ease-out"
                sizes="(max-width: 1024px) 100vw, 66vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Bottom Overlay Info */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-paper">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-brand uppercase font-bold block mb-1">
                  RUNWAY PIECE 01 · 280 GSM JERSEY
                </span>
                <h3 className="font-bebas text-3xl sm:text-4xl tracking-wide uppercase">
                  Oversized Drop-Shoulder Tee · Mineral Noir
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bebas text-3xl text-paper">₹1,499</span>
                <button
                  onClick={handleHeroQuickAdd}
                  className="px-6 py-3 bg-brand hover:bg-paper hover:text-ink text-paper font-sans text-xs font-black tracking-widest uppercase transition-all shadow-md"
                >
                  {added ? 'LOCKED TO BAG ✓' : 'GRAB RUNWAY [L]'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Kinetic Spec Column */}
          <div className="lg:col-span-4 border-2 border-ink p-8 bg-sand/20 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="border-b-2 border-ink pb-4">
                <span className="font-mono text-[10px] tracking-widest uppercase text-brand font-bold block">
                  RUNWAY SPECIFICATIONS
                </span>
                <h4 className="font-bebas text-3xl text-ink uppercase tracking-wide mt-1">
                  FABRIC METRICS
                </h4>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between pb-2 border-b border-ink/20">
                  <span className="text-ink/60">DENSITY:</span>
                  <span className="font-bold text-ink">280 GSM REAL HEAVY</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-ink/20">
                  <span className="text-ink/60">SHOULDER EXTENSION:</span>
                  <span className="font-bold text-ink">+4.5 CM DROPPED</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-ink/20">
                  <span className="text-ink/60">COLLAR STABILITY:</span>
                  <span className="font-bold text-ink">REINFORCED SPANDEX</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-ink/20">
                  <span className="text-ink/60">ORIGIN:</span>
                  <span className="font-bold text-ink">SOUTH ASIAN ATELIER</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t-2 border-ink space-y-3">
              <Link
                href="/products?sort=newest"
                className="w-full py-3.5 bg-ink text-paper hover:bg-brand font-sans text-xs font-black tracking-widest uppercase transition-all text-center block"
              >
                EXPLORE ALL RUNWAY PIECES →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
