'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Flame, Sparkles, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80&fm=webp`;

export const PRIMARY_SLIDES = [
  {
    image: U('photo-1552374196-1ab2a1c593e8'),
    eyebrow: 'NEW SEASON 2026 // DROP 01',
    badge: 'HEAVYWEIGHT 240 GSM',
    title: 'SHARP. RELAXED. YOURS.',
    subtitle: 'Heavyweight oversized tees, breathable linen and easy tailoring — engineered for how you actually move.',
    cta: 'SHOP NEW ARRIVALS',
    href: '/products?sort=createdAt&order=desc',
    tag: 'Drop-Shoulder Cut',
  },
  {
    image: U('photo-1602810318383-e386cc2a3ccf'),
    eyebrow: 'THE RESORT CAPSULE // DROP 02',
    badge: '100% PURE LINEN',
    title: 'AIRY. TEXTURED. TIMELESS.',
    subtitle: 'French flax shirts, airy Cuban collars and relaxed drawstring trousers designed for hot tropical days.',
    cta: 'EXPLORE LINEN EDIT',
    href: '/products?search=linen',
    tag: 'Pre-Washed Softness',
  },
  {
    image: U('photo-1617137968427-85924c800a22'),
    eyebrow: 'ROYAL INDO-WESTERN // DROP 03',
    badge: 'HANDCRAFTED LUXURY',
    title: 'MODERN ETHNIC REFINED.',
    subtitle: 'Embroidered short kurtas, structured Nehru waistcoats and festive coordinates with contemporary silhouettes.',
    cta: 'SHOP ETHNIC WEAR',
    href: '/products?category=ethnic-wear',
    tag: 'Festive Ready',
  },
];

const SECONDARY = [
  {
    image: U('photo-1516257984-b1b4d707412e', 900),
    eyebrow: 'UTILITY STREETWEAR',
    badge: 'TRENDING FIT',
    title: 'CARGO JOGGERS',
    subtitle: '6-pocket utility with ankle cinch.',
    href: '/products?category=joggers',
  },
  {
    image: U('photo-1479064555552-3ef4979f8908', 900),
    eyebrow: 'TAILORED CASUAL',
    badge: 'FLAT 20% OFF',
    title: 'PLEATED TROUSERS',
    subtitle: 'Smart drape for office & evening.',
    href: '/products?category=trousers',
  },
];

const QUICK_CHIPS = [
  { label: '🔥 Oversized Tees', href: '/products?search=oversized' },
  { label: '🌿 Pure Linen', href: '/products?search=linen' },
  { label: '👖 Cargo Joggers', href: '/products?category=joggers' },
  { label: '👑 Designer Kurtas', href: '/products?category=ethnic-wear' },
  { label: '👔 Smart Trousers', href: '/products?category=trousers' },
  { label: '⚡ Flat ₹500 Off', href: '/products?sort=best-selling&order=desc' },
];

export const HERO_PRELOAD_IMAGE = PRIMARY_SLIDES[0].image;

export function HeroEditorial() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % PRIMARY_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + PRIMARY_SLIDES.length) % PRIMARY_SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 5500);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  const active = PRIMARY_SLIDES[currentSlide];

  return (
    <div className="space-y-3">
      <section
        aria-label="Featured collections"
        className="grid gap-3 lg:grid-cols-[1.65fr_1fr]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Main Hero Slider */}
        <div className="group relative min-h-[460px] overflow-hidden rounded-[28px] bg-ink sm:min-h-[540px] lg:min-h-[600px] shadow-2xl">
          {PRIMARY_SLIDES.map((slide, idx) => (
            <div
              key={slide.title}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={idx === 0}
                sizes="(max-width: 1024px) 100vw, 65vw"
                className="object-cover object-[50%_28%] transition-transform duration-1000 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
            </div>
          ))}

          {/* Foreground Hero Content */}
          <div className="relative z-20 flex h-full flex-col justify-between p-6 text-white sm:p-9 lg:p-11">
            {/* Top Badge Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] backdrop-blur-md">
                  <Flame className="h-3 w-3 text-amber-300" /> {active.eyebrow}
                </span>
                <span className="rounded-full border border-amber-300/30 bg-amber-400/20 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                  {active.badge}
                </span>
              </div>

              {/* Slider Arrow Controls */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 p-1 backdrop-blur-md">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                  className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-1 text-[11px] font-bold tracking-widest text-white/90">
                  0{currentSlide + 1} / 0{PRIMARY_SLIDES.length}
                </span>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Bottom Content Area */}
            <div className="max-w-[620px]">
              <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-300">
                <Sparkles className="h-3.5 w-3.5" /> Modern menswear · Engineered for fit
              </p>
              <h1 className="text-balance text-[clamp(2.35rem,5.5vw,4.4rem)] font-extrabold leading-[0.94] tracking-[-0.04em] text-white">
                {active.title}
              </h1>
              <p className="mt-3.5 max-w-[480px] text-sm leading-relaxed text-white/80 sm:text-base">
                {active.subtitle}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={active.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 transition-all hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-400/25 active:scale-95"
                >
                  {active.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <div className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/35 px-4 py-3 text-xs font-semibold text-white/90 backdrop-blur-md">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>10,000+ Happy Customers Across India</span>
                </div>
              </div>
            </div>

            {/* Interactive Progress Indicators */}
            <div className="mt-6 flex items-center gap-2">
              {PRIMARY_SLIDES.map((slide, idx) => (
                <button
                  key={slide.title}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`group/btn relative h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentSlide ? 'w-10 bg-amber-400' : 'w-4 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Jump to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Dual Tiles */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
          {SECONDARY.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative min-h-[240px] overflow-hidden rounded-[24px] bg-ink lg:min-h-0 shadow-lg border border-line/40"
            >
              <Image
                src={card.image}
                alt={card.title}
                fill
                sizes="(max-width: 1024px) 50vw, 35vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
              <div className="relative flex h-full flex-col justify-end p-5 text-white sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-amber-300">
                    {card.eyebrow}
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                    {card.badge}
                  </span>
                </div>
                <h2 className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl text-white group-hover:text-amber-300 transition-colors">
                  {card.title}
                </h2>
                <p className="mt-1 text-xs text-white/70 line-clamp-1">{card.subtitle}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-300">
                  Shop Collection <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Discovery Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
        <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-widest text-ink-muted pl-1">
          Trending Now:
        </span>
        {QUICK_CHIPS.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className="shrink-0 rounded-full border border-line bg-sand/70 px-3.5 py-1.5 text-xs font-bold text-ink transition-all hover:border-amber-500/50 hover:bg-amber-400 hover:text-slate-950 shadow-sm"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
