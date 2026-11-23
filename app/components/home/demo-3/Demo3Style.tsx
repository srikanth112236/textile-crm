'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { plusJakarta, playfair } from './fonts';

const STYLES = [
  {
    title: 'The Daily Atelier',
    setting: 'Studio Work & Urban Transit',
    ensemble: '280 GSM Heavy Boxy Tee + Relaxed Chino',
    href: '/products?category=t-shirts',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'The Executive Salon',
    setting: 'Refined Business Encounters',
    ensemble: 'Camp-Collar Belgian Linen + Double-Pleated Gurkha',
    href: '/products?category=shirts',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'The Weekend Gallery',
    setting: 'Afternoon Culture & Evening Drinks',
    ensemble: 'Structured Waffle Overshirt + Weighted Twill Trouser',
    href: '/products?category=pants',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  },
];

export function Demo3Style() {
  return (
    <section className={`relative bg-[#F5F3EE] text-[#121214] py-24 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#E0DCD4]">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold block mb-2">
              Occasion Curations
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#121214] tracking-tight">
              Curated for <span className="italic font-normal text-[#78716C]">The Setting</span>
            </h2>
          </div>
          <p className="text-xs text-[#57534E] font-sans max-w-sm leading-relaxed">
            Cohesive outfits crafted to feel light, relaxed, and effortlessly distinguished.
          </p>
        </div>

        {/* 3 Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {STYLES.map((style, idx) => (
            <Link
              key={idx}
              href={style.href}
              className="group rounded-3xl overflow-hidden bg-[#FAF9F6] border border-[#E0DCD4] hover:border-[#D97706]/60 p-6 flex flex-col justify-between transition-all duration-500 shadow-xs hover:shadow-md"
            >
              <div>
                <span className="text-xs font-mono text-[#D97706] font-bold uppercase tracking-wider block mb-3">
                  {style.setting}
                </span>

                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EBE7DF] rounded-2xl mb-6">
                  <Image
                    src={style.image}
                    alt={style.title}
                    fill
                    className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <h3 className="font-serif text-2xl font-normal text-[#121214] group-hover:text-[#D97706] transition-colors">
                  {style.title}
                </h3>
                <p className="text-xs text-[#78716C] font-sans mt-2 leading-relaxed">
                  {style.ensemble}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E7E5E0] flex items-center justify-between text-xs font-mono font-bold uppercase text-[#D97706]">
                <span>View Ensemble</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
