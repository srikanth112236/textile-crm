'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const CATEGORIES = [
  {
    code: 'CAT-01',
    name: 'HEAVY TEES',
    desc: '240–280 GSM Ring-Spun',
    itemsCount: '18 ARTICLES',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=t-shirts',
    spec: 'DROPPED SHOULDER',
  },
  {
    code: 'CAT-02',
    name: 'FLAX SHIRTS',
    desc: '100% Normandy Flax',
    itemsCount: '14 ARTICLES',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
    spec: 'NATURAL SLUB WEAVE',
  },
  {
    code: 'CAT-03',
    name: 'GURKHA PANTS',
    desc: 'Double-Pleated Rise',
    itemsCount: '12 ARTICLES',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=pants',
    spec: 'HIGH-RISE WAIST',
  },
  {
    code: 'CAT-04',
    name: 'CARGO DENIM',
    desc: 'Heavy Japanese Twill',
    itemsCount: '09 ARTICLES',
    image: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=pants',
    spec: 'GUSSETED SEAMS',
  },
  {
    code: 'CAT-05',
    name: 'SLUB KURTAS',
    desc: 'Textured Handloom Cotton',
    itemsCount: '11 ARTICLES',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
    spec: 'MANDARIN COLLAR',
  },
  {
    code: 'CAT-06',
    name: 'OVERSHIRTS',
    desc: '320 GSM Structural Weave',
    itemsCount: '08 ARTICLES',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
    spec: 'HORN BUTTONS',
  },
];

export function Demo2Category() {
  return (
    <section className={`relative bg-paper py-14 sm:py-16 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-1">
              <span className="w-1.5 h-1.5 bg-brand" />
              SYSTEM // 02 · ARCHIVAL TAXONOMY
            </div>
            <h2 className="font-syne text-2xl sm:text-4xl font-black uppercase text-ink tracking-tight">
              CATEGORIES BY <span className="text-brand">CONSTRUCTION</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 max-w-xs uppercase leading-relaxed">
            Classified by fabric weight, weave tension, and architectural cut.
          </p>
        </div>

        {/* Compact 6-Cassette Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.code}
              href={cat.href}
              className="group relative border-2 border-ink bg-paper flex flex-col justify-between hover:bg-ink hover:text-paper transition-all duration-200"
            >
              {/* Top Meta Bar */}
              <div className="p-2.5 border-b-2 border-ink group-hover:border-paper flex items-center justify-between font-mono text-[9px] transition-colors">
                <span className="font-bold text-brand">{cat.code}</span>
                <span className="text-ink/60 group-hover:text-paper/60">{cat.itemsCount}</span>
              </div>

              {/* Compact Specimen Preview Image */}
              <div className="relative aspect-[4/3] w-full bg-sand/30 overflow-hidden border-b-2 border-ink group-hover:border-paper transition-colors">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover object-center filter grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-400 ease-out"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              </div>

              {/* Bottom Body */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-syne text-sm font-bold uppercase tracking-tight group-hover:text-paper transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="font-mono text-[9px] text-ink/70 group-hover:text-paper/70 mt-0.5 uppercase transition-colors line-clamp-1">
                    {cat.desc}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-ink/20 group-hover:border-paper/20 flex items-center justify-between font-mono text-[9px] uppercase text-brand tracking-wider font-bold">
                  <span className="truncate">{cat.spec}</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
