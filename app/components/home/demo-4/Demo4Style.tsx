'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { bebasNeue, dmSans } from './fonts';

const STYLES = [
  {
    title: 'METRO RUNWAY',
    env: 'URBAN TRANSIT & STREET CULTURE',
    garments: '280 GSM Heavy Boxy Tee + Pleated Chino',
    href: '/products?category=t-shirts',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'EXECUTIVE CASUAL',
    env: 'ARCHITECTURAL WORKPLACE CALIBRATION',
    garments: 'Structured Waffle Overshirt + Tailored Gurkha',
    href: '/products?category=shirts',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'COASTAL RESORT',
    env: 'HIGH TEMPERATURE NATURAL AIRFLOW',
    garments: 'Camp-Collar Belgian Linen + Drawstring Trouser',
    href: '/products?category=pants',
    image: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=800&q=80',
  },
];

export function Demo4Style() {
  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              ENVIRONMENT CURATIONS
            </span>
            <h2 className="font-bebas text-5xl sm:text-7xl text-ink uppercase tracking-tight">
              SHOP BY <span className="text-brand">STYLE PROTOCOL</span>
            </h2>
          </div>
          <p className="font-sans text-xs text-ink/70 max-w-sm font-medium leading-relaxed uppercase">
            Curated ensembles calibrated for specific ambient temperatures and dress codes.
          </p>
        </div>

        {/* 3 Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {STYLES.map((style, idx) => (
            <Link
              key={idx}
              href={style.href}
              className="group border-2 border-ink bg-paper p-5 flex flex-col justify-between hover:bg-ink hover:text-paper transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b-2 border-ink group-hover:border-paper font-mono text-[10px] uppercase font-bold transition-colors">
                  <span className="text-brand">PROTO 0{idx + 1}</span>
                  <span className="text-ink/60 group-hover:text-paper/60">{style.env}</span>
                </div>

                <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand/30 border-2 border-ink group-hover:border-paper my-5 transition-colors">
                  <Image
                    src={style.image}
                    alt={style.title}
                    fill
                    className="object-cover object-center filter grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <h3 className="font-bebas text-3xl uppercase tracking-wide group-hover:text-paper transition-colors">
                  {style.title}
                </h3>
                <p className="font-mono text-xs text-ink/70 group-hover:text-paper/70 mt-1 uppercase leading-relaxed transition-colors">
                  {style.garments}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-ink/20 group-hover:border-paper/20 flex items-center justify-between font-sans text-xs uppercase font-extrabold text-brand">
                <span>VIEW PROTOCOL</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
