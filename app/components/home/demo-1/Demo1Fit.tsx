'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const FITS = [
  {
    id: 'oversized',
    title: 'Oversized Boxy',
    subtitle: 'Dropped Shoulder • 240 GSM Combed Cotton',
    specs: [
      { label: 'Chest Room', value: '+2.5 Inches Allowance' },
      { label: 'Shoulder Drop', value: 'Relaxed Ergonomic Seam' },
      { label: 'Length', value: 'Calibrated at Hip Bone' },
      { label: 'Pre-Wash', value: '100% Pre-Shrunk Bio-Wash' },
    ],
    description:
      'Engineered specifically to drape straight down from the shoulders, avoiding belly cling or fabric bunching under the arms.',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=85',
    link: '/products?search=oversized',
    plate: 'Silhouette 01',
  },
  {
    id: 'relaxed',
    title: 'Relaxed Casual',
    subtitle: 'Airy Comfort • 100% Normandy Linen',
    specs: [
      { label: 'Chest Room', value: 'Natural Air Permeable' },
      { label: 'Shoulder Drop', value: 'Soft Unstructured' },
      { label: 'Ventilation', value: 'Tropical Humidity Tested' },
      { label: 'Touch', value: 'Soft French Flax' },
    ],
    description:
      'Woven for warm Indian afternoons. Free armholes and loose chest drape prevent sweat rings and maximize airflow.',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85',
    link: '/products?search=relaxed',
    plate: 'Silhouette 02',
  },
  {
    id: 'slim',
    title: 'Slim Tailored',
    subtitle: 'Clean Taper • Structured Combed Cotton',
    specs: [
      { label: 'Chest Room', value: 'Contoured Upper Torso' },
      { label: 'Shoulder Drop', value: 'High Structured Cap' },
      { label: 'Waist', value: 'Subtle Athletic Taper' },
      { label: 'Occasion', value: 'Office & Evening Layering' },
    ],
    description:
      'Hugs broad Indian shoulders while tapering gently down the waistline for a sharp, tailored executive presence.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85',
    link: '/products?search=slim',
    plate: 'Silhouette 03',
  },
  {
    id: 'utility',
    title: 'Athletic Utility',
    subtitle: '4-Way Stretch • 6-Pocket Twill',
    specs: [
      { label: 'Thigh Room', value: 'Extended Quad Mobility' },
      { label: 'Ankle Finish', value: 'Heavy Ribbed Cinch' },
      { label: 'Storage', value: '6 Deep Utility Pockets' },
      { label: 'Reinforce', value: 'Heavy Bar-Tack Stitch' },
    ],
    description:
      'Roomy through thighs and knees with a sharp taper down to ribbed ankle cuffs that sit cleanly on sneakers.',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=85',
    link: '/products?category=joggers',
    plate: 'Silhouette 04',
  },
];

export function Demo1Fit() {
  const [selectedFit, setSelectedFit] = useState(FITS[0]);

  return (
    <section id="sec-fit" className="w-full bg-paper py-20 px-4 sm:px-6 border-b border-line/40">
      <div className="mx-auto max-w-7xl">
        {/* Chapter Header */}
        <div className="flex items-baseline justify-between border-b border-line/60 pb-4 mb-16">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs font-bold text-brand uppercase tracking-widest">
              CH. 06 / 13
            </span>
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
              SILHOUETTE MATRIX
            </span>
          </div>
          <Link
            href="/products"
            className="group font-mono text-xs text-ink hover:text-brand transition-colors flex items-center gap-1"
          >
            <span>FIT ARCHIVE</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Specification Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <span className="font-mono text-xs text-brand uppercase tracking-widest block mb-1">
                Calibrated For Real Proportions
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-black tracking-tight text-ink">
                Shop by <span className="italic text-brand font-normal">Silhouette.</span>
              </h2>
            </div>

            {/* Silhouette Selector Tabs */}
            <div className="flex flex-wrap gap-2 pt-2">
              {FITS.map((fit) => {
                const isActive = selectedFit.id === fit.id;
                return (
                  <button
                    key={fit.id}
                    onClick={() => setSelectedFit(fit)}
                    className={cn(
                      'px-4 py-2 font-mono text-xs tracking-wider uppercase transition-all duration-200 border',
                      isActive
                        ? 'bg-ink text-paper border-ink font-bold shadow-md'
                        : 'bg-sand/40 text-ink-muted border-line hover:border-ink hover:text-ink'
                    )}
                  >
                    {fit.title}
                  </button>
                );
              })}
            </div>

            {/* Active Fit Details */}
            <div className="border-t border-line/60 pt-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-2xl font-black text-ink">{selectedFit.title}</h3>
                <span className="font-mono text-xs text-brand font-bold uppercase tracking-wider">
                  {selectedFit.plate}
                </span>
              </div>
              <p className="font-mono text-xs text-ink-muted uppercase tracking-wider">
                {selectedFit.subtitle}
              </p>
              <p className="font-sans text-xs sm:text-sm text-ink-muted leading-relaxed max-w-xl">
                {selectedFit.description}
              </p>

              {/* 4 Technical Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                {selectedFit.specs.map((spec, i) => (
                  <div key={i} className="border border-line/60 bg-sand/30 p-3">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                      {spec.label}
                    </p>
                    <p className="font-serif text-xs font-black text-ink mt-1">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA Link */}
              <div className="pt-4">
                <Link
                  href={selectedFit.link}
                  className="inline-flex items-center gap-2 bg-ink text-paper px-6 py-3 text-xs font-mono font-bold tracking-wider uppercase hover:bg-brand transition-colors"
                >
                  <span>Explore {selectedFit.title} Catalog</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Editorial Model Plate (5 Cols) */}
          <div className="lg:col-span-5" data-cursor="VIEW">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-sand/40 border border-line/60 shadow-xl">
              <Image
                src={selectedFit.image}
                alt={selectedFit.title}
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover object-top transition-all duration-700 ease-out hover:scale-103"
              />
              <span className="absolute top-4 left-4 font-mono text-[9px] font-bold tracking-widest bg-paper px-2.5 py-1 text-ink uppercase">
                {selectedFit.plate} • DRAPE TEST
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
