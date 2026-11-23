'use client';

import React from 'react';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const GUARANTEES = [
  {
    code: 'SEC-A1',
    metric: '240+ GSM CERTIFIED MASS',
    desc: 'Dense ring-spun combed cotton yarn with double-needle hems. Retains silhouette integrity and eliminates chest collapse.',
  },
  {
    code: 'SEC-B2',
    metric: 'ZERO SYNTHETIC FILLERS',
    desc: '100% natural botanical fibers: Normandy flax linen, certified long-staple cotton, botanical lyocell. Zero microplastic polyester traps.',
  },
  {
    code: 'SEC-C3',
    metric: 'DOORSTEP SIZE REPLACEMENT',
    desc: '7-day complimentary doorstep replacement. Our courier delivers your updated size directly to your address with zero return paperwork.',
  },
  {
    code: 'SEC-D4',
    metric: 'INSURED ATELIER COD',
    desc: 'Pay safely upon physical delivery. Every order is inspected, hand-steamed, and vacuum-sealed in recyclable unbleached kraft envelopes.',
  },
];

export function Demo2Trust() {
  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-2">
              <span className="w-2 h-2 bg-brand" />
              SYSTEM // 12 · PRODUCTION INTEGRITY
            </div>
            <h2 className="font-syne text-3xl sm:text-5xl font-black uppercase text-ink tracking-tight">
              ATELIER <span className="text-brand">QUALITY PROTOCOL</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 max-w-sm uppercase leading-relaxed">
            Strict manufacturing and patron service benchmarks maintained across all domestic production batches.
          </p>
        </div>

        {/* 4 Protocol Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {GUARANTEES.map((item) => (
            <div
              key={item.code}
              className="border-2 border-ink bg-sand/20 p-6 flex flex-col justify-between"
            >
              <div>
                <span className="bg-ink text-paper font-mono text-[10px] px-2 py-0.5 uppercase font-bold">
                  {item.code}
                </span>
                <h3 className="font-syne text-lg font-bold uppercase tracking-tight text-ink mt-4 leading-snug">
                  {item.metric}
                </h3>
              </div>
              <p className="font-mono text-[11px] text-ink/70 uppercase leading-relaxed pt-6 border-t border-ink/20 mt-6">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
