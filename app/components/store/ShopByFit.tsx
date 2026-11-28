'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, CheckCircle2, Sparkles, Ruler, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const FITS = [
  {
    id: 'oversized',
    title: 'OVERSIZED BOXY',
    tagline: '240 GSM Combed Cotton • Dropped Shoulder',
    description:
      'Engineered with an extra 2.5 inches across the chest and a dropped shoulder seam. Falls straight without clinging to the belly or sides, delivering effortless streetwear presence.',
    specs: [
      { label: 'Shoulder Seam', value: 'Dropped 2.5"' },
      { label: 'Chest Room', value: 'Comfortably Boxy' },
      { label: 'Fabric Density', value: '240 GSM Dense Knit' },
      { label: 'Pre-Wash', value: '0% Post-Wash Shrinkage' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
    link: '/products?search=oversized',
    stylesCount: '38 Styles',
  },
  {
    id: 'relaxed',
    title: 'RELAXED CASUAL',
    tagline: '100% Normandy Flax Linen • Air Permeable',
    description:
      'Designed for tropical warmth and humid Indian climates. Natural loose drape with generous armhole allowance for maximum airflow and daily freedom.',
    specs: [
      { label: 'Shoulder Seam', value: 'Natural Line' },
      { label: 'Chest Room', value: 'Airy Ease' },
      { label: 'Fabric Density', value: '180 GSM Airy Weave' },
      { label: 'Pre-Wash', value: 'Soft Mineral Wash' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    link: '/products?search=relaxed',
    stylesCount: '29 Styles',
  },
  {
    id: 'slim',
    title: 'SLIM TAILORED',
    tagline: 'Structured Taper • Crisp Collar & Cuffs',
    description:
      'Hugs the chest and upper back cleanly while gently contouring the waist without restrictive pull. Ideal for corporate presence, fine dining, and elevated layering.',
    specs: [
      { label: 'Shoulder Seam', value: 'Crisp Tailored' },
      { label: 'Chest Room', value: 'Clean Contour' },
      { label: 'Fabric Density', value: '210 GSM Combed Cotton' },
      { label: 'Pre-Wash', value: 'Mercerized Finish' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    link: '/products?search=slim',
    stylesCount: '24 Styles',
  },
  {
    id: 'athletic',
    title: 'ATHLETIC UTILITY',
    tagline: '6-Pocket Ergonomic • 4-Way Stretch Twill',
    description:
      'Tailored with roomier thighs and knees, tapering sharply down to ribbed ankle cuffs. Reinforced bar-tack stitching and deep cargo storage for non-stop momentum.',
    specs: [
      { label: 'Waist & Thigh', value: 'Ergonomic Mobility' },
      { label: 'Ankle Finish', value: 'Tapered Cinch' },
      { label: 'Fabric Density', value: '260 GSM Stretch Twill' },
      { label: 'Reinforcement', value: 'Heavy Bar-Tack' },
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
    link: '/products?category=joggers',
    stylesCount: '21 Styles',
  },
];

export function ShopByFit() {
  const [selectedFit, setSelectedFit] = useState(FITS[0]);

  return (
    <section aria-labelledby="shop-by-fit-title" className="py-4">
      {/* Section Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Engineered Proportions
          </span>
          <h2
            id="shop-by-fit-title"
            className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white"
          >
            SHOP BY SILHOUETTE & FIT
          </h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Every pattern is calibrated around Indian body proportions — eliminating shoulder bunching and waist constriction.
          </p>
        </div>

        {/* Fit selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FITS.map((fit) => {
            const isActive = selectedFit.id === fit.id;
            return (
              <button
                key={fit.id}
                type="button"
                onClick={() => setSelectedFit(fit)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-neutral-950 text-amber-300 shadow-md dark:bg-white dark:text-neutral-950'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400'
                )}
              >
                {fit.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Silhouette Studio Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center rounded-[28px] border border-neutral-200/80 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Left Specification & Copy */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md border border-white/10">
            <Ruler className="h-3.5 w-3.5" />
            <span>Calibrated Fit Matrix</span>
            <span className="text-white/40">•</span>
            <span>{selectedFit.stylesCount}</span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {selectedFit.title}
            </h3>
            <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider text-amber-400">
              {selectedFit.tagline}
            </p>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-neutral-300 max-w-xl">
              {selectedFit.description}
            </p>
          </div>

          {/* 4 Architectural Spec Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {selectedFit.specs.map((spec, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  {spec.label}
                </p>
                <p className="mt-1 text-xs font-black text-amber-300">
                  {spec.value}
                </p>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={selectedFit.link}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-neutral-950 transition-all hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/20"
            >
              Shop {selectedFit.title}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-300 pl-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Easy Size Exchanges at Doorstep</span>
            </div>
          </div>
        </div>

        {/* Right High-Impact Model Look Card */}
        <div className="lg:col-span-5 relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-white/15 bg-neutral-900 shadow-xl">
          <Image
            src={selectedFit.imageUrl}
            alt={selectedFit.title}
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover object-top transition-all duration-700 ease-out hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/20" />

          {/* Bottom Card Chip */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-neutral-950/80 p-3 backdrop-blur-md border border-white/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-neutral-400">Model Drape Preview</p>
              <p className="text-xs font-black text-white">{selectedFit.title}</p>
            </div>
            <Link
              href={selectedFit.link}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400 text-neutral-950 hover:bg-amber-300 transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
