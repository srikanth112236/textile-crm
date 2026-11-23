'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { fraunces, manrope } from './fonts';

interface Reel {
  id: string;
  creator: string;
  handle: string;
  city: string;
  garment: string;
  duration: string;
  coverImage: string;
  tags: string[];
}

const REELS: Reel[] = [
  {
    id: 'reel-1',
    creator: 'Kabir Varma',
    handle: '@kabir.v',
    city: 'Mumbai',
    garment: '240 GSM Heavy Boxy Tee · Raw Chalk',
    duration: '0:24',
    coverImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    tags: ['Fabric Drop', 'Shoulder Seam', 'Wash Test'],
  },
  {
    id: 'reel-2',
    creator: 'Siddharth Roy',
    handle: '@sidroy.studio',
    city: 'Bengaluru',
    garment: 'Belgian Linen Relaxed Shirt · Olive Drab',
    duration: '0:32',
    coverImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    tags: ['Breathability', 'Bespoke Hem', 'Drape'],
  },
  {
    id: 'reel-3',
    creator: 'Neil Sen',
    handle: '@neilsen.fit',
    city: 'New Delhi',
    garment: 'Pleated Gurkha Trouser · Mineral Charcoal',
    duration: '0:18',
    coverImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    tags: ['Pleat Depth', 'Waist Fit', 'Cuff Break'],
  },
  {
    id: 'reel-4',
    creator: 'Arjun Nair',
    handle: '@arjun.n',
    city: 'Kochi',
    garment: 'Cuban Collar Textured Overshirt',
    duration: '0:29',
    coverImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
    tags: ['Layering', 'Waffle Weave', 'Summer Fit'],
  },
];

export function Demo1Ugc() {
  const [activeReel, setActiveReel] = useState<string | null>(null);

  return (
    <section className={`relative bg-paper py-24 sm:py-32 border-b border-line/60 ${manrope.variable} ${fraunces.variable} font-sans overflow-hidden`}>
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-line">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">Chapter 10</span>
              <span className="w-8 h-px bg-ink/20" />
              <span className="font-mono text-[10px] tracking-widest text-brand uppercase">Moving Garments</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-ink tracking-tight">
              In Real <span className="italic font-normal">Motion</span>
            </h2>
          </div>
          <p className="max-w-md text-xs text-ink/60 font-sans tracking-tight leading-relaxed">
            Unfiltered silhouette movement, fabric drop tests, and styling reels submitted by our verified patrons across India.
          </p>
        </div>

        {/* 9:16 Video Reels Grid */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {REELS.map((reel) => {
            const isPlaying = activeReel === reel.id;

            return (
              <div
                key={reel.id}
                onClick={() => setActiveReel(isPlaying ? null : reel.id)}
                className="group relative cursor-pointer flex flex-col"
              >
                {/* 9:16 Frame */}
                <div className="relative aspect-[9/16] w-full bg-sand/30 overflow-hidden border border-line">
                  <Image
                    src={reel.coverImage}
                    alt={reel.garment}
                    fill
                    className="object-cover object-center filter contrast-[1.03] transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-black/20 pointer-events-none" />

                  {/* Top Bar with Duration & Reel Tag */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-paper text-[10px] font-mono tracking-wider pointer-events-none">
                    <span className="px-2 py-0.5 bg-ink/70 backdrop-blur-sm rounded-sm">
                      {reel.duration}
                    </span>
                    <span className="flex items-center gap-1.5 opacity-80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      MOTION
                    </span>
                  </div>

                  {/* Center Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-paper/20 backdrop-blur-md border border-paper/40 flex items-center justify-center text-paper group-hover:scale-110 group-hover:bg-paper group-hover:text-ink transition-all duration-300">
                      <span className="text-sm font-mono ml-0.5">▶</span>
                    </div>
                  </div>

                  {/* Bottom Reel Caption */}
                  <div className="absolute bottom-4 left-4 right-4 text-paper pointer-events-none space-y-1">
                    <p className="font-mono text-[10px] tracking-widest text-brand">{reel.handle}</p>
                    <p className="font-serif text-sm font-light line-clamp-1 leading-snug">{reel.garment}</p>
                    <p className="font-mono text-[9px] text-paper/60 uppercase">{reel.city}</p>
                  </div>
                </div>

                {/* Tags below frame */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {reel.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 bg-sand/40 border border-line/60 text-ink/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
