'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cinzel, outfit } from './fonts';

const CLIPS = [
  {
    id: 'c-01',
    creator: 'Kabir Varma',
    handle: '@kabir.v',
    city: 'Mumbai',
    garment: '280 GSM Raw Chalk Tee',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    tag: 'Fabric Drop Test',
  },
  {
    id: 'c-02',
    creator: 'Siddharth Roy',
    handle: '@sidroy',
    city: 'Bengaluru',
    garment: 'Belgian Linen Camp Shirt',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    tag: 'Afternoon Airflow',
  },
  {
    id: 'c-03',
    creator: 'Neil Sen',
    handle: '@neilsen',
    city: 'New Delhi',
    garment: 'Double-Pleated Gurkha',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    tag: 'Pleat Motion',
  },
  {
    id: 'c-04',
    creator: 'Arjun Nair',
    handle: '@arjun.n',
    city: 'Kochi',
    garment: 'Waffle Knit Overshirt',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
    tag: 'Resort Layering',
  },
];

export function Demo5Ugc() {
  const [activeClip, setActiveClip] = useState<string | null>(null);

  return (
    <section className={`relative bg-[#F4EFEA] text-[#2C241E] py-24 border-b border-[#E3DACD] ${cinzel.variable} ${outfit.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#E3DACD]">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B85D3B] font-serif font-bold block mb-2">
              Patron Motion
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#2C241E] tracking-tight">
              In Sunlit <span className="italic font-normal text-[#B85D3B]">Motion</span>
            </h2>
          </div>
          <p className="text-xs text-[#6B5C52] font-sans max-w-sm leading-relaxed">
            Authentic patron clips demonstrating natural fiber movement and unconstricted fit.
          </p>
        </div>

        {/* 4 Video Reels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12">
          {CLIPS.map((clip) => {
            const isPlaying = activeClip === clip.id;

            return (
              <div
                key={clip.id}
                onClick={() => setActiveClip(isPlaying ? null : clip.id)}
                className="group relative cursor-pointer rounded-t-[3rem] overflow-hidden bg-[#EAE2D8] border border-[#E3DACD] hover:border-[#B85D3B]/60 transition-all duration-500 flex flex-col shadow-sm"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#DDD4C7]">
                  <Image
                    src={clip.image}
                    alt={clip.garment}
                    fill
                    className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-700 ease-out"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2C241E]/80 via-transparent to-transparent pointer-events-none" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-[#F4EFEA]/80 backdrop-blur-sm border border-[#E3DACD] flex items-center justify-center text-[#B85D3B] group-hover:scale-110 group-hover:bg-[#B85D3B] group-hover:text-[#F4EFEA] transition-all duration-300">
                      <span className="text-xs ml-0.5">▶</span>
                    </div>
                  </div>

                  {/* Top Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-[#F4EFEA]/90 backdrop-blur-md rounded-full text-[9px] tracking-wider uppercase text-[#B85D3B] font-serif font-bold">
                      {clip.tag}
                    </span>
                  </div>

                  {/* Bottom Caption */}
                  <div className="absolute bottom-4 left-4 right-4 pointer-events-none space-y-0.5 text-[#F4EFEA]">
                    <span className="text-[10px] tracking-widest uppercase text-[#E08F6E] font-serif block">
                      {clip.handle}
                    </span>
                    <h3 className="font-serif text-sm line-clamp-1">
                      {clip.garment}
                    </h3>
                    <p className="text-[10px] text-[#F4EFEA]/70 font-sans">
                      {clip.city}
                    </p>
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
