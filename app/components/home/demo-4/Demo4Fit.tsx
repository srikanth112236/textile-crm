'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { bebasNeue, dmSans } from './fonts';

const FITS = [
  {
    id: 'f-boxy',
    name: 'BOXY OVERSIZED',
    drop: '+4.5CM DROP SHOULDER',
    ease: '+12CM CHEST EASE',
    category: 't-shirts',
    desc: 'Engineered for a wide rectangular drape. Fabric drops perpendicular from the shoulder tips with zero contouring around the midsection.',
  },
  {
    id: 'f-relaxed',
    name: 'RELAXED DAILY',
    drop: '+2.0CM BALANCED DROP',
    ease: '+6CM CHEST EASE',
    category: 'shirts',
    desc: 'The essential daily cut. Natural shoulder stance with calibrated chest width for clean pairing over denim or trousers.',
  },
  {
    id: 'f-tailored',
    name: 'SLIM TAILORED',
    drop: 'NATURAL ARMHOLE',
    ease: '+2CM CLEAN PROFILE',
    category: 'shirts',
    desc: 'High armholes with subtle rear darting. Ideal for sharp workplace layering, formal events, or tucking into high-rise Gurkhas.',
  },
  {
    id: 'f-utility',
    name: 'ATHLETIC UTILITY',
    drop: 'GUSSETED MOTION',
    ease: '+8CM DYNAMIC EASE',
    category: 'pants',
    desc: 'Built for unrestricted agility. Diamond crotch gussets, dual waistband cinch tabs, and articulated knee darts.',
  },
];

export function Demo4Fit() {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeFit = FITS[activeIdx];

  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              ANATOMICAL PROPORTIONS
            </span>
            <h2 className="font-bebas text-5xl sm:text-7xl text-ink uppercase tracking-tight">
              SHOP BY <span className="text-brand">FIT MATRIX</span>
            </h2>
          </div>
          <p className="font-sans text-xs text-ink/70 max-w-sm font-medium leading-relaxed uppercase">
            Four specialized pattern geometries engineered to match your physique and styling intent.
          </p>
        </div>

        {/* 4 Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
          {FITS.map((fit, idx) => (
            <button
              key={fit.id}
              onClick={() => setActiveIdx(idx)}
              className={`p-5 text-left border-2 border-ink transition-all duration-200 ${
                activeIdx === idx
                  ? 'bg-brand text-paper border-brand shadow-md'
                  : 'bg-paper text-ink hover:bg-sand/30'
              }`}
            >
              <span className={`font-mono text-[10px] uppercase font-bold block mb-1 ${
                activeIdx === idx ? 'text-paper' : 'text-brand'
              }`}>
                0{idx + 1} // {fit.drop}
              </span>
              <h3 className="font-bebas text-2xl uppercase tracking-wide">
                {fit.name}
              </h3>
            </button>
          ))}
        </div>

        {/* Detail Box */}
        <div className="mt-8 border-2 border-ink bg-sand/20 p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="font-mono text-xs uppercase font-bold text-brand">
              SPECIFICATION: {activeFit.ease}
            </span>
            <h3 className="font-bebas text-4xl sm:text-5xl text-ink uppercase">
              {activeFit.name} PROPORTIONS
            </h3>
            <p className="font-sans text-sm text-ink/80 leading-relaxed uppercase">
              {activeFit.desc}
            </p>
          </div>

          <div>
            <Link
              href={`/products?category=${activeFit.category}`}
              className="px-8 py-4 bg-ink hover:bg-brand text-paper font-sans text-xs font-black tracking-widest uppercase transition-all shadow-md block text-center"
            >
              BROWSE {activeFit.name} PIECES →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
