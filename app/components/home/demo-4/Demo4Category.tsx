'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { bebasNeue, dmSans } from './fonts';

const CATEGORIES = [
  {
    num: '01',
    name: 'HEAVY TEES',
    spec: '280 GSM Cotton',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=t-shirts',
  },
  {
    num: '02',
    name: 'FLAX SHIRTS',
    spec: 'Normandy Flax Weave',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
  },
  {
    num: '03',
    name: 'GURKHA PANTS',
    spec: 'Architectural Pleat',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=pants',
  },
  {
    num: '04',
    name: 'OVERSHIRTS',
    spec: '320 GSM Thermal',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
  },
  {
    num: '05',
    name: 'SLUB KURTAS',
    spec: 'Textured Handloom',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
  },
  {
    num: '06',
    name: 'CARGO PANTS',
    spec: 'Utility Stretch',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=pants',
  },
];

export function Demo4Category() {
  return (
    <section className={`relative bg-paper py-14 sm:py-16 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              RUNWAY SEGMENTS
            </span>
            <h2 className="font-bebas text-3xl sm:text-5xl text-ink uppercase tracking-tight">
              SHOP BY <span className="text-brand">CATEGORY</span>
            </h2>
          </div>
          <p className="font-sans text-xs text-ink/70 max-w-xs font-medium leading-relaxed uppercase">
            Six engineered silhouettes divided by fabric structure and velocity profile.
          </p>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.num}
              href={cat.href}
              className="group border-2 border-ink bg-paper flex flex-col justify-between hover:bg-ink hover:text-paper transition-all duration-200"
            >
              <div className="p-2.5 border-b-2 border-ink group-hover:border-paper flex items-center justify-between font-mono text-[9px] transition-colors">
                <span className="font-black text-brand">[{cat.num}]</span>
                <span className="text-ink/60 group-hover:text-paper/60 uppercase font-bold">RUN</span>
              </div>

              <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand/30 border-b-2 border-ink group-hover:border-paper transition-colors">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover object-center filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-400 ease-out"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bebas text-lg uppercase tracking-wide group-hover:text-paper transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="font-mono text-[9px] text-ink/70 group-hover:text-paper/70 mt-0.5 uppercase transition-colors line-clamp-1">
                    {cat.spec}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-ink/20 group-hover:border-paper/20 flex items-center justify-between font-sans text-[10px] uppercase font-black text-brand">
                  <span>ENTER</span>
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
