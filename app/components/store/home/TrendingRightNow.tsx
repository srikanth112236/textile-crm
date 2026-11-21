'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';

const TRENDING_CARDS = [
  {
    id: 'trending-1',
    title: 'Street-Ready Silhouettes',
    tagline: '240 GSM Heavyweight Combed Cotton',
    subtitle: 'Stay sharp with dropped shoulders, dense collar ribbing, and pure streetwear drape.',
    cta: 'Explore Fit',
    href: '/products?search=oversized',
    bgGradient: 'bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617]',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80',
    badge: { text: 'HEAVYWEIGHT', style: 'bg-amber-400 text-neutral-950 font-black' },
  },
  {
    id: 'trending-2',
    title: 'Everyday Resort Linen',
    tagline: '100% French Flax • Pre-Washed',
    subtitle: 'Breezy camp collars and airy weaves engineered for all-day comfort in tropical heat.',
    cta: 'Shop Linen',
    href: '/products?search=linen',
    bgGradient: 'bg-gradient-to-br from-[#27272a] via-[#18181b] to-[#09090b]',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80',
    badge: { text: 'NATURAL FIBER', style: 'bg-emerald-400 text-neutral-950 font-black' },
  },
  {
    id: 'trending-3',
    title: 'Utility Cargo Form',
    tagline: '6-Pocket Mobility • Stretch Twill',
    subtitle: 'Reinforced bar-tacking, ergonomic knee room, and clean ribbed cuffs for sneakers.',
    cta: 'Shop Cargos',
    href: '/products?category=joggers',
    bgGradient: 'bg-gradient-to-br from-[#1c1917] via-[#0c0a09] to-[#000000]',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
    badge: { text: 'UTILITY TWILL', style: 'bg-neutral-200 text-neutral-950 font-black' },
  },
  {
    id: 'trending-4',
    title: 'Modern Festive Kurta',
    tagline: 'Textured Slub Weave • Mandarin Collar',
    subtitle: 'Understated elegance with coconut shell buttons, designed for weddings and festivities.',
    cta: 'Shop Festive',
    href: '/products?category=ethnic-wear',
    bgGradient: 'bg-gradient-to-br from-[#292524] via-[#1c1917] to-[#0c0a09]',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80',
    badge: { text: 'ARTISAN WEAVE', style: 'bg-amber-300 text-neutral-950 font-black' },
  },
];

export function TrendingRightNow() {
  return (
    <section aria-labelledby="trending-right-now-title" className="py-4">
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Seasonal Spotlights
          </span>
          <h2
            id="trending-right-now-title"
            className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white"
          >
            TRENDING RIGHT NOW
          </h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Handpicked high-rotation pieces defined by premium weight, tailored drape, and clean detailing.
          </p>
        </div>

        <Link
          href="/products?sort=best-selling&order=desc"
          className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-900 hover:text-amber-600 transition-colors dark:text-neutral-200"
        >
          View Trending Drops
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* 2x2 Chamfered Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {TRENDING_CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className={`group relative overflow-hidden rounded-[24px] ${card.bgGradient} p-6 sm:p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 min-h-[220px] flex items-center justify-between border border-white/10`}
            style={{
              clipPath:
                'polygon(28px 0%, 100% 0%, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0% 100%, 0% 28px)',
            }}
          >
            {/* Top Badge */}
            {card.badge && (
              <div
                className={`absolute right-6 top-5 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider shadow-sm ${card.badge.style}`}
              >
                {card.badge.text}
              </div>
            )}

            {/* Left Copy */}
            <div className="relative z-10 max-w-[58%] space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {card.tagline}
              </p>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white group-hover:text-amber-300 transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
                {card.subtitle}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-neutral-950 px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-md transition-all group-hover:bg-amber-400 group-hover:scale-105">
                  {card.cta} <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            {/* Right Model Imagery */}
            <div className="relative h-44 w-36 sm:h-52 sm:w-44 shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-md">
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
