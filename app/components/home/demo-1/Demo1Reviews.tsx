'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fraunces, manrope } from './fonts';

interface Review {
  id: string;
  quote: string;
  author: string;
  location: string;
  heightWeight: string;
  purchased: string;
  rating: number;
}

const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    quote:
      'The 240 GSM heavy jersey drapes without clinging to the body. It holds its structured shoulder even after twenty washes. Finding an Indian menswear brand with this caliber of silhouette discipline is rare.',
    author: 'Aarav Mehta',
    location: 'Bandra West, Mumbai',
    heightWeight: '6’1” · Size XL · Boxy Fit',
    purchased: 'Heavyweight Supima Crewneck · Natural Oat',
    rating: 5,
  },
  {
    id: 'rev-2',
    quote:
      'The Belgian linen is cool to the touch and breathes effortlessly in Chennai heat. The relaxed drop and subtle collar stance elevate simple trousers into an understated statement.',
    author: 'Vikramaditya Rao',
    location: 'Alwarpet, Chennai',
    heightWeight: '5’10” · Size L · Relaxed Fit',
    purchased: 'Camp-Collar Belgian Linen Shirt · Olive',
    rating: 5,
  },
  {
    id: 'rev-3',
    quote:
      'No loud logos, no artificial polyester sheen. Just authentic fabric weight, immaculate double-needle hems, and proportions that actually flatter South Asian body frames.',
    author: 'Devansh Singhania',
    location: 'Indiranagar, Bengaluru',
    heightWeight: '5’11” · Size M · Structured Fit',
    purchased: 'Pleated Minimalist Chino · Deep Charcoal',
    rating: 5,
  },
];

export function Demo1Reviews() {
  const [currentIdx, setCurrentIdx] = useState(0);

  const prev = () => setCurrentIdx((c) => (c === 0 ? REVIEWS.length - 1 : c - 1));
  const next = () => setCurrentIdx((c) => (c === REVIEWS.length - 1 ? 0 : c + 1));
  const active = REVIEWS[currentIdx];

  return (
    <section className={`relative bg-sand/30 py-24 sm:py-36 border-b border-line/60 ${manrope.variable} ${fraunces.variable} font-sans overflow-hidden`}>
      <div className="max-w-[1300px] mx-auto px-6 sm:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-8 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">Chapter 09</span>
            <span className="w-8 h-px bg-ink/20" />
            <span className="font-mono text-[10px] tracking-widest text-brand uppercase">Patron Testimonials</span>
          </div>
          <div className="font-mono text-[11px] tracking-widest text-ink/50">
            0{currentIdx + 1} / 0{REVIEWS.length}
          </div>
        </div>

        {/* Giant Quote Display */}
        <div className="py-16 sm:py-24 max-w-4xl mx-auto text-center relative">
          <span className="font-serif text-8xl sm:text-9xl text-ink/10 select-none block leading-none font-italic -mb-10 sm:-mb-14">
            “
          </span>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <blockquote className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-light text-ink leading-relaxed tracking-tight">
                {active.quote}
              </blockquote>

              <div className="pt-6 border-t border-line/40 inline-flex flex-col items-center">
                <p className="font-sans font-medium text-sm text-ink tracking-wide uppercase">
                  {active.author}
                </p>
                <p className="font-mono text-[11px] text-ink/50 mt-1">
                  {active.location} · <span className="text-brand">{active.heightWeight}</span>
                </p>
                <p className="font-serif italic text-xs text-ink/60 mt-1">
                  Verified patron of {active.purchased}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-6 mt-12">
            <button
              onClick={prev}
              className="w-12 h-12 rounded-full border border-line bg-paper/80 hover:bg-ink hover:text-paper hover:border-ink transition-all duration-300 flex items-center justify-center text-xs font-mono"
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
                    currentIdx === i ? 'w-8 bg-ink' : 'w-2 bg-ink/20'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-12 h-12 rounded-full border border-line bg-paper/80 hover:bg-ink hover:text-paper hover:border-ink transition-all duration-300 flex items-center justify-center text-xs font-mono"
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
