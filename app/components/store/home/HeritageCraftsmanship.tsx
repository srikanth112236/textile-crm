'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeritageCraftsmanship() {
  return (
    <section aria-labelledby="heritage-craft-title" className="py-4">
      {/* Top Header & Metrics Block */}
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end mb-8">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#64aa34]">
            ABOUT US
          </span>
          <h2
            id="heritage-craft-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink mt-1.5"
          >
            Heritage Meets<br />Modern Craftsmanship
          </h2>
          <div className="mt-4">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full bg-[#c6f03d] px-5 py-2.5 text-xs font-extrabold text-slate-950 transition-all hover:bg-[#b8e232] hover:scale-105 active:scale-95 shadow-sm"
            >
              <span>Learn More About Us</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-white">
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>

        {/* Stats on the right (Ref: Image 1) */}
        <div className="flex items-center gap-8 border-l border-line pl-6">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">230k+</p>
            <p className="text-xs text-ink-muted font-medium mt-0.5">Influenced People</p>
          </div>
          <div className="h-8 w-px bg-line" />
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">9 / 10</p>
            <p className="text-xs text-ink-muted font-medium mt-0.5">Clients Recommend</p>
          </div>
        </div>
      </div>

      {/* 3 Visual Cards Layout (Ref: Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5">
        {/* Left Card: Linen Model */}
        <div className="sm:col-span-4 relative aspect-[3/4] overflow-hidden rounded-[28px] bg-sand border border-line shadow-sm group">
          <Image
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"
            alt="Mentoos artisan tailoring"
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
              Artisanal Weaves
            </span>
            <p className="text-sm font-extrabold text-white mt-0.5">
              Natural French Flax & Slub Cotton
            </p>
          </div>
        </div>

        {/* Center Card: Large "FASHION" typography overlay with Orange Knit model */}
        <div className="sm:col-span-5 relative aspect-[3/4] overflow-hidden rounded-[28px] bg-ink border border-line shadow-md group">
          <Image
            src="https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80"
            alt="Mentoos Fashion Statement"
            fill
            sizes="(max-width: 640px) 100vw, 42vw"
            className="object-cover object-[50%_20%] transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

          {/* Centered Large Bold FASHION Text Overlay (Ref: Image 1) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-wider text-white/95 uppercase drop-shadow-xl">
              FASHION
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
            <div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold backdrop-blur-md">
                Drop 2026
              </span>
              <p className="text-base font-extrabold mt-1.5">Redefined Silhouettes</p>
            </div>
            <Link
              href="/products?sort=createdAt&order=desc"
              className="rounded-full bg-[#c6f03d] p-2 text-slate-950 hover:scale-110 transition-transform shadow-md"
            >
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Card: Detail Model */}
        <div className="sm:col-span-3 relative aspect-[3/4] overflow-hidden rounded-[28px] bg-sand border border-line shadow-sm group">
          <Image
            src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80"
            alt="Mentoos Modern Styling"
            fill
            sizes="(max-width: 640px) 100vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#c6f03d]">
              Everyday Sharp
            </span>
            <p className="text-xs font-extrabold text-white mt-0.5">
              Precision Fit & Finish
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
