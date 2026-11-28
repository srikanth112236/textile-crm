'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Flame, Clock } from 'lucide-react';

export function HeroMeteorShowerDark() {
  const meteors = new Array(18).fill(true);

  return (
    <section className="relative overflow-hidden rounded-[36px] bg-[#090a0c] p-6 sm:p-14 text-white shadow-2xl border border-white/10">
      {/* Aceternity Meteor Shower Lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {meteors.map((_, idx) => (
          <span
            key={idx}
            className="absolute top-1/2 left-1/2 h-0.5 w-0.5 rotate-[215deg] rounded-[9999px] bg-slate-400 shadow-[0_0_0_1px_#ffffff10] animate-meteor"
            style={{
              top: `${Math.floor(Math.random() * 100)}%`,
              left: `${Math.floor(Math.random() * 100)}%`,
              animationDelay: `${Math.random() * (0.8 - 0.2) + 0.2}s`,
              animationDuration: `${Math.floor(Math.random() * (10 - 2) + 2)}s`,
            }}
          >
            <div className="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-slate-400 to-transparent" />
          </span>
        ))}
      </div>

      {/* Radial Center Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-4xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em] text-amber-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Aceternity 09 · Midnight Meteor Shower</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white uppercase leading-[1.05]">
          CRAFTED UNDER THE{' '}
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            MIDNIGHT SKY
          </span>
        </h2>

        <p className="mx-auto max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-300">
          Dark washed heavyweight tees, textured charcoal tailoring, and midnight ethnic capsules engineered for after-hours elegance.
        </p>

        {/* Live Midnight Drop Countdown Ticker */}
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-6 py-3 backdrop-blur-md">
          <Clock className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-slate-300">LIMITED NIGHT DROP CLOSES IN:</span>
          <span className="text-sm font-mono font-black text-amber-300 tracking-wider">04H : 18M : 42S</span>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/products?sort=createdAt&order=desc"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>Claim Midnight Drop</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
