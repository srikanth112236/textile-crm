'use client';

import React from 'react';
import { plusJakarta, playfair } from './fonts';

const PILLARS = [
  {
    num: 'I',
    title: '240+ GSM Combed Density',
    desc: 'Dense ring-spun jersey woven to resist neck sagging and chest clinging. Holds its deliberate architectural drape indefinitely.',
  },
  {
    num: 'II',
    title: 'Zero Synthetic Microfibers',
    desc: 'Pure botanical luxury: 100% Belgian flax linen, long-staple combed cotton, and plant-derived lyocell. Completely breathable in Indian humidity.',
  },
  {
    num: 'III',
    title: 'Doorstep Size Concierge',
    desc: 'If the fit or drape does not surpass your expectation, our courier arrives at your doorstep with an alternate size at zero surcharge.',
  },
  {
    num: 'IV',
    title: 'Direct Atelier Dispatch',
    desc: 'Every garment is hand-steamed, quality audited, and packed in luxury unbleached boxes. Insured Cash on Delivery across 19,000+ pincodes.',
  },
];

export function Demo3Trust() {
  return (
    <section className={`relative bg-[#FAF9F6] text-[#121214] py-24 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto pb-16 border-b border-[#E7E5E0]">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold block mb-2">
            Uncompromising Standards
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#121214] tracking-tight">
            The Studio <span className="italic font-normal text-[#78716C]">Commitment</span>
          </h2>
          <p className="text-xs text-[#57534E] font-sans mt-3 max-w-md mx-auto leading-relaxed">
            Every garment represents countless hours of pattern grading, yarn selection, and fabric testing.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-12">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.num}
              className="p-8 rounded-3xl bg-[#F5F3EE] border border-[#E7E5E0] hover:border-[#D97706]/40 transition-colors duration-300 flex flex-col justify-between shadow-xs"
            >
              <div>
                <span className="font-serif italic text-3xl text-[#D97706] block mb-4">
                  {pillar.num}
                </span>
                <h3 className="font-serif text-xl font-normal text-[#121214] leading-snug">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-xs text-[#78716C] font-sans leading-relaxed pt-6 border-t border-[#E0DCD4] mt-6">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
