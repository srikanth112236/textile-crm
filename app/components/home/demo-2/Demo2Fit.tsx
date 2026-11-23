'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const FITS = [
  {
    id: 'fit-boxy',
    name: 'BOXY OVERSIZED',
    dropRatio: '+4.5CM DROP',
    ease: '+12CM CHEST EASE',
    hem: 'SQUARE CROPPED',
    category: 't-shirts',
    desc: 'Engineered for a substantial architectural drape. The fabric hangs straight down from the outer shoulder point without hugging the torso or lower back.',
    measurements: [
      { label: 'SHOULDER DROP', val: '54 CM (SIZE L)' },
      { label: 'CHEST CIRCUMFERENCE', val: '124 CM' },
      { label: 'BODY LENGTH', val: '72 CM' },
      { label: 'SLEEVE OPENING', val: '22 CM FLAT' },
    ],
  },
  {
    id: 'fit-relaxed',
    name: 'RELAXED CASUAL',
    dropRatio: '+2.0CM DROP',
    ease: '+6CM CHEST EASE',
    hem: 'NATURAL FALL',
    category: 'shirts',
    desc: 'Subtle drape with balanced proportions. Sits cleanly over both denim and tailored trousers without feeling excessively voluminous.',
    measurements: [
      { label: 'SHOULDER DROP', val: '49 CM (SIZE L)' },
      { label: 'CHEST CIRCUMFERENCE', val: '116 CM' },
      { label: 'BODY LENGTH', val: '74 CM' },
      { label: 'SLEEVE OPENING', val: '19 CM FLAT' },
    ],
  },
  {
    id: 'fit-tailored',
    name: 'SLIM TAILORED',
    dropRatio: 'NATURAL SHOULDER',
    ease: '+2CM CLEAN EASE',
    hem: 'SCULPTED YOKE',
    category: 'shirts',
    desc: 'High armholes and calibrated back darting. Ideal for layered workplace tailoring, clean knitwear, or tucking into high-rise Gurkhas.',
    measurements: [
      { label: 'SHOULDER DROP', val: '46 CM (SIZE L)' },
      { label: 'CHEST CIRCUMFERENCE', val: '108 CM' },
      { label: 'BODY LENGTH', val: '76 CM' },
      { label: 'SLEEVE OPENING', val: '17 CM FLAT' },
    ],
  },
  {
    id: 'fit-utility',
    name: 'ATHLETIC UTILITY',
    dropRatio: 'GUSSETED DROP',
    ease: '+8CM DYNAMIC EASE',
    hem: 'REINFORCED SPLIT',
    category: 'pants',
    desc: 'Reinforced stress points, diamond crotch gussets, and articulated pleat knees designed for active ergonomic range of movement.',
    measurements: [
      { label: 'WAIST ADJUSTMENT', val: '30-34 IN (FLEX TAB)' },
      { label: 'THIGH EASE', val: '68 CM' },
      { label: 'KNEE ARTICULATION', val: 'DUAL DART' },
      { label: 'LEG OPENING', val: '21 CM' },
    ],
  },
];

export function Demo2Fit() {
  const [selectedFitIdx, setSelectedFitIdx] = useState(0);
  const activeFit = FITS[selectedFitIdx];

  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-2">
              <span className="w-2 h-2 bg-brand" />
              SYSTEM // 06 · SILHOUETTE CALIBRATION
            </div>
            <h2 className="font-syne text-3xl sm:text-5xl font-black uppercase text-ink tracking-tight">
              SHOP BY <span className="text-brand">FIT MATRIX</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 max-w-sm uppercase leading-relaxed">
            Dimensional engineering guidelines. Match your anatomical preferences to our exact pattern specifications.
          </p>
        </div>

        {/* 4 Fit Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-8">
          {FITS.map((fit, idx) => (
            <button
              key={fit.id}
              onClick={() => setSelectedFitIdx(idx)}
              className={`p-4 border-2 border-ink text-left font-mono transition-all duration-200 ${
                selectedFitIdx === idx
                  ? 'bg-ink text-paper'
                  : 'bg-paper text-ink hover:bg-sand/30'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] mb-2">
                <span className={selectedFitIdx === idx ? 'text-brand font-bold' : 'text-ink/60'}>
                  [0{idx + 1}]
                </span>
                <span className={selectedFitIdx === idx ? 'text-paper/80' : 'text-ink/60'}>
                  {fit.dropRatio}
                </span>
              </div>
              <h3 className="font-syne text-base font-bold uppercase tracking-tight">
                {fit.name}
              </h3>
            </button>
          ))}
        </div>

        {/* Blueprint Display Panel */}
        <div className="mt-6 border-2 border-ink bg-sand/20 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Engineering Schematic Wireframe */}
          <div className="lg:col-span-7 bg-paper border-2 border-ink p-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-ink/20 font-mono text-[10px] uppercase text-ink/60">
              <span>PATTERN SCHEMATIC: {activeFit.name}</span>
              <span className="text-brand font-bold">SCALE: 1:1 METRIC</span>
            </div>

            {/* Wireframe Diagram Box */}
            <div className="py-12 flex flex-col items-center justify-center relative min-h-[260px]">
              {/* Graphic Silhouette Blueprint Box */}
              <div className="w-56 h-48 border-2 border-dashed border-ink/40 relative flex items-center justify-center bg-sand/10">
                <span className="font-mono text-[10px] text-ink/40 uppercase tracking-widest text-center px-4">
                  [ANATOMICAL CHEST ENVELOPE: {activeFit.ease}]
                </span>
                {/* Horizontal Guide */}
                <div className="absolute inset-x-0 top-1/2 border-t border-brand/50 -translate-y-1/2" />
                <span className="absolute right-1 top-1/2 -translate-y-6 font-mono text-[9px] text-brand uppercase font-bold">
                  CHEST LINE
                </span>
                {/* Vertical Center Axis */}
                <div className="absolute inset-y-0 left-1/2 border-l border-ink/30 -translate-x-1/2" />
              </div>

              {/* Callouts */}
              <div className="absolute top-4 left-4 font-mono text-[9px] text-ink/70 uppercase">
                SHOULDER ANGLE: 18°
              </div>
              <div className="absolute bottom-4 right-4 font-mono text-[9px] text-ink/70 uppercase">
                HEM PROFILE: {activeFit.hem}
              </div>
            </div>

            <p className="font-mono text-xs text-ink/80 pt-4 border-t border-ink/20 leading-relaxed uppercase">
              {activeFit.desc}
            </p>
          </div>

          {/* Right: Dimension Metrics & CTA */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border-b-2 border-ink pb-4">
              <span className="font-mono text-[10px] text-brand tracking-widest uppercase block">
                CAD SPECIFICATION TABLE
              </span>
              <h3 className="font-syne text-2xl font-black uppercase tracking-tight text-ink mt-1">
                {activeFit.name} METRICS
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {activeFit.measurements.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-ink/20">
                  <span className="text-ink/60">{m.label}:</span>
                  <span className="font-bold text-ink">{m.val}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href={`/products?category=${activeFit.category}`}
                className="w-full py-3.5 bg-ink text-paper hover:bg-brand font-mono text-xs tracking-widest uppercase font-bold transition-all text-center block"
              >
                BROWSE {activeFit.name} GARMENTS →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
