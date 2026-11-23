'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { bebasNeue, dmSans } from './fonts';

const CLIPS = [
  {
    id: 'c-01',
    creator: 'KABIR VARMA',
    handle: '@KABIR.V',
    garment: '280 GSM BOXY DROP TEE',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    tag: 'FABRIC TENSION',
  },
  {
    id: 'c-02',
    creator: 'SIDDHARTH ROY',
    handle: '@SIDROY',
    garment: 'BELGIAN LINEN CAMP SHIRT',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    tag: 'AIRFLOW WEAVE',
  },
  {
    id: 'c-03',
    creator: 'NEIL SEN',
    handle: '@NEILSEN',
    garment: 'DOUBLE-PLEATED GURKHA',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    tag: 'CUFF BREAK',
  },
  {
    id: 'c-04',
    creator: 'ARJUN NAIR',
    handle: '@ARJUN.N',
    garment: 'TEXTURED WAFFLE OVERSHIRT',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
    tag: 'LAYERING DROP',
  },
];

export function Demo4Ugc() {
  const [activeClip, setActiveClip] = useState<string | null>(null);

  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              COMMUNITY FOOTAGE
            </span>
            <h2 className="font-bebas text-5xl sm:text-7xl text-ink uppercase tracking-tight">
              RUNWAY <span className="text-brand">IN REAL MOTION</span>
            </h2>
          </div>
          <p className="font-sans text-xs text-ink/70 max-w-sm font-medium leading-relaxed uppercase">
            Captured live on streets and stages across Mumbai, Delhi, and Bengaluru.
          </p>
        </div>

        {/* 4 Video Monitors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
          {CLIPS.map((clip) => {
            const isPlaying = activeClip === clip.id;

            return (
              <div
                key={clip.id}
                onClick={() => setActiveClip(isPlaying ? null : clip.id)}
                className="border-2 border-ink bg-paper p-3 flex flex-col justify-between group cursor-pointer"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-sand/30 border border-ink">
                  <Image
                    src={clip.image}
                    alt={clip.garment}
                    fill
                    className="object-cover object-center filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-ink/20 pointer-events-none" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 bg-brand border-2 border-paper text-paper flex items-center justify-center font-mono text-sm group-hover:scale-110 transition-all shadow-md">
                      ▶
                    </div>
                  </div>

                  {/* Tag Pill */}
                  <div className="absolute top-2 left-2 bg-ink text-paper font-mono text-[9px] px-2 py-0.5 uppercase font-bold">
                    {clip.tag}
                  </div>

                  {/* Caption */}
                  <div className="absolute bottom-2 inset-x-2 bg-ink/90 p-2 font-mono text-[9px] text-paper space-y-0.5">
                    <span className="text-brand font-bold block">{clip.handle}</span>
                    <span className="line-clamp-1 uppercase font-bold">{clip.garment}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
