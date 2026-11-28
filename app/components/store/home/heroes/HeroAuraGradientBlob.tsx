'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Sun, Moon, Layers } from 'lucide-react';

const MOODS = {
  day: {
    title: 'DAYLIGHT LINEN CAPSULE',
    subtitle: 'Airy French Flax & Summer Cuban Collars',
    tag: 'TROPICAL RESORT',
    color: 'from-amber-400 to-yellow-500',
    blob1: 'bg-amber-400/30',
    blob2: 'bg-emerald-400/25',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85',
    link: '/products?search=linen',
    desc: 'Unbleached natural linen engineered to circulate cool ocean air during scorching peak daylight temperatures.',
  },
  night: {
    title: 'NOCTURNE STREETWEAR',
    subtitle: '240 GSM Dropped Tees & Utility Cargos',
    tag: 'AFTER-HOURS LUXURY',
    color: 'from-violet-400 to-fuchsia-500',
    blob1: 'bg-violet-600/30',
    blob2: 'bg-rose-500/25',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=85',
    link: '/products?search=oversized',
    desc: 'Deep jet black combed cotton paired with 6-pocket cargo twill pants designed to stand out under urban street lamps.',
  },
};

export function HeroAuraGradientBlob() {
  const [mood, setMood] = useState<'day' | 'night'>('day');

  const current = MOODS[mood];

  return (
    <section className="relative overflow-hidden rounded-[36px] bg-[#0f1115] p-6 sm:p-12 text-white shadow-2xl border border-white/10">
      {/* 21st.dev Morphing Liquid Aura Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.25, 0.9, 1],
          }}
          transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
          className={`absolute -top-24 -left-20 h-96 w-96 rounded-full blur-[90px] transition-colors duration-1000 ${current.blob1}`}
        />
        <motion.div
          animate={{
            x: [0, -70, 50, 0],
            y: [0, 50, -30, 0],
            scale: [1, 0.85, 1.2, 1],
          }}
          transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
          className={`absolute -bottom-24 -right-20 h-96 w-96 rounded-full blur-[90px] transition-colors duration-1000 ${current.blob2}`}
        />
      </div>

      <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Narrative */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>21st.dev 10 · Liquid Aura Mesh</span>
            </span>

            {/* Interactive Day/Night Mood Toggle */}
            <div className="flex items-center rounded-full border border-white/20 bg-white/5 p-1 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setMood('day')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                  mood === 'day' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sun className="h-3 w-3" /> Day Resort
              </button>
              <button
                type="button"
                onClick={() => setMood('night')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                  mood === 'night' ? 'bg-violet-500 text-white font-black shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Moon className="h-3 w-3" /> Night Utility
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mood}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-3"
            >
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-amber-300">
                {current.tag}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-[1.05]">
                {current.title}
              </h2>
              <p className="text-sm font-semibold text-slate-300">
                {current.subtitle}
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-400 max-w-lg">
                {current.desc}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="pt-2">
            <Link
              href={current.link}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:bg-[#c6f03d] shadow-xl active:scale-95"
            >
              <span>Shop This Mood</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Frosted Aura Card */}
        <div className="lg:col-span-6 relative">
          <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden rounded-[28px] border border-white/20 bg-white/5 backdrop-blur-xl p-3 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.image}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45 }}
                className="relative h-full w-full overflow-hidden rounded-[22px]"
              >
                <Image
                  src={current.image}
                  alt={current.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono font-bold text-white">
                  <span>LIVE PALETTE MORPH</span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 backdrop-blur-md">
                    2026 DROP
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
