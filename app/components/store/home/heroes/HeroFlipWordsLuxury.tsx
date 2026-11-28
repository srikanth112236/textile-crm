'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star, Check } from 'lucide-react';

const WORDS = ['CONFIDENCE', 'SILHOUETTE', 'ATTITUDE', 'PRECISION'];

const FIT_CHIPS = [
  { label: '🔥 Oversized 240 GSM', href: '/products?search=oversized', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80' },
  { label: '🌿 French Flax Linen', href: '/products?search=linen', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80' },
  { label: '👑 Designer Ethnic', href: '/products?category=ethnic-wear', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80' },
  { label: '👖 Cargo Streetwear', href: '/products?category=joggers', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80' },
];

export function HeroFlipWordsLuxury() {
  const [wordIndex, setWordIndex] = useState(0);
  const [activeChip, setActiveChip] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const currentWord = WORDS[wordIndex];
  const currentFit = FIT_CHIPS[activeChip];

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-line bg-[#fbf9f5] p-6 sm:p-12 shadow-sm">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Flip Words Typography */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-sand/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ink">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            <span>Aceternity 05 · Flip Words Minimalist</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink uppercase">
              ELEVATE YOUR
            </h2>

            {/* Aceternity Style Animated Flip Word */}
            <div className="h-16 sm:h-20 flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWord}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-700 leading-none"
                >
                  {currentWord}.
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-ink-muted max-w-lg">
            Contemporary cuts, pre-shrunk combed cotton, and breathable artisanal linen. Designed from the yarn up to fit Indian heights, shoulders, and chest proportions.
          </p>

          {/* Interactive Fit Switcher Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {FIT_CHIPS.map((chip, idx) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setActiveChip(idx)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  activeChip === idx
                    ? 'bg-[#c6f03d] text-slate-950 shadow-md font-extrabold scale-105'
                    : 'border border-line bg-white/70 text-ink hover:bg-sand'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Link
              href={currentFit.href}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white transition-all hover:bg-slate-800 shadow-md active:scale-95"
            >
              <span>Shop {currentFit.label.split(' ')[1]}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="flex items-center gap-1 text-xs font-bold text-ink-muted">
              <div className="flex text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="ml-1 text-ink font-extrabold">4.9 / 5.0</span>
              <span>(10k+ verified orders)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Image with Chamfered Silhouette */}
        <div className="lg:col-span-5 relative">
          <div
            className="relative aspect-[3/4] w-full overflow-hidden bg-[#e9e6df] shadow-xl transition-all duration-700"
            style={{
              clipPath: 'polygon(36px 0%, 100% 0%, 100% calc(100% - 36px), calc(100% - 36px) 100%, 0% 100%, 0% 36px)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFit.image}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={currentFit.image}
                  alt={currentFit.label}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover object-top"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-white">
              <span className="text-xs font-black tracking-wider uppercase">
                {currentFit.label}
              </span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md">
                100% Cotton & Linen
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
