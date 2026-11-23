'use client';

import React from 'react';
import { bebasNeue, dmSans } from './fonts';

const GUARANTEES = [
  {
    num: '01',
    title: '240+ GSM CERTIFIED DENSITY',
    desc: 'Dense ring-spun combed cotton yarn with reinforced double-needle hems. Retains its architectural drape without sagging or stretching.',
  },
  {
    num: '02',
    title: 'ZERO SYNTHETIC FILLERS',
    desc: '100% pure botanical fibers: Normandy flax linen, certified long-staple cotton, botanical lyocell. Zero itchy polyester traps.',
  },
  {
    num: '03',
    title: 'DOORSTEP SIZE REPLACEMENT',
    desc: '7-day complimentary doorstep replacement. Our courier brings your replacement directly to your door at zero extra charge.',
  },
  {
    num: '04',
    title: 'INSURED ATELIER COD',
    desc: 'Pay safely upon physical delivery. Every garment is inspected, hand-steamed, and packed in recyclable unbleached kraft envelopes.',
  },
];

export function Demo4Trust() {
  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              QUALITY BENCHMARKS
            </span>
            <h2 className="font-bebas text-5xl sm:text-7xl text-ink uppercase tracking-tight">
              RUNWAY <span className="text-brand">STANDARDS</span>
            </h2>
          </div>
          <p className="font-sans text-xs text-ink/70 max-w-sm font-medium leading-relaxed uppercase">
            Strict manufacturing benchmarks maintained across all domestic production batches.
          </p>
        </div>

        {/* 4 Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {GUARANTEES.map((item) => (
            <div
              key={item.num}
              className="border-2 border-ink bg-sand/20 p-6 flex flex-col justify-between"
            >
              <div>
                <span className="bg-brand text-paper font-mono text-[10px] px-2 py-0.5 uppercase font-black">
                  RULE {item.num}
                </span>
                <h3 className="font-bebas text-2xl uppercase tracking-wide text-ink mt-4">
                  {item.title}
                </h3>
              </div>
              <p className="font-mono text-xs text-ink/70 uppercase leading-relaxed pt-6 border-t border-ink/20 mt-6">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
