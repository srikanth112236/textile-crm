'use client';

import React from 'react';
import Image from 'next/image';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const SURVEILLANCE_POSTS = [
  {
    id: 'sv-01',
    ref: 'CAM-NORTH // 01',
    iso: 'ISO 400 · 35MM',
    caption: '280 GSM DROP TEE · NEW DELHI INDUSTRIAL ARCHIVE',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'sv-02',
    ref: 'CAM-SOUTH // 02',
    iso: 'ISO 200 · 50MM',
    caption: '100% BELGIAN FLAX SHIRT · KOCHI DOCK TERMINAL',
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'sv-03',
    ref: 'CAM-EAST // 03',
    iso: 'ISO 800 · 28MM',
    caption: 'DOUBLE-PLEATED GURKHA · BENGALURU URBAN CONCRETE',
    image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 'sv-04',
    ref: 'CAM-WEST // 04',
    iso: 'ISO 100 · 85MM',
    caption: 'HEAVYWEIGHT WAFFLE WEAVE · MUMBAI COASTAL RESIDENCE',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
  },
];

export function Demo2Social() {
  return (
    <section className={`relative bg-sand/20 py-20 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-2">
              <span className="w-2 h-2 bg-brand" />
              SYSTEM // 11 · SURVEILLANCE WIRE
            </div>
            <h2 className="font-syne text-3xl sm:text-5xl font-black uppercase text-ink tracking-tight">
              FIELD CAPTURES <span className="text-brand">@MENTOOS.OFFICIAL</span>
            </h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs font-bold uppercase tracking-widest text-ink hover:text-brand transition-colors flex items-center gap-2"
          >
            <span>CONNECT FEED TELEMETRY</span>
            <span>↗</span>
          </a>
        </div>

        {/* 4 Technical Plates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {SURVEILLANCE_POSTS.map((post) => (
            <div
              key={post.id}
              className="border-2 border-ink bg-paper p-3 flex flex-col justify-between group"
            >
              {/* Image Frame */}
              <div className="relative aspect-[4/5] w-full bg-sand/30 overflow-hidden border border-ink">
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  className="object-cover object-center filter grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Overlay Metadata */}
                <div className="absolute top-2 left-2 bg-ink text-paper font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider">
                  {post.ref}
                </div>
                <div className="absolute top-2 right-2 bg-paper/90 text-ink font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider">
                  {post.iso}
                </div>
              </div>

              {/* Caption */}
              <div className="pt-3 font-mono text-[10px] text-ink/70 uppercase leading-snug">
                {post.caption}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
