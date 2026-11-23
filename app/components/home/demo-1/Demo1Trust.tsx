'use client';

import React from 'react';
import { fraunces, manrope } from './fonts';

const PILLARS = [
  {
    num: 'I',
    title: '240+ GSM Heavyweight Combed Cotton',
    desc: 'Woven with dense ring-spun yarn that resists distortion and collar baconing. Substantial drape that hangs cleanly without cling.',
  },
  {
    num: 'II',
    title: 'Zero Synthetic Micro-Fillers',
    desc: 'Pure breathable botanical fibers: 100% Belgian flax linen, long-staple cotton, and certified botanical lyocell. Zero itchy polyester traps.',
  },
  {
    num: 'III',
    title: '7-Day Doorstep Size Exchange',
    desc: 'If the shoulder drop or waist fit is not bespoke-accurate, our courier brings your replacement right to your doorstep at zero cost.',
  },
  {
    num: 'IV',
    title: 'Insured Cash on Delivery & Direct Dispatch',
    desc: 'Every garment is inspected, hand-steamed, and packed in unbleached kraft envelopes. Dispatched directly from our atelier within 24 hours.',
  },
];

export function Demo1Trust() {
  return (
    <section className={`relative bg-paper py-24 sm:py-32 border-b border-line/60 ${manrope.variable} ${fraunces.variable} font-sans overflow-hidden`}>
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto pb-16 border-b border-line">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">Chapter 12</span>
            <span className="w-8 h-px bg-ink/20" />
            <span className="font-mono text-[10px] tracking-widest text-brand uppercase">The Mentoos Standard</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-ink tracking-tight">
            Our Material <span className="italic font-normal">Manifesto</span>
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-ink/60 font-sans tracking-tight max-w-md mx-auto">
            Menswear engineered without compromise. Every millimeter of seam and gram of fabric serves a purpose.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-12">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.num}
              className="relative p-6 sm:p-8 bg-sand/20 border border-line flex flex-col justify-between group hover:border-ink/40 transition-colors duration-300"
            >
              <div>
                <span className="font-serif italic text-3xl text-brand block mb-4">
                  {pillar.num}
                </span>
                <h3 className="font-serif text-lg font-normal text-ink leading-snug mb-3">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-xs text-ink/60 font-sans leading-relaxed tracking-tight pt-4 border-t border-line/60">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
