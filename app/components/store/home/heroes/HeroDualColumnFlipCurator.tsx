'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, SlidersHorizontal, Check } from 'lucide-react';

const FLIP_TARGETS = ['PERFECT CUT', 'SIGNATURE FIT', 'RESORT EDIT', 'ROYAL ETHNIC'];

const FABRICS = [
  {
    name: '240 GSM Combed Cotton',
    badge: 'STREET HEAVYWEIGHT',
    desc: 'Dense structural weave that hangs with relaxed confidence.',
    href: '/products?search=oversized',
    colA: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=500&q=85',
    colB: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=85',
  },
  {
    name: '100% French Flax Linen',
    badge: 'TROPICAL BREEZE',
    desc: 'Enzyme-softened linen designed for high-humidity breathability.',
    href: '/products?search=linen',
    colA: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=85',
    colB: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=85',
  },
  {
    name: 'Handcrafted Slub & Jacquard',
    badge: 'INDO-WESTERN LUXURY',
    desc: 'Short kurtas and embroidered waistcoats made for celebration.',
    href: '/products?category=ethnic-wear',
    colA: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=85',
    colB: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=500&q=85',
  },
];

export function HeroDualColumnFlipCurator() {
  const [wordIdx, setWordIdx] = useState(0);
  const [activeFabric, setActiveFabric] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % FLIP_TARGETS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const currentWord = FLIP_TARGETS[wordIdx];
  const currentFabric = FABRICS[activeFabric];

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-line bg-[#fbf9f5] p-6 sm:p-12 shadow-sm">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Flip Word Curator */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-sand/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ink">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            <span>Masterpiece 14 · Dual Column Counter-Parallax</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono font-bold tracking-widest text-ink-muted uppercase">
              CURATED SILHOUETTES // 2026
            </p>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink uppercase leading-none">
              DISCOVER YOUR
            </h2>

            {/* Flip Word */}
            <div className="h-14 sm:h-20 flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWord}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif italic text-3xl sm:text-5xl lg:text-6xl font-bold text-amber-800 leading-none"
                >
                  {currentWord}.
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-ink-muted max-w-lg">
            {currentFabric.desc}
          </p>

          {/* Interactive Fabric Selector Tabs */}
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink-muted">
              Select Fabric Story:
            </p>
            <div className="flex flex-wrap gap-2">
              {FABRICS.map((f, idx) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setActiveFabric(idx)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    activeFabric === idx
                      ? 'bg-ink text-white font-black shadow-xs scale-105'
                      : 'border border-line bg-white/80 text-ink hover:bg-sand'
                  }`}
                >
                  {f.badge}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={currentFabric.href}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c6f03d] px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition-all hover:bg-[#b8e232] shadow-sm active:scale-95"
            >
              <span>Explore {currentFabric.badge}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Dual Counter-Scrolling Parallax Columns */}
        <div className="lg:col-span-6 relative h-[440px] sm:h-[480px] overflow-hidden rounded-[28px] bg-sand/40 border border-line p-3">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#fbf9f5] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fbf9f5] to-transparent z-10" />

          <div className="grid grid-cols-2 gap-3 h-full">
            {/* Column A - Counter Drift 1 */}
            <motion.div
              animate={{ y: [0, -60, 0] }}
              transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
              className="flex flex-col gap-3"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#ebe7df] border border-line shadow-sm">
                <Image src={currentFabric.colA} alt="" fill className="object-cover object-top" sizes="200px" />
              </div>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#ebe7df] border border-line shadow-sm">
                <Image src={currentFabric.colB} alt="" fill className="object-cover object-top" sizes="200px" />
              </div>
            </motion.div>

            {/* Column B - Counter Drift 2 */}
            <motion.div
              animate={{ y: [-50, 10, -50] }}
              transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
              className="flex flex-col gap-3 pt-6"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#ebe7df] border border-line shadow-sm">
                <Image src={currentFabric.colB} alt="" fill className="object-cover object-top" sizes="200px" />
              </div>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#ebe7df] border border-line shadow-sm">
                <Image src={currentFabric.colA} alt="" fill className="object-cover object-top" sizes="200px" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
