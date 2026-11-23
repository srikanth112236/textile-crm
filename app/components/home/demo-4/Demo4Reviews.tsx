'use client';

import React, { useState } from 'react';
import { bebasNeue, dmSans } from './fonts';

const REVIEWS = [
  {
    id: 'rev-01',
    score: '5.0 / 5.0',
    patron: 'AARAV MEHTA',
    city: 'MUMBAI',
    garment: '280 GSM MINERAL NOIR CREWNECK',
    fit: 'SIZE XL · BOXY OVERSIZED',
    quote:
      'The 280 GSM jersey holds its structured rectangular shoulder even through humid commutes. The fabric weight refuses to cling and keeps its shape after countless washes.',
  },
  {
    id: 'rev-02',
    score: '5.0 / 5.0',
    patron: 'VIKRAMADITYA RAO',
    city: 'CHENNAI',
    garment: 'BELGIAN LINEN CAMP SHIRT',
    fit: 'SIZE L · RELAXED DAILY',
    quote:
      'Pure Normandy flax with incredible air permeability. It drapes naturally with zero synthetic static. Mentoos sets a new standard for Indian menswear.',
  },
  {
    id: 'rev-03',
    score: '4.9 / 5.0',
    patron: 'DEVANSH SINGHANIA',
    city: 'BENGALURU',
    garment: 'DOUBLE-PLEATED TAILORED GURKHA',
    fit: 'SIZE 32 · HIGH-RISE FIT',
    quote:
      'The extended waistband tabs eliminate the need for a belt. The forward pleats create an architectural break over boots or loafers. Superb construction.',
  },
];

export function Demo4Reviews() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeReview = REVIEWS[activeIdx];

  return (
    <section className={`relative bg-sand/20 py-20 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              PATRON VERIFICATION
            </span>
            <h2 className="font-bebas text-5xl sm:text-7xl text-ink uppercase tracking-tight">
              PATRON <span className="text-brand">DISPATCH AUDITS</span>
            </h2>
          </div>
          <p className="font-sans text-xs text-ink/70 max-w-sm font-medium leading-relaxed uppercase">
            Unfiltered feedback from verified buyers across India.
          </p>
        </div>

        {/* Big Review Terminal Box */}
        <div className="mt-10 border-2 border-ink bg-paper p-8 sm:p-12">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-3 pb-6 border-b-2 border-ink">
            {REVIEWS.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => setActiveIdx(idx)}
                className={`px-4 py-2 font-mono text-xs uppercase font-bold transition-all border-2 ${
                  activeIdx === idx
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-paper text-ink border-ink/30 hover:border-ink'
                }`}
              >
                PATRON 0{idx + 1} · {r.score}
              </button>
            ))}
          </div>

          <div className="pt-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-ink/60 uppercase">
              <span className="font-bold text-brand">{activeReview.garment}</span>
              <span>{activeReview.fit}</span>
            </div>

            <blockquote className="font-bebas text-3xl sm:text-5xl text-ink uppercase leading-snug tracking-wide">
              “{activeReview.quote}”
            </blockquote>

            <div className="pt-6 border-t border-ink/20 flex items-center justify-between font-mono text-xs">
              <span className="font-black text-ink">{activeReview.patron} · {activeReview.city}</span>
              <span className="text-emerald-700 font-bold uppercase">VERIFIED PURCHASE ✓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
