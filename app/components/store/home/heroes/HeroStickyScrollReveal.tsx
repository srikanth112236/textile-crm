'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Layers, ShieldCheck } from 'lucide-react';

const SECTIONS = [
  {
    id: 'sec-1',
    number: '01',
    title: 'THE ARCHITECTURE OF FIT',
    subtitle: 'Calibrated Dropped Shoulders',
    description: 'We spent 14 months refining shoulder slope angles and chest ease so our oversized tees hang with architectural precision—never sloppy, always sharp.',
    stat: '240 GSM',
    statLabel: 'Combed Heavy Cotton',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=85',
    link: '/products?search=oversized',
  },
  {
    id: 'sec-2',
    number: '02',
    title: 'FRENCH LINEN SOFTNESS',
    subtitle: 'Enzyme-Washed Flax Weaves',
    description: 'Sourced from the Normandy flax fields and enzyme-washed to remove starch stiffness. Maximum thermal airflow for humid and sweltering summer climates.',
    stat: '100% PURE',
    statLabel: 'European Flax Fiber',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85',
    link: '/products?search=linen',
  },
  {
    id: 'sec-3',
    number: '03',
    title: 'INDO-WESTERN HERITAGE',
    subtitle: 'Artisanal Woven Textures',
    description: 'Short kurtas and Nehru waistcoats with jacquard weaves and brass-finished antique buttons. Designed to be styled effortlessly over denim or formal trousers.',
    stat: 'HANDLOOM',
    statLabel: 'Slub Yarn Finish',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85',
    link: '/products?category=ethnic-wear',
  },
];

export function HeroStickyScrollReveal() {
  const [activeStep, setActiveStep] = useState(0);

  const current = SECTIONS[activeStep];

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-line bg-[#fcfbf8] p-6 sm:p-12 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sand/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ink">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            <span>Aceternity 08 · Sticky Fabric Reveal</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink mt-2">
            BEHIND THE CRAFTSMANSHIP
          </h2>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center gap-2">
          {SECTIONS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeStep === idx
                  ? 'bg-ink text-white font-black shadow-sm scale-105'
                  : 'border border-line bg-white text-ink-muted hover:text-ink'
              }`}
            >
              {s.number}. {s.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Section */}
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left Interactive Narrative */}
        <div className="lg:col-span-6 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
                  {current.number}
                </span>
                <span className="h-4 w-px bg-line" />
                <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">
                  {current.subtitle}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                {current.title}
              </h3>

              <p className="text-xs sm:text-sm leading-relaxed text-ink-muted">
                {current.description}
              </p>

              {/* Stat Callout */}
              <div className="inline-flex items-center gap-4 rounded-2xl bg-sand/60 border border-line p-4">
                <div>
                  <p className="text-2xl font-black text-ink">{current.stat}</p>
                  <p className="text-[10px] font-bold text-ink-muted uppercase">{current.statLabel}</p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={current.link}
                  className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white transition-all hover:bg-slate-800 shadow-md active:scale-95"
                >
                  <span>Explore {current.title}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Fluid Reveal Image */}
        <div className="lg:col-span-6 relative">
          <div
            className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden rounded-[28px] bg-[#ebe7df] shadow-lg border border-line"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={current.image}
                  alt={current.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-5 text-white font-mono text-xs font-bold">
              MENTOOS // CRAFTSMANSHIP ARCHIVE 2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
