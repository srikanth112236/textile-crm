'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { plusJakarta, playfair } from './fonts';

const CATEGORIES = [
  {
    num: '01',
    name: 'Jersey Tees',
    spec: '280 GSM Cotton',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=t-shirts',
  },
  {
    num: '02',
    name: 'Flax Shirts',
    spec: '100% Normandy Linen',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
  },
  {
    num: '03',
    name: 'Gurkha Pants',
    spec: 'Double-Pleated Rise',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=pants',
  },
  {
    num: '04',
    name: 'Overshirts',
    spec: '320 GSM Waffle Weave',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
  },
  {
    num: '05',
    name: 'Slub Kurtas',
    spec: 'Handloom Cotton',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
  },
  {
    num: '06',
    name: 'Cargo Pants',
    spec: 'Stretch Twill Weave',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=pants',
  },
];

export function Demo3Category() {
  return (
    <section className={`relative bg-[#FAF9F6] text-[#121214] py-14 sm:py-16 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E7E5E0]">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold block mb-1">
              Studio Classification
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#121214] tracking-tight">
              Curated by <span className="italic font-normal text-[#78716C]">Material</span>
            </h2>
          </div>
          <p className="text-xs text-[#57534E] font-sans max-w-xs leading-relaxed">
            Six foundational silhouettes organized by fabric mass and tailored cut.
          </p>
        </div>

        {/* 6 Clean Compact Architectural Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.num}
              href={cat.href}
              className="group rounded-2xl overflow-hidden bg-[#F5F3EE] border border-[#E7E5E0] hover:border-[#D97706]/60 transition-all duration-300 flex flex-col justify-between shadow-2xs hover:shadow-sm"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EBE7DF]">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-500 ease-out"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
                <span className="absolute top-2.5 left-2.5 font-mono text-[10px] font-bold text-[#18181B] bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-2xs">
                  {cat.num}
                </span>
              </div>

              <div className="p-3 bg-[#F5F3EE]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-normal text-[#121214] group-hover:text-[#D97706] transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-[#78716C] font-sans mt-0.5 line-clamp-1">
                      {cat.spec}
                    </p>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-[#D6D3D1] group-hover:border-[#D97706] group-hover:bg-[#D97706] group-hover:text-white flex items-center justify-center transition-all shrink-0 ml-1">
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
