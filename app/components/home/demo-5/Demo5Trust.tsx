'use client';

import React from 'react';
import { cinzel, outfit } from './fonts';

const PILLARS = [
  {
    num: 'I',
    title: '240+ GSM Combed Density',
    desc: 'Dense ring-spun yarn that resists distortion and collar baconing. Substantial drape that hangs cleanly without cling.',
  },
  {
    num: 'II',
    title: 'Zero Synthetic Fillers',
    desc: 'Pure botanical fibers: 100% Belgian flax linen, long-staple cotton, and certified botanical lyocell. Zero itchy polyester traps.',
  },
  {
    num: 'III',
    title: 'Doorstep Size Concierge',
    desc: 'If the fit or drape is not bespoke-accurate, our courier brings your replacement directly to your doorstep with zero return friction.',
  },
  {
    num: 'IV',
    title: 'Direct Atelier Dispatch',
    desc: 'Every garment is inspected, hand-steamed, and packed in unbleached kraft envelopes. Dispatched directly from our studio within 24 hours.',
  },
];

export function Demo5Trust() {
  return (
    <section className={`relative bg-[#F4EFEA] text-[#2C241E] py-24 border-b border-[#E3DACD] ${cinzel.variable} ${outfit.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto pb-16 border-b border-[#E3DACD]">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#B85D3B] font-serif font-bold block mb-2">
            Artisanal Manifesto
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#2C241E] tracking-tight">
            Our Material <span className="italic font-normal text-[#B85D3B]">Standard</span>
          </h2>
          <p className="text-xs text-[#6B5C52] font-sans mt-3 max-w-md mx-auto leading-relaxed">
            Menswear engineered without synthetic shortcuts. Every fiber chosen for longevity, comfort, and character.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-12">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.num}
              className="p-8 rounded-t-[3rem] bg-[#EAE2D8] border border-[#E3DACD] hover:border-[#B85D3B]/40 transition-colors duration-300 flex flex-col justify-between"
            >
              <div>
                <span className="font-serif italic text-3xl text-[#B85D3B] block mb-4">
                  {pillar.num}
                </span>
                <h3 className="font-serif text-lg font-normal text-[#2C241E] leading-snug">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-xs text-[#6B5C52] font-sans leading-relaxed pt-6 border-t border-[#D9CFC2] mt-6">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
