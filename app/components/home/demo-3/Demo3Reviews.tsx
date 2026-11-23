'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { plusJakarta, playfair } from './fonts';

const REVIEWS = [
  {
    id: 'rev-01',
    quote:
      'The 280 GSM mineral dye creates a subtle matte depth that photographs with unbelievable texture. The weight keeps the shoulder drop sharp without feeling stiff.',
    author: 'Aarav Mehta',
    location: 'Mumbai',
    garment: '280 GSM Mineral Noir Crewneck',
    fit: 'Size XL · Boxy Oversized',
  },
  {
    id: 'rev-02',
    quote:
      'Finding real Belgian flax linen with this density is virtually impossible elsewhere in India. It drapes with an effortless swagger for rooftop dinners and evening gatherings.',
    author: 'Vikramaditya Rao',
    location: 'Chennai',
    garment: 'Camp-Collar Belgian Flax Shirt',
    fit: 'Size L · Relaxed Daily',
  },
  {
    id: 'rev-03',
    quote:
      'The double forward pleats and extended Gurkha waistband give you the posture of custom Savile Row tailoring. Impeccable craftsmanship at this price tier.',
    author: 'Devansh Singhania',
    location: 'Bengaluru',
    garment: 'Tailored Gurkha Trouser',
    fit: 'Size 32 · High-Rise Fit',
  },
];

export function Demo3Reviews() {
  const [currentIdx, setCurrentIdx] = useState(0);

  const prev = () => setCurrentIdx((c) => (c === 0 ? REVIEWS.length - 1 : c - 1));
  const next = () => setCurrentIdx((c) => (c === REVIEWS.length - 1 ? 0 : c + 1));
  const active = REVIEWS[currentIdx];

  return (
    <section className={`relative bg-[#F5F3EE] text-[#121214] py-24 sm:py-32 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans overflow-hidden`}>
      <div className="max-w-[1300px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-8 border-b border-[#E0DCD4]">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-mono font-bold">
            Patron Testimonials
          </span>
          <span className="font-mono text-xs text-[#78716C]">
            0{currentIdx + 1} / 0{REVIEWS.length}
          </span>
        </div>

        {/* Big Quote */}
        <div className="py-16 sm:py-20 max-w-4xl mx-auto text-center relative">
          <span className="font-serif italic text-8xl text-[#D97706]/20 block leading-none select-none -mb-8">
            “
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="space-y-8"
            >
              <blockquote className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-normal text-[#121214] leading-relaxed">
                {active.quote}
              </blockquote>

              <div className="pt-6 border-t border-[#E0DCD4] inline-flex flex-col items-center">
                <p className="font-serif text-xl font-bold text-[#18181B]">
                  {active.author}
                </p>
                <p className="text-xs text-[#78716C] font-sans mt-1">
                  {active.location} · <span className="text-[#D97706] font-bold">{active.fit}</span>
                </p>
                <p className="font-serif italic text-xs text-[#78716C] mt-1">
                  Verified owner of {active.garment}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-12">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-full border border-[#D6D3D1] hover:border-[#18181B] text-[#121214] bg-white transition-colors flex items-center justify-center text-sm shadow-xs"
              aria-label="Previous quote"
            >
              ←
            </button>
            <div className="flex gap-2">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`h-1.5 transition-all duration-300 rounded-full ${
                    currentIdx === i ? 'w-8 bg-[#18181B]' : 'w-2 bg-[#D6D3D1]'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-12 h-12 rounded-full border border-[#D6D3D1] hover:border-[#18181B] text-[#121214] bg-white transition-colors flex items-center justify-center text-sm shadow-xs"
              aria-label="Next quote"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
