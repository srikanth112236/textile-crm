'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fraunces, manrope } from './fonts';

const POSTS = [
  {
    id: 'p-1',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
    tag: '@mentoos.official',
    caption: 'Pure linen textured twill. Shot on location in Fort Kochi.',
  },
  {
    id: 'p-2',
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=700&q=80',
    tag: '#MentoosDrape',
    caption: 'Double-pleated drape in movement. Heavyweight mineral cotton.',
  },
  {
    id: 'p-3',
    image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=700&q=80',
    tag: '@mentoos.official',
    caption: 'Boxy drop-shoulder proportions engineered for all-day structure.',
  },
  {
    id: 'p-4',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=700&q=80',
    tag: '#AtelierMentoos',
    caption: 'The Summer Palette: Natural Oat, Bone White, Mineral Sand.',
  },
  {
    id: 'p-5',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80',
    tag: '@mentoos.official',
    caption: 'Vol. XXIV editorial outtakes. Photographed by Sharan K.',
  },
];

export function Demo1Social() {
  return (
    <section className={`relative bg-sand/20 py-24 sm:py-32 border-b border-line/60 ${manrope.variable} ${fraunces.variable} font-sans overflow-hidden`}>
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-line">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[10px] tracking-widest text-ink/40 uppercase">Chapter 11</span>
              <span className="w-8 h-px bg-ink/20" />
              <span className="font-mono text-[10px] tracking-widest text-brand uppercase">The Contact Sheet</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-ink tracking-tight">
              Dispatches From <span className="italic font-normal">The Atelier</span>
            </h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs tracking-widest uppercase text-ink hover:text-brand transition-colors flex items-center gap-2 group"
          >
            <span>Follow @mentoos.official</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>

        {/* 5-Column Editorial Contact Strip */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4">
          {POSTS.map((post, idx) => (
            <div
              key={post.id}
              className={`group relative flex flex-col ${idx === 4 ? 'col-span-2 md:col-span-1' : ''}`}
            >
              <div className="relative aspect-[3/4] w-full bg-sand/40 overflow-hidden border border-line">
                <Image
                  src={post.image}
                  alt={post.caption}
                  fill
                  className="object-cover object-center filter grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
                <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-paper text-ink shadow-sm">
                    ↗
                  </span>
                </div>
              </div>

              <div className="pt-3 space-y-1">
                <span className="font-mono text-[9px] tracking-widest text-brand uppercase">
                  {post.tag}
                </span>
                <p className="font-sans text-[11px] text-ink/60 line-clamp-2 leading-relaxed">
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
