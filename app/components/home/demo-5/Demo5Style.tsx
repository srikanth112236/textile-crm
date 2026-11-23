'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cinzel, outfit } from './fonts';

const STYLES = [
  {
    title: 'Coastal Promenade',
    setting: 'Warm Sea Breeze & Late Sunsets',
    ensemble: 'Camp-Collar Belgian Linen Shirt + Double-Pleated Gurkha',
    href: '/products?category=shirts',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Villa Evening',
    setting: 'Intimate Alfresco Dinners',
    ensemble: 'Structured Waffle Overshirt + High-Rise Tailored Chino',
    href: '/products?category=pants',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Sunny Piazza',
    setting: 'Morning Espresso & Open Markets',
    ensemble: '280 GSM Heavy Boxy Tee + Relaxed Twill Chino',
    href: '/products?category=t-shirts',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
  },
];

export function Demo5Style() {
  return (
    <section className={`relative bg-[#EBE4DC] text-[#2C241E] py-24 border-b border-[#E3DACD] ${cinzel.variable} ${outfit.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#D9CFC2]">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B85D3B] font-serif font-bold block mb-2">
              Occasion Curations
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#2C241E] tracking-tight">
              Curated for <span className="italic font-normal text-[#B85D3B]">The Sun</span>
            </h2>
          </div>
          <p className="text-xs text-[#6B5C52] font-sans max-w-sm leading-relaxed">
            Cohesive outfits crafted to feel light, relaxed, and effortlessly distinguished.
          </p>
        </div>

        {/* 3 Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {STYLES.map((style, idx) => (
            <Link
              key={idx}
              href={style.href}
              className="group rounded-t-[3.5rem] overflow-hidden bg-[#F4EFEA] border border-[#D9CFC2] hover:border-[#B85D3B]/60 p-6 flex flex-col justify-between transition-all duration-500 shadow-sm"
            >
              <div>
                <span className="text-xs font-serif italic text-[#B85D3B] font-bold block mb-3">
                  {style.setting}
                </span>

                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EAE2D8] rounded-t-2xl mb-6">
                  <Image
                    src={style.image}
                    alt={style.title}
                    fill
                    className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-700 ease-out"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <h3 className="font-serif text-2xl font-normal text-[#2C241E] group-hover:text-[#B85D3B] transition-colors">
                  {style.title}
                </h3>
                <p className="text-xs text-[#6B5C52] font-sans mt-2 leading-relaxed">
                  {style.ensemble}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#E3DACD] flex items-center justify-between text-xs font-serif italic text-[#B85D3B]">
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
