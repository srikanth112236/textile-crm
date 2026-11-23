'use client';

import React from 'react';
import Image from 'next/image';
import { bebasNeue, dmSans } from './fonts';

const POSTS = [
  {
    id: 'p-01',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
    caption: '280 GSM MINERAL NOIR. SHOT ON LOCATION IN DELHI.',
  },
  {
    id: 'p-02',
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=700&q=80',
    caption: 'BELGIAN LINEN DRAPE IN MOVEMENT. KOCHI ATELIER.',
  },
  {
    id: 'p-03',
    image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=700&q=80',
    caption: 'DOUBLE-PLEATED GURKHA OVER CONCRETE TERRAZZO.',
  },
  {
    id: 'p-04',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
    caption: 'SUMMER RUNWAY PALETTE: RAW OAT, IVORY, DEEP CHARCOAL.',
  },
  {
    id: 'p-05',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80',
    caption: 'RUNWAY LOOKBOOK OUTTAKES. PHOTOGRAPHED BY SHARAN K.',
  },
];

export function Demo4Social() {
  return (
    <section className={`relative bg-sand/20 py-20 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              LIVE BROADCAST
            </span>
            <h2 className="font-bebas text-5xl sm:text-7xl text-ink uppercase tracking-tight">
              FOLLOW <span className="text-brand">@MENTOOS.OFFICIAL</span>
            </h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs font-black uppercase tracking-wider text-ink hover:text-brand transition-colors flex items-center gap-2"
          >
            <span>CONNECT INSTAGRAM FEED</span>
            <span>↗</span>
          </a>
        </div>

        {/* 5 Frames Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-10">
          {POSTS.map((post, idx) => (
            <div
              key={post.id}
              className={`border-2 border-ink bg-paper p-2 flex flex-col justify-between ${
                idx === 4 ? 'col-span-2 md:col-span-1' : ''
              }`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand/30 border border-ink">
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  className="object-cover object-center filter grayscale hover:grayscale-0 hover:scale-105 transition-all duration-500 ease-out"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              </div>

              <div className="p-2 pt-3 font-mono text-[9px] uppercase text-ink/70 line-clamp-2 leading-relaxed">
                {post.caption}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
