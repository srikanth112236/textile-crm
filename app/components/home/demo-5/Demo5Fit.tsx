'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cinzel, outfit } from './fonts';

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

export function Demo5Fit() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeFit = FITS[activeIdx];

  return (
    <section className={`relative bg-[#F4EFEA] text-[#2C241E] py-24 border-b border-[#E3DACD] ${cinzel.variable} ${outfit.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#E3DACD]">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B85D3B] font-serif font-bold block mb-2">
              Pattern Discipline
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#2C241E] tracking-tight">
              Shop by <span className="italic font-normal text-[#B85D3B]">Silhouette</span>
            </h2>
          </div>
          <p className="text-xs text-[#6B5C52] font-sans max-w-sm leading-relaxed">
            Every garment begins with a pattern study designed around masculine anatomy and natural fabric drape.
          </p>
        </div>

        {/* 4 Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-12">
          {FITS.map((fit, idx) => (
            <button
              key={fit.id}
              onClick={() => setActiveIdx(idx)}
              className={`p-6 text-left rounded-t-3xl border transition-all duration-300 ${
                activeIdx === idx
                  ? 'bg-[#B85D3B] text-[#F4EFEA] border-[#B85D3B] shadow-md'
                  : 'bg-[#EAE2D8] border-[#E3DACD] hover:border-[#B85D3B]/40 text-[#2C241E]'
              }`}
            >
              <span className={`text-[10px] tracking-widest uppercase block mb-1 font-serif ${
                activeIdx === idx ? 'text-[#F4EFEA]/80' : 'text-[#B85D3B]'
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
        <div className="mt-8 p-8 sm:p-12 rounded-t-[3rem] bg-[#EAE2D8] border border-[#E3DACD] flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs font-serif uppercase tracking-widest text-[#B85D3B] font-bold">
              {activeFit.proportions}
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#2C241E]">
              The {activeFit.name} Drape
            </h3>
            <p className="text-sm text-[#6B5C52] font-sans leading-relaxed">
              {activeFit.desc}
            </p>
          </div>

          <div>
            <Link
              href={`/products?category=${activeFit.category}`}
              className="px-8 py-4 rounded-full bg-[#B85D3B] hover:bg-[#9F4B2D] text-[#F4EFEA] font-sans text-xs tracking-widest uppercase font-semibold transition-all shadow-md block text-center"
            >
              Explore {activeFit.name} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
