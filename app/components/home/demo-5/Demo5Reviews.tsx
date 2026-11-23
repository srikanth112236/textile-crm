'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cinzel, outfit } from './fonts';

const REVIEWS = [
  {
    id: 'rev-01',
    quote:
      'The pure Belgian flax linen is the best I have worn in India. Even in 36°C tropical humidity, it remains breezy and crisp. The camp collar holds its posture effortlessly.',
    author: 'Vikramaditya Rao',
    location: 'Chennai',
    garment: 'Camp-Collar Belgian Flax Shirt',
    fit: 'Size L · Relaxed Daily Fit',
  },
  {
    id: 'rev-02',
    quote:
      'The 280 GSM heavy jersey has an unmistakable architectural presence. The dropped shoulder and cropped square hem pair gorgeously with loose pleated trousers.',
    author: 'Aarav Mehta',
    location: 'Mumbai',
    garment: '280 GSM Heavy Boxy Crewneck',
    fit: 'Size XL · Boxy Oversized',
  },
  {
    id: 'rev-03',
    quote:
      'Authentic Gurkha waist adjusters that eliminate belts entirely. The deep forward pleats create an elegant, weighted fall over leather sandals.',
    author: 'Devansh Singhania',
    location: 'Bengaluru',
    garment: 'Double-Pleated Tailored Gurkha',
    fit: 'Size 32 · High-Rise Fit',
  },
];

export function Demo5Reviews() {
  const [currentIdx, setCurrentIdx] = useState(0);

  const prev = () => setCurrentIdx((c) => (c === 0 ? REVIEWS.length - 1 : c - 1));
  const next = () => setCurrentIdx((c) => (c === REVIEWS.length - 1 ? 0 : c + 1));
  const active = REVIEWS[currentIdx];

  return (
    <section className={`relative bg-[#EBE4DC] text-[#2C241E] py-24 sm:py-32 border-b border-[#E3DACD] ${cinzel.variable} ${outfit.variable} font-sans overflow-hidden`}>
      <div className="max-w-[1300px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-8 border-b border-[#D9CFC2]">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#B85D3B] font-serif font-bold">
            Patron Testimonials
          </span>
          <span className="font-serif italic text-sm text-[#6B5C52]">
            0{currentIdx + 1} / 0{REVIEWS.length}
          </span>
        </div>

        {/* Big Quote */}
        <div className="py-16 sm:py-20 max-w-4xl mx-auto text-center relative">
          <span className="font-serif italic text-8xl text-[#B85D3B]/20 block leading-none select-none -mb-8">
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
              <blockquote className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-normal text-[#2C241E] leading-relaxed">
                {active.quote}
              </blockquote>

              <div className="pt-6 border-t border-[#D9CFC2] inline-flex flex-col items-center">
                <p className="font-serif text-xl font-bold text-[#B85D3B]">
                  {active.author}
                </p>
                <p className="text-xs text-[#6B5C52] font-sans mt-1">
                  {active.location} · <span className="text-[#2C241E]">{active.fit}</span>
                </p>
                <p className="font-serif italic text-xs text-[#6B5C52] mt-1">
                  Verified owner of {active.garment}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6 mt-12">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-full border border-[#D9CFC2] hover:border-[#B85D3B] text-[#2C241E] hover:text-[#B85D3B] bg-[#F4EFEA] transition-colors flex items-center justify-center text-sm"
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
                    currentIdx === i ? 'w-8 bg-[#B85D3B]' : 'w-2 bg-[#D9CFC2]'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-12 h-12 rounded-full border border-[#D9CFC2] hover:border-[#B85D3B] text-[#2C241E] hover:text-[#B85D3B] bg-[#F4EFEA] transition-colors flex items-center justify-center text-sm"
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
