'use client';

import React from 'react';
import Image from 'next/image';
import { cinzel, outfit } from './fonts';

const POSTS = [
  {
    id: 'p-01',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
    caption: 'Pure linen textured twill. Shot on location in Fort Kochi.',
  },
  {
    id: 'p-02',
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=700&q=80',
    caption: 'Double-pleated drape in movement. Heavy mineral cotton.',
  },
  {
    id: 'p-03',
    image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=700&q=80',
    caption: 'Boxy drop-shoulder proportions engineered for all-day ease.',
  },
  {
    id: 'p-04',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
    caption: 'The Summer Palette: Natural Oat, Bone White, Mineral Sand.',
  },
  {
    id: 'p-05',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80',
    caption: 'Mediterranean Lookbook Outtakes. Photographed by Sharan K.',
  },
];

export function Demo5Social() {
  return (
    <section className={`relative bg-[#EBE4DC] text-[#2C241E] py-24 border-b border-[#E3DACD] ${cinzel.variable} ${outfit.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#D9CFC2]">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B85D3B] font-serif font-bold block mb-2">
              Visual Chronicles
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#2C241E] tracking-tight">
              Dispatches <span className="italic font-normal text-[#B85D3B]">@mentoos.official</span>
            </h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-widest text-[#6B5C52] hover:text-[#B85D3B] transition-colors flex items-center gap-2 font-serif"
          >
            <span>Follow Our Atelier</span>
            <span>→</span>
          </a>
        </div>

        {/* 5 Frames Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
          {POSTS.map((post, idx) => (
            <div
              key={post.id}
              className={`rounded-t-3xl overflow-hidden bg-[#F4EFEA] border border-[#D9CFC2] hover:border-[#B85D3B]/60 transition-all duration-500 shadow-sm ${
                idx === 4 ? 'col-span-2 md:col-span-1' : ''
              }`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#DDD4C7]">
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  className="object-cover object-center filter contrast-[1.02] hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              </div>

              <div className="p-3 bg-[#F4EFEA]">
                <p className="text-[10px] text-[#6B5C52] font-sans line-clamp-2 leading-relaxed">
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
