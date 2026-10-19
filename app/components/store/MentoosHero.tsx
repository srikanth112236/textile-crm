'use client';

/**
 * MentoosHero — storefront hero carousel.
 *
 * Design contract (fixed, never "random"):
 *  - One contained rounded card, fixed heights per breakpoint (no layout shift).
 *  - All slide photos are mounted eagerly and only ever cross-fade Opacity.
 *    No continuous zoom/parallax (the old kenburns drift read as random).
 *  - Copy re-enters with one short, subtle rise per slide change.
 *  - Indicators bottom-left, prev/next + counter bottom-right. Keyboard
 *    arrows work while focused. Autoplay pauses on hover, focus and when
 *    the tab is hidden.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HERO_SLIDES = [
  {
    id: 1,
    badge: 'BESTSELLER COLLECTION',
    tag: 'NEW ARRIVALS 2026',
    title: 'THE OVERSIZED REVOLUTION',
    subtitle:
      'Heavyweight 240 GSM combed cotton tees designed for effortless style and maximum comfort.',
    ctaText: 'SHOP OVERSIZED TEES',
    ctaLink: '/products?category=t-shirts',
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80&fm=webp',
    gradient: 'bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/20',
  },
  {
    id: 2,
    badge: 'LIMITED EDITION',
    tag: 'ETHNIC & FESTIVE CLASSICS',
    title: 'DESIGNER KURTAS & NEHRU JACKETS',
    subtitle:
      'Elevate your festive look with hand-crafted linen kurtas and structured waistcoats.',
    ctaText: 'EXPLORE ETHNIC WEAR',
    ctaLink: '/products?category=ethnic-wear',
    image:
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1600&q=80&fm=webp',
    gradient: 'bg-gradient-to-r from-stone-950/95 via-slate-950/70 to-slate-950/20',
  },
  {
    id: 3,
    badge: 'EVERYDAY WEAR',
    tag: 'CASUAL & FORMAL ESSENTIALS',
    title: 'STREET & SMART TROUSERS',
    subtitle:
      'Wrinkle-resistant chinos, relaxed cargo joggers, and tailored formal trousers.',
    ctaText: 'DISCOVER TROUSERS',
    ctaLink: '/products?category=trousers',
    image:
      'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1600&q=80&fm=webp',
    gradient: 'bg-gradient-to-r from-neutral-950/95 via-slate-950/70 to-slate-950/20',
  },
];

const AUTOPLAY_MS = 7000;

export function MentoosHero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // Autoplay — single interval, reset-safe.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(
      () => setCurrent((prev) => (prev + 1) % HERO_SLIDES.length),
      AUTOPLAY_MS
    );
    return () => window.clearInterval(id);
  }, [paused]);

  // Pause while the tab is hidden (prevents queued multi-slide jumps).
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const goTo = useCallback((index: number) => {
    setCurrent(((index % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  };

  const slide = HERO_SLIDES[current];

  return (
    <section
      className="relative mx-auto h-[480px] w-full max-w-[1280px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl sm:h-[560px] lg:h-[620px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {/* Static base gradient — the card is never "empty" even before photos load. */}
      <div className="absolute inset-0 bg-slate-950" aria-hidden />

      {/* Photos: all mounted eagerly, opacity-only crossfade, zero transform. */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={s.id}
          aria-hidden={i !== current}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={s.image}
            alt=""
            draggable={false}
            loading="eager"
            decoding="async"
            fetchPriority={i === 0 ? 'high' : 'auto'}
            // Fixed object position: face/subject stays framed, never drifts.
            className="absolute inset-0 h-full w-full object-cover object-[50%_35%]"
          />
          {/* Readability gradient — static, ties the photo to the dark card. */}
          <div className={`absolute inset-0 ${s.gradient}`} />
        </div>
      ))}

      {/* Foreground copy */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-6 sm:px-10">
          <div
            key={current}
            className="max-w-2xl animate-hero-rise"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 backdrop-blur-md">
                <Flame className="h-3.5 w-3.5" />
                {slide.badge}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                {slide.tag}
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-black leading-[1.02] tracking-tight text-white drop-shadow-2xl sm:text-5xl lg:text-6xl">
              {slide.title.split(' ')[0]}{' '}
              <span className="text-amber-400">
                {slide.title.split(' ').slice(1).join(' ')}
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-200 drop-shadow-md sm:text-base md:text-lg">
              {slide.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={slide.ctaLink}>
                <Button
                  size="lg"
                  className="rounded-2xl bg-amber-500 px-8 py-6 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 hover:bg-amber-600 sm:text-base"
                >
                  {slide.ctaText}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/products">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-2xl border-white/40 bg-white/10 px-6 py-6 text-sm font-semibold text-white shadow-lg shadow-black/10 backdrop-blur-sm transition-all hover:scale-[1.02] hover:bg-white/20 hover:text-white sm:text-base"
                >
                  VIEW ALL COLLECTIONS
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom control bar: indicators left, counter + arrows right */}
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-slate-950/40 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-3.5 sm:px-10">
          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1} of ${HERO_SLIDES.length}`}
                aria-current={i === current}
                className={`h-2.5 rounded-full shadow-sm transition-all duration-300 ${
                  i === current ? 'w-8 bg-amber-500' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label="Previous slide"
              className="rounded-full bg-white/10 p-2.5 text-white shadow-lg shadow-black/10 backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="w-12 text-center text-xs font-semibold tabular-nums text-slate-300">
              {current + 1} / {HERO_SLIDES.length}
            </span>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="Next slide"
              className="rounded-full bg-white/10 p-2.5 text-white shadow-lg shadow-black/10 backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
