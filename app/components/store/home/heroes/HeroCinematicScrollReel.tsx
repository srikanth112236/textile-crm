'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Film, Sparkles, Volume2, VolumeX, Eye } from 'lucide-react';

const REEL_FRAMES = [
  {
    id: 'f1',
    chapter: 'SCENE 01',
    title: 'THE OVERSIZED SILHOUETTE',
    fabric: '240 GSM Combed Cotton',
    timecode: '00:01:24',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=85',
    link: '/products?search=oversized',
  },
  {
    id: 'f2',
    chapter: 'SCENE 02',
    title: 'FRENCH LINEN RESORT',
    fabric: '100% Pre-Washed Flax',
    timecode: '00:04:12',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85',
    link: '/products?search=linen',
  },
  {
    id: 'f3',
    chapter: 'SCENE 03',
    title: 'SARTORIAL EVENING CHARCOAL',
    fabric: 'Stretch Tailored Wool-Blend',
    timecode: '00:08:45',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85',
    link: '/products?category=trousers',
  },
  {
    id: 'f4',
    chapter: 'SCENE 04',
    title: 'INDO-WESTERN NOCTURNE',
    fabric: 'Handcrafted Textured Slub',
    timecode: '00:12:30',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85',
    link: '/products?category=ethnic-wear',
  },
];

export function HeroCinematicScrollReel() {
  const [activeFrame, setActiveFrame] = useState(0);
  const [muted, setMuted] = useState(true);

  const current = REEL_FRAMES[activeFrame];

  return (
    <section className="relative overflow-hidden rounded-[36px] bg-[#0d0e11] p-6 sm:p-12 text-white shadow-2xl border border-white/10">
      {/* 1. Top Film Header with Timecode & Sound Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-amber-400">
            <Film className="h-4 w-4" />
          </span>
          <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
            MASTERPIECE 06 · CINEMATIC 35MM RUNWAY REEL
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-400">
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            REC
          </span>
          <span>TIMECODE {current.timecode}</span>
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Toggle ambient sound"
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* 2. Main Cinematic Screen Grid */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Narrative */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
              {current.chapter} // 2026 CAMPAIGN
            </span>
            <AnimatePresence mode="wait">
              <motion.h2
                key={current.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35 }}
                className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.08]"
              >
                {current.title}
              </motion.h2>
            </AnimatePresence>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-slate-300 max-w-md">
            Engineered with high-density fibers and tailored for unhindered motion. Every frame represents months of fabric testing and ergonomic pattern cutting.
          </p>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase text-slate-400">Fabric Composition</p>
              <p className="text-xs font-bold text-white mt-0.5">{current.fabric}</p>
            </div>
            <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
              In Stock
            </span>
          </div>

          <div className="pt-2">
            <Link
              href={current.link}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:bg-amber-300 shadow-lg shadow-amber-400/20 active:scale-95"
            >
              <span>Explore Scene Look</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right 35mm Film Stage & Strip */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Cinematic Viewport */}
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[26px] border border-white/15 bg-black shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={current.image}
                  alt={current.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover object-top"
                />
              </motion.div>
            </AnimatePresence>

            {/* Cinematic Letterbox Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Bottom Screen Overlay */}
            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs font-mono font-bold text-white/90">
              <span>ISO 400 · 35MM PRIME · 1/250s</span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <Eye className="h-3.5 w-3.5" /> High-Resolution Fit
              </span>
            </div>
          </div>

          {/* Film Strip Thumbnails (Scrub Bar) */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {REEL_FRAMES.map((frame, idx) => (
              <button
                key={frame.id}
                type="button"
                onClick={() => setActiveFrame(idx)}
                className={`group relative h-16 w-24 sm:h-20 sm:w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  idx === activeFrame
                    ? 'border-amber-400 scale-105 shadow-md shadow-amber-400/25 ring-2 ring-amber-400/30'
                    : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                }`}
              >
                <Image src={frame.image} alt={frame.title} fill className="object-cover object-top" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors" />
                <span className="absolute bottom-1 left-1.5 text-[9px] font-mono font-extrabold text-white drop-shadow-md">
                  {frame.chapter}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
