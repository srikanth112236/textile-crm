'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const CLIPS = [
  {
    id: 'clip-01',
    testType: 'TEST: COLLAR ELASTIC RECOVERY',
    timecode: 'TC: 00:14:02:18',
    garment: '280 GSM Heavy Boxy Tee',
    operator: 'OP: @VARMA.K',
    fps: '60 FPS RAW',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'clip-02',
    testType: 'TEST: LINEN DRAPE DENSITY',
    timecode: 'TC: 00:22:10:04',
    garment: 'Camp-Collar Flax Shirt',
    operator: 'OP: @ROY.SID',
    fps: '60 FPS RAW',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'clip-03',
    testType: 'TEST: PLEAT CUFF BREAK',
    timecode: 'TC: 00:09:44:11',
    garment: 'Double-Pleated Gurkha',
    operator: 'OP: @NEIL.SEN',
    fps: '60 FPS RAW',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'clip-04',
    testType: 'TEST: SHOULDER DROP SEAM',
    timecode: 'TC: 00:18:31:22',
    garment: 'Heavyweight Waffle Knit',
    operator: 'OP: @NAIR.ARJUN',
    fps: '60 FPS RAW',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
  },
];

export function Demo2Ugc() {
  const [activeClip, setActiveClip] = useState<string | null>(null);

  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-2">
              <span className="w-2 h-2 bg-brand" />
              SYSTEM // 10 · KINEMATIC FOOTAGE
            </div>
            <h2 className="font-syne text-3xl sm:text-5xl font-black uppercase text-ink tracking-tight">
              FABRIC <span className="text-brand">IN MOTION TELEMETRY</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 max-w-sm uppercase leading-relaxed">
            Raw mobile captures recorded by community patrons. Inspect seam displacement and fabric fall under dynamic movement.
          </p>
        </div>

        {/* 4 Brutalist Video Monitors */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
          {CLIPS.map((clip) => {
            const isPlaying = activeClip === clip.id;

            return (
              <div
                key={clip.id}
                onClick={() => setActiveClip(isPlaying ? null : clip.id)}
                className="border-2 border-ink bg-paper p-3 flex flex-col justify-between group cursor-pointer"
              >
                {/* 9:16 Feed Frame */}
                <div className="relative aspect-[9/16] w-full bg-sand/30 overflow-hidden border border-ink">
                  <Image
                    src={clip.image}
                    alt={clip.garment}
                    fill
                    className="object-cover object-center filter grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-ink/20 pointer-events-none" />

                  {/* Top HUD */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between font-mono text-[9px] text-paper bg-ink/80 px-2 py-0.5">
                    <span>{clip.fps}</span>
                    <span className="text-brand font-bold">{clip.timecode}</span>
                  </div>

                  {/* Center Crosshair / Play Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 border-2 border-paper bg-ink/60 flex items-center justify-center text-paper font-mono text-xs group-hover:bg-brand group-hover:border-brand transition-all">
                      ▶
                    </div>
                  </div>

                  {/* Bottom HUD */}
                  <div className="absolute bottom-2 inset-x-2 bg-ink/90 p-2 font-mono text-[9px] text-paper space-y-0.5">
                    <span className="text-brand font-bold block">{clip.operator}</span>
                    <span className="line-clamp-1 uppercase">{clip.garment}</span>
                  </div>
                </div>

                {/* Test Identifier */}
                <div className="pt-3 font-mono text-[10px] text-ink font-bold uppercase tracking-wider">
                  {clip.testType}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
