'use client';

import React, { useState } from 'react';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const AUDITS = [
  {
    id: 'aud-01',
    score: '5.00 / 5.00',
    reviewer: 'PATRON: A. MEHTA',
    cert: 'VERIFIED DOMESTIC AUDIT #88192',
    timestamp: '2026-10-18 14:22:09 IST',
    washCycles: '16 MACHINE WASH CYCLES',
    shrinkage: '0.8% OBSERVED SHRINKAGE',
    article: '280 GSM HEAVYWEIGHT CREWNECK',
    log: 'Dense jersey holds its square shoulder seam without collapsing. The collar ribbing shows zero distortion after 16 cycles. Pattern proportions are exceptionally calibrated for broad shoulders.',
  },
  {
    id: 'aud-02',
    score: '5.00 / 5.00',
    reviewer: 'PATRON: V. RAO',
    cert: 'VERIFIED DOMESTIC AUDIT #88204',
    timestamp: '2026-10-22 09:41:15 IST',
    washCycles: '12 HAND-WASH CYCLES',
    shrinkage: '0.4% OBSERVED SHRINKAGE',
    article: '100% BELGIAN FLAX LINEN SHIRT',
    log: 'Breathability coefficient is unmatched in coastal 34°C humidity. Natural slub texture softens pleasantly with each wash while retaining crisp collar stance.',
  },
  {
    id: 'aud-03',
    score: '4.95 / 5.00',
    reviewer: 'PATRON: D. SINGHANIA',
    cert: 'VERIFIED DOMESTIC AUDIT #88231',
    timestamp: '2026-11-04 18:05:40 IST',
    washCycles: '08 DRY CLEAN CYCLES',
    shrinkage: '0.0% OBSERVED SHRINKAGE',
    article: 'DOUBLE-PLEATED TAILORED GURKHA',
    log: 'High-rise extended tab eliminates the need for a belt. Deep forward pleats create a structured architectural drape that breaks cleanly over loafers.',
  },
];

export function Demo2Reviews() {
  const [activeIdx, setActiveIdx] = useState(0);
  const audit = AUDITS[activeIdx];

  return (
    <section className={`relative bg-sand/20 py-20 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-2">
              <span className="w-2 h-2 bg-brand" />
              SYSTEM // 09 · PATRON QUALITY AUDITS
            </div>
            <h2 className="font-syne text-3xl sm:text-5xl font-black uppercase text-ink tracking-tight">
              VERIFIED <span className="text-brand">AUDIT LOGS</span>
            </h2>
          </div>
          <div className="font-mono text-xs text-ink/70 uppercase">
            AUDIT BATCH: 2026.Q4 · 1,420 VERIFIED REPORTS
          </div>
        </div>

        {/* Audit Log Terminal Frame */}
        <div className="mt-10 border-2 border-ink bg-paper p-6 sm:p-10">
          {/* Top Audit Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-6 border-b-2 border-ink">
            {AUDITS.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActiveIdx(idx)}
                className={`px-4 py-2 font-mono text-xs uppercase font-bold transition-all border ${
                  activeIdx === idx
                    ? 'bg-ink text-paper border-ink'
                    : 'bg-paper text-ink/70 border-ink/30 hover:border-ink'
                }`}
              >
                LOG [{idx + 1}] · {item.score}
              </button>
            ))}
          </div>

          {/* Audit Body */}
          <div className="pt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-ink/60 border-b border-ink/20 pb-4">
              <span className="font-bold text-ink">{audit.cert}</span>
              <span>RECORDED: {audit.timestamp}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs bg-sand/30 p-4 border border-ink/20">
              <div>
                <span className="text-ink/60 block text-[10px]">INSPECTED ARTICLE</span>
                <span className="font-bold text-ink uppercase">{audit.article}</span>
              </div>
              <div>
                <span className="text-ink/60 block text-[10px]">WASH CYCLES EVALUATED</span>
                <span className="font-bold text-brand uppercase">{audit.washCycles}</span>
              </div>
              <div>
                <span className="text-ink/60 block text-[10px]">DIMENSIONAL VARIANCE</span>
                <span className="font-bold text-emerald-700 uppercase">{audit.shrinkage}</span>
              </div>
            </div>

            <blockquote className="font-spaceGrotesk text-lg sm:text-xl font-medium text-ink leading-relaxed uppercase pt-2">
              “{audit.log}”
            </blockquote>

            <div className="pt-4 border-t border-ink/20 font-mono text-xs text-brand font-bold uppercase flex items-center justify-between">
              <span>{audit.reviewer}</span>
              <span className="text-emerald-700">AUDIT VERIFIED ✓</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
