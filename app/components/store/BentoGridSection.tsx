'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Flame, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BentoGridSection() {
  return (
    <section className="py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Curated High Fashion
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            MENTOOS EDITORIAL LOOKBOOK
          </h2>
        </div>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[240px] sm:auto-rows-[280px]">
        {/* Tile 1: Large Featured Card (Spans 2 cols, 2 rows) */}
        <Link 
          href="/products?category=t-shirts&search=oversized" 
          className="md:col-span-2 md:row-span-2 group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <Image
            src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80"
            alt="Oversized T-Shirts Collection"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 66vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-6 sm:p-8 flex flex-col justify-end text-white">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950 w-max uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5" />
              HOT TRENDING
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight group-hover:text-amber-400 transition-colors">
              THE OVERSIZED REVOLUTION
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1 line-clamp-2">
              Heavyweight 240 GSM combed cotton with drop-shoulder silhouette built for ultimate streetwear confidence.
            </p>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-400 gap-2">
              <span>EXPLORE OVERSIZED TEES</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Tile 2: Ethnic Wear Card (Spans 1 col, 2 rows) */}
        <Link 
          href="/products?category=ethnic-wear" 
          className="md:col-span-1 md:row-span-2 group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <Image
            src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=80"
            alt="Ethnic & Festive Kurtas"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent p-6 flex flex-col justify-end text-white">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 w-max mb-2">
              FESTIVE SPECIAL
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight group-hover:text-amber-400 transition-colors">
              DESIGNER KURTAS & NEHRU JACKETS
            </h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              Handcrafted pure linen kurtas and woven jacquard waistcoats.
            </p>
            <div className="mt-3 flex items-center text-xs font-bold text-amber-400 gap-1.5">
              <span>SHOP ETHNIC</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Tile 3: Cargo Joggers Card (Spans 2 cols, 1 row) */}
        <Link 
          href="/products?category=joggers" 
          className="md:col-span-2 md:row-span-1 group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl"
        >
          <Image
            src="https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80"
            alt="Cargo Joggers Collection"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, 66vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent p-6 flex flex-col justify-center text-white">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">
              UTILITY STREETWEAR
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight group-hover:text-amber-400 transition-colors">
              MULTI-POCKET CARGO JOGGERS
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mt-1">
              Reinforced stitching, elastic drawstrings, and deep 6-pocket layout.
            </p>
          </div>
        </Link>

        {/* Tile 4: Linen Shirts Card (Spans 1 col, 1 row) */}
        <Link 
          href="/products?category=shirts&search=linen" 
          className="md:col-span-1 md:row-span-1 group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-900"
        >
          <Image
            src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80"
            alt="Linen Shirts"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-70"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 flex flex-col justify-end text-white">
            <h3 className="text-lg font-extrabold tracking-tight group-hover:text-amber-400 transition-colors">
              PURE LINEN SHIRTS
            </h3>
            <span className="text-[11px] font-bold text-amber-400 mt-0.5">
              FLAT 20% OFF
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
