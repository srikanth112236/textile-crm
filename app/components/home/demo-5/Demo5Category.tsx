'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cinzel, outfit } from './fonts';

const CATEGORIES = [
  {
    num: '01',
    name: 'Cotton Jersey',
    desc: '280 GSM Combed',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=t-shirts',
  },
  {
    num: '02',
    name: 'Flax Linen',
    desc: 'Normandy Weave',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
  },
  {
    num: '03',
    name: 'Gurkha Pants',
    desc: 'Double-Pleated',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=pants',
  },
  {
    num: '04',
    name: 'Overshirts',
    desc: '320 GSM Waffle',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
  },
  {
    num: '05',
    name: 'Slub Kurtas',
    desc: 'Handloom Cotton',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=shirts',
  },
  {
    num: '06',
    name: 'Cargo Joggers',
    desc: 'Utility Twill',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
    href: '/products?category=pants',
  },
];

export function Demo5Category() {
  return (
    <section className={`relative bg-[#F4EFEA] text-[#2C241E] py-14 sm:py-16 border-b border-[#E3DACD] ${cinzel.variable} ${outfit.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E3DACD]">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B85D3B] font-serif font-bold block mb-1">
              Earth & Botanical Taxonomy
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#2C241E] tracking-tight">
              Shop by <span className="italic font-normal text-[#B85D3B]">Material</span>
            </h2>
          </div>
          <p className="text-xs text-[#6B5C52] font-sans max-w-xs leading-relaxed">
            Six botanical silhouettes designed to breathe naturally and soften with age.
          </p>
        </div>

        {/* 6 Arched Gateway Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.num}
              href={cat.href}
              className="group rounded-t-3xl overflow-hidden bg-[#EAE2D8] border border-[#E3DACD] hover:border-[#B85D3B]/60 transition-all duration-300 flex flex-col justify-between shadow-2xs hover:shadow-xs"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#DDD4C7]">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-500 ease-out"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
                <span className="absolute top-2.5 left-2.5 font-serif text-[10px] italic text-[#B85D3B] bg-[#F4EFEA]/90 px-2 py-0.5 rounded-full">
                  {cat.num}
                </span>
              </div>

              <div className="p-3 bg-[#EAE2D8]">
                <h3 className="font-serif text-sm font-normal text-[#2C241E] group-hover:text-[#B85D3B] transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-[#6B5C52] font-sans mt-0.5 line-clamp-1">
                  {cat.desc}
                </p>
                <div className="mt-2 pt-1.5 border-t border-[#D9CFC2] flex items-center justify-between text-[10px] font-serif italic text-[#B85D3B]">
                  <span>Discover</span>
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
