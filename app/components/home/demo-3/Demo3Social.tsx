'use client';

import React from 'react';
import Image from 'next/image';
import { plusJakarta, playfair } from './fonts';

const POSTS = [
  {
    id: 'p-01',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
    caption: '280 GSM Mineral Noir. Clean studio drape over natural oak flooring.',
  },
  {
    id: 'p-02',
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=700&q=80',
    caption: 'Belgian Flax Linen camp collar. Natural slub texture in Kochi.',
  },
  {
    id: 'p-03',
    image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=700&q=80',
    caption: 'High-rise Gurkha forward pleat break over leather loafers.',
  },
  {
    id: 'p-04',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
    caption: 'Waffle knit texture under clean daylight illumination.',
  },
  {
    id: 'p-05',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80',
    caption: 'Studio Lookbook Outtakes. Photographed by Sharan K.',
  },
];

export function Demo3Social() {
  return (
    <section className={`relative bg-[#F5F3EE] text-[#121214] py-24 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#E0DCD4]">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold block mb-2">
              Visual Chronicles
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#121214] tracking-tight">
              Studio Dispatches <span className="italic font-normal text-[#78716C]">@mentoos.official</span>
            </h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-widest text-[#78716C] hover:text-[#D97706] transition-colors flex items-center gap-2 font-mono font-bold"
          >
            <span>Follow Our Studio</span>
            <span>→</span>
          </a>
        </div>

        {/* 5 Frames Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
          {POSTS.map((post, idx) => (
            <div
              key={post.id}
              className={`rounded-2xl overflow-hidden bg-[#FAF9F6] border border-[#E0DCD4] hover:border-[#D97706]/60 transition-all duration-500 shadow-xs hover:shadow-md ${
                idx === 4 ? 'col-span-2 md:col-span-1' : ''
              }`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBE7DF]">
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  className="object-cover object-center filter contrast-[1.02] hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              </div>

              <div className="p-3 bg-[#FAF9F6]">
                <p className="text-[10px] text-[#78716C] font-sans line-clamp-2 leading-relaxed">
                  {post.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
