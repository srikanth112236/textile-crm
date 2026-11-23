'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { plusJakarta, playfair } from './fonts';

const CLIPS = [
  {
    id: 'c-01',
    creator: 'Kabir Varma',
    handle: '@kabir.v',
    city: 'Mumbai',
    garment: '280 GSM Mineral Noir Tee',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    tag: 'Drape In Movement',
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
    tag: 'Pleat Structure',
  },
  {
    id: 'c-04',
    creator: 'Arjun Nair',
    handle: '@arjun.n',
    city: 'Kochi',
    garment: 'Textured Waffle Overshirt',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
    tag: 'Layering Profile',
  },
];

export function Demo3Ugc() {
  const [activeClip, setActiveClip] = useState<string | null>(null);

  return (
    <section className={`relative bg-[#FAF9F6] text-[#121214] py-24 border-b border-[#E7E5E0] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#E7E5E0]">
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#D97706] font-bold block mb-2">
              Patron Motion
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#121214] tracking-tight">
              In Real <span className="italic font-normal text-[#78716C]">Motion</span>
            </h2>
          </div>
          <p className="text-xs text-[#57534E] font-sans max-w-sm leading-relaxed">
            Patron clips captured under natural light, showing authentic drape and fabric weight.
          </p>
        </div>

        {/* 4 Video Frames */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12">
          {CLIPS.map((clip) => {
            const isPlaying = activeClip === clip.id;

            return (
              <div
                key={clip.id}
                onClick={() => setActiveClip(isPlaying ? null : clip.id)}
                className="group relative cursor-pointer rounded-3xl overflow-hidden bg-[#F5F3EE] border border-[#E7E5E0] hover:border-[#D97706]/60 transition-all duration-500 flex flex-col shadow-xs hover:shadow-md"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#EBE7DF]">
                  <Image
                    src={clip.image}
                    alt={clip.garment}
                    fill
                    className="object-cover object-center filter contrast-[1.02] group-hover:scale-105 transition-all duration-700 ease-out"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18181B]/80 via-transparent to-transparent pointer-events-none" />

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm border border-[#E0DCD4] flex items-center justify-center text-[#18181B] group-hover:scale-110 group-hover:bg-[#D97706] group-hover:text-white transition-all duration-300 shadow-md">
                      <span className="text-xs ml-0.5">▶</span>
                    </div>
                  </div>

                  {/* Top Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[9px] tracking-wider uppercase text-[#18181B] font-mono font-bold shadow-xs">
                      {clip.tag}
                    </span>
                  </div>

                  {/* Bottom Caption */}
                  <div className="absolute bottom-4 left-4 right-4 pointer-events-none space-y-0.5 text-[#FAF9F6]">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-[#FBBF24] font-bold block">
                      {clip.handle}
                    </span>
                    <h3 className="font-serif text-sm line-clamp-1">
                      {clip.garment}
                    </h3>
                    <p className="text-[10px] text-[#FAF9F6]/70 font-sans">
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
