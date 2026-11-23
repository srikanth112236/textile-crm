'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

const STYLES = [
  {
    code: 'ENV-01',
    title: 'METROPOLITAN MONOCHROME',
    environment: 'DAILY URBAN TRANSIT',
    garments: '280 GSM Heavy Boxy Tee + Pleated Chino',
    href: '/products?category=t-shirts',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
    palette: ['#121212', '#2D2D2D', '#D8D4CE'],
  },
  {
    code: 'ENV-02',
    title: 'ATELIER WORKPLACE',
    environment: 'MINIMALIST BUSINESS CALIBRATION',
    garments: 'Structured Collar Overshirt + Tailored Gurkha',
    href: '/products?category=shirts',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    palette: ['#1E2229', '#4A5043', '#EFECE6'],
  },
  {
    code: 'ENV-03',
    title: 'RESORT & LITTORAL',
    environment: 'HIGH TEMPERATURE AIRFLOW',
    garments: 'Camp-Collar Belgian Linen + Drawstring Trouser',
    href: '/products?category=pants',
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=800&q=80',
    palette: ['#D6C7B2', '#8C7B65', '#FAF7F2'],
  },
];

export function Demo2Style() {
  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-2">
              <span className="w-2 h-2 bg-brand" />
              SYSTEM // 07 · OPERATIONAL ENVIRONMENTS
            </div>
            <h2 className="font-syne text-3xl sm:text-5xl font-black uppercase text-ink tracking-tight">
              SHOP BY <span className="text-brand">OCCASION PROTOCOL</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 max-w-sm uppercase leading-relaxed">
            Curated garment ensembles calibrated for specific ambient temperatures, functional mobility, and social settings.
          </p>
        </div>

        {/* 3 Environment Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {STYLES.map((style) => (
            <Link
              key={style.code}
              href={style.href}
              className="group border-2 border-ink bg-paper flex flex-col justify-between hover:bg-ink hover:text-paper transition-all duration-300"
            >
              {/* Top Bar */}
              <div className="p-4 border-b-2 border-ink group-hover:border-paper flex items-center justify-between font-mono text-[10px] uppercase transition-colors">
                <span className="font-bold text-brand">{style.code}</span>
                <span className="text-ink/60 group-hover:text-paper/60">{style.environment}</span>
              </div>

              {/* Visual Plate */}
              <div className="relative aspect-[4/3] w-full bg-sand/30 overflow-hidden border-b-2 border-ink group-hover:border-paper transition-colors">
                <Image
                  src={style.image}
                  alt={style.title}
                  fill
                  className="object-cover object-center filter grayscale contrast-[1.05] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              {/* Bottom Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-syne text-lg font-black uppercase tracking-tight group-hover:text-paper transition-colors">
                    {style.title}
                  </h3>
                  <p className="font-mono text-[11px] text-ink/70 group-hover:text-paper/70 mt-2 uppercase leading-relaxed transition-colors">
                    {style.garments}
                  </p>
                </div>

                {/* Swatches & Arrow */}
                <div className="pt-4 mt-6 border-t border-ink/20 group-hover:border-paper/20 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {style.palette.map((color, i) => (
                      <span
                        key={i}
                        style={{ backgroundColor: color }}
                        className="w-4 h-4 border border-ink/30 block"
                      />
                    ))}
                  </div>
                  <span className="font-mono text-xs text-brand uppercase font-bold group-hover:translate-x-1 transition-transform">
                    ACCESS PROTOCOL →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
