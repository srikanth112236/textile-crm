'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Flame, Play } from 'lucide-react';

export function HeroLampGlow() {
  return (
    <section className="relative overflow-hidden rounded-[36px] bg-[#0c0d0e] px-6 py-16 sm:py-24 text-white shadow-2xl border border-white/10">
      {/* 1. Aceternity Lamp Conic Light Beams */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center">
        {/* Left Beam */}
        <motion.div
          initial={{ opacity: 0.5, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute top-0 right-1/2 h-56 w-[30rem] bg-gradient-conic from-amber-400/40 via-transparent to-transparent [--conic-position:from_70deg_at_center_top] blur-xl"
        />

        {/* Right Beam */}
        <motion.div
          initial={{ opacity: 0.5, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute top-0 left-1/2 h-56 w-[30rem] bg-gradient-conic from-transparent via-transparent to-amber-400/40 [--conic-position:from_290deg_at_center_top] blur-xl"
        />

        {/* Center Radiant Glow & Horizontal Light Bar */}
        <div className="absolute top-0 h-48 w-full max-w-2xl bg-amber-500/10 blur-3xl" />
        <div className="absolute top-0 h-px w-2/3 max-w-xl bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
      </div>

      {/* 2. Background Grid Pattern with Radial Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* 3. Hero Content */}
      <div className="relative z-10 mx-auto max-w-4xl text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300 backdrop-blur-md"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Aceternity 01 · Radiant Lamp Spotlight</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]"
        >
          THE NEW STANDARD OF{' '}
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            MODERN MENSWEAR
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300"
        >
          Engineered heavyweight 240 GSM tees, pure French flax linen, and handcrafted Indo-Western kurtas tailored specifically for Indian body builds.
        </motion.p>

        {/* Dual Animated Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2"
        >
          <Link
            href="/products?sort=createdAt&order=desc"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>Explore Collection</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/products?search=linen"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/10"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Watch Campaign Reel</span>
          </Link>
        </motion.div>

        {/* Floating Social Proof Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex items-center justify-center gap-6 pt-6 text-[11px] font-bold text-slate-400"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> 140+ Live Shoppers
          </span>
          <span>·</span>
          <span>⭐ 4.9/5 from 10k+ Buyers</span>
          <span>·</span>
          <span>🚚 Free Express Shipping</span>
        </motion.div>
      </div>
    </section>
  );
}
