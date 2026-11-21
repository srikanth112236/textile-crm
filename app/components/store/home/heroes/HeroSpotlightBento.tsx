'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Flame, Eye } from 'lucide-react';

export function HeroSpotlightBento() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="group/spotlight relative overflow-hidden rounded-[36px] bg-[#121417] p-6 sm:p-10 text-white shadow-2xl border border-white/10"
    >
      {/* 21st.dev Spotlight Flashlight Beam that tracks mouse cursor */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(198, 240, 61, 0.15), transparent 45%)`,
        }}
      />

      {/* Header Tag */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c6f03d]">
            <Sparkles className="h-3 w-3 text-[#c6f03d]" /> 21st.dev 03 · Spotlight Cursor Bento
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 text-white">
            THE ARCHITECTURAL EDIT
          </h2>
        </div>

        <Link
          href="/products"
          className="text-xs font-bold text-slate-300 hover:text-[#c6f03d] transition-colors flex items-center gap-1.5"
        >
          Explore All Categories <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[240px]">
        {/* Tile 1: Oversized Streetwear (Spans 8 cols) */}
        <Link
          href="/products?search=oversized"
          className="md:col-span-8 group relative rounded-[28px] overflow-hidden border border-white/10 bg-[#1a1d24] p-6 flex flex-col justify-end transition-all duration-300 hover:border-[#c6f03d]/50"
        >
          <Image
            src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80"
            alt="Oversized T-Shirts"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#c6f03d] px-2.5 py-0.5 text-[10px] font-black text-slate-950 uppercase tracking-wider">
              <Flame className="h-3 w-3" /> Trending Drop
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-[#c6f03d] transition-colors">
              Heavyweight 240 GSM Dropped Tees
            </h3>
            <p className="text-xs text-slate-300 max-w-md line-clamp-1">
              Dense combed cotton yarns built to maintain boxy structure after endless machine cycles.
            </p>
          </div>
        </Link>

        {/* Tile 2: Pure French Linen (Spans 4 cols) */}
        <Link
          href="/products?search=linen"
          className="md:col-span-4 group relative rounded-[28px] overflow-hidden border border-white/10 bg-[#1a1d24] p-6 flex flex-col justify-end transition-all duration-300 hover:border-[#c6f03d]/50"
        >
          <Image
            src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80"
            alt="French Linen"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-extrabold text-[#c6f03d] uppercase tracking-wider">
              Breeze Series
            </span>
            <h3 className="text-xl font-extrabold text-white group-hover:text-[#c6f03d] transition-colors">
              Pure Flax Linen
            </h3>
            <p className="text-xs text-slate-300">Resort shirts & Cuban collars.</p>
          </div>
        </Link>

        {/* Tile 3: Festive Ethnic Indo-Western (Spans 5 cols) */}
        <Link
          href="/products?category=ethnic-wear"
          className="md:col-span-5 group relative rounded-[28px] overflow-hidden border border-white/10 bg-[#1a1d24] p-6 flex flex-col justify-end transition-all duration-300 hover:border-[#c6f03d]/50"
        >
          <Image
            src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80"
            alt="Ethnic Wear"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
              Artisanal Craft
            </span>
            <h3 className="text-xl font-extrabold text-white group-hover:text-[#c6f03d] transition-colors">
              Short Kurtas & Waistcoats
            </h3>
            <p className="text-xs text-slate-300">Woven jacquards and textured slub.</p>
          </div>
        </Link>

        {/* Tile 4: Cargo Pants & Joggers (Spans 7 cols) */}
        <Link
          href="/products?category=joggers"
          className="md:col-span-7 group relative rounded-[28px] overflow-hidden border border-white/10 bg-[#1a1d24] p-6 flex flex-col justify-end transition-all duration-300 hover:border-[#c6f03d]/50"
        >
          <Image
            src="https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80"
            alt="Cargo Joggers"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-extrabold text-[#c6f03d] uppercase tracking-wider">
              Utility Spec
            </span>
            <h3 className="text-2xl font-extrabold text-white group-hover:text-[#c6f03d] transition-colors">
              Multi-Pocket Cargo Joggers
            </h3>
            <p className="text-xs text-slate-300">Heavy twill weave with 6-pocket functional layout.</p>
          </div>
        </Link>
      </div>
    </section>
  );
}
