'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { plusJakarta, playfair } from './fonts';

const FITS = [
  {
    id: 'f-boxy',
    name: 'Boxy Oversized',
    drape: 'Voluminous & Dropped',
    desc: 'Structured shoulder line with generous chest width. The heavy 280 GSM cotton falls straight from the shoulders without contouring the midsection.',
    proportions: 'Chest: +12cm ease · Shoulder drop: +4.5cm · Hem: Square cropped',
    category: 't-shirts',
  },
  {
    id: 'f-relaxed',
    name: 'Relaxed Daily',
    drape: 'Natural & Balanced',
    desc: 'The timeless standard. Cut with moderate chest ease for an organic, flattering fall that pairs seamlessly with denim or tailored trousers.',
    proportions: 'Chest: +6cm ease · Shoulder drop: +2.0cm · Hem: Natural straight',
    category: 'shirts',
  },
  {
    id: 'f-tailored',
    name: 'Slim Tailored',
    drape: 'Sculpted & Contoured',
    desc: 'Higher armholes and tapered waistlines. Crafted for sharp workplace layering, formal gatherings, or clean tucking into Gurkha trousers.',
    proportions: 'Chest: +2cm ease · Shoulder: Natural point · Back yoke darting',
    category: 'shirts',
  },
  {
    id: 'f-utility',
    name: 'Athletic Utility',
    drape: 'Ergonomic & Articulated',
    desc: 'Engineered for dynamic mobility. Diamond crotch gussets, flex waistband adjusters, and articulated knee pleats.',
    proportions: 'Waist: Dual tab buckle · Crotch: Diamond gusset · Knee: Dual dart',
    category: 'pants',
  },
];

export function Demo3Fit() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeFit = FITS[activeIdx];

  return (
    <section className={`relative bg-[#FAF9F6] text-[#121214] py-24 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#E7E5E0]">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold block mb-2">
              Pattern Discipline
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#121214] tracking-tight">
              Shop by <span className="italic font-normal text-[#78716C]">Silhouette</span>
            </h2>
          </div>
          <p className="text-xs text-[#57534E] font-sans max-w-sm leading-relaxed">
            Every garment begins with a pattern study designed around masculine anatomy and natural fabric drape.
          </p>
        </div>

        {/* 4 Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-12">
          {FITS.map((fit, idx) => (
            <button
              key={fit.id}
              onClick={() => setActiveIdx(idx)}
              className={`p-6 text-left rounded-2xl border transition-all duration-300 ${
                activeIdx === idx
                  ? 'bg-[#18181B] text-[#FAF9F6] border-[#18181B] shadow-md'
                  : 'bg-[#F5F3EE] border-[#E7E5E0] hover:border-[#D97706]/40 text-[#121214]'
              }`}
            >
              <span className={`text-[10px] font-mono tracking-widest uppercase block mb-1 font-bold ${
                activeIdx === idx ? 'text-[#FBBF24]' : 'text-[#D97706]'
              }`}>
                0{idx + 1} · {fit.drape}
              </span>
              <h3 className="font-serif text-xl font-normal">
                {fit.name}
              </h3>
            </button>
          ))}
        </div>

        {/* Detail Panel */}
        <div className="mt-8 p-8 sm:p-12 rounded-3xl bg-[#F5F3EE] border border-[#E7E5E0] flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-[#D97706] font-bold">
              {activeFit.proportions}
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#121214]">
              The {activeFit.name} Profile
            </h3>
            <p className="text-sm text-[#57534E] font-sans leading-relaxed">
              {activeFit.desc}
            </p>
          </div>

          <div>
            <Link
              href={`/products?category=${activeFit.category}`}
              className="px-8 py-4 rounded-full bg-[#18181B] hover:bg-[#D97706] text-[#FAF9F6] font-mono text-xs uppercase font-bold tracking-widest transition-all shadow-md block text-center"
            >
              Explore {activeFit.name} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
