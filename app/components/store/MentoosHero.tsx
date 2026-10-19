'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HERO_SLIDES = [
  {
    id: 1,
    tag: 'NEW ARRIVALS 2026',
    title: 'THE OVERSIZED REVOLUTION',
    subtitle: 'Heavyweight 240 GSM combed cotton tees designed for effortless style and maximum comfort.',
    ctaText: 'SHOP OVERSIZED TEES',
    ctaLink: '/products?category=t-shirts',
    bgGradient: 'from-slate-950 via-slate-900 to-amber-950/40',
    accentColor: 'text-amber-400',
    badge: 'BESTSELLER COLLECTION',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80&fm=webp',
  },
  {
    id: 2,
    tag: 'ETHNIC & FESTIVE CLASSICS',
    title: 'DESIGNER KURTAS & NEHRU JACKETS',
    subtitle: 'Elevate your festive look with hand-crafted linen kurtas and structured waistcoats.',
    ctaText: 'EXPLORE ETHNIC WEAR',
    ctaLink: '/products?category=ethnic-wear',
    bgGradient: 'from-stone-950 via-slate-900 to-amber-900/40',
    accentColor: 'text-amber-400',
    badge: 'LIMITED EDITION',
    imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=80&fm=webp',
  },
  {
    id: 3,
    tag: 'CASUAL & FORMAL ESSENTIALS',
    title: 'STREET & SMART TROUSERS',
    subtitle: 'Wrinkle-resistant chinos, relaxed cargo joggers, and tailored formal trousers.',
    ctaText: 'DISCOVER TROUSERS',
    ctaLink: '/products?category=trousers',
    bgGradient: 'from-neutral-950 via-slate-900 to-zinc-900',
    accentColor: 'text-amber-400',
    badge: 'EVERYDAY WEAR',
    imageUrl: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1200&q=80&fm=webp',
  },
];

const AUTOPLAY_MS = 6000;

export function MentoosHero() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  // All slides stay mounted so every photo is fetched up front. Previously the
  // single <img> src was swapped on each tick, which blanked the banner until
  // the next image finished downloading.
  const [loaded, setLoaded] = useState<number[]>([0]);
  const [failed, setFailed] = useState<number[]>([]);

  const goTo = useCallback((index: number) => {
    const count = HERO_SLIDES.length;
    setCurrent(((index % count) + count) % count);
  }, []);

  // Autoplay. Pausing on hover/focus (and while the tab is hidden) keeps the
  // timer from queueing up and then firing several slides at once.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Keyboard support for the carousel itself.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  };

  const slide = HERO_SLIDES[current];

  return (
    <section
      className="relative w-full overflow-hidden rounded-3xl bg-slate-950 shadow-2xl border border-slate-800"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {/* Background slides — crossfade between stacked images. */}
      {HERO_SLIDES.map((s, i) => {
        const active = i === current;
        const isLoaded = loaded.includes(i);
        const isFailed = failed.includes(s.id);
        return (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out motion-reduce:transition-none ${
              active ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={!active}
          >
            {!isFailed && (
              <img
                src={s.imageUrl}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  active ? 'animate-hero-kenburns' : ''
                } ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ transformOrigin: 'center' }}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                decoding="async"
                draggable={false}
                onLoad={() => setLoaded((prev) => (prev.includes(i) ? prev : [...prev, i]))}
                onError={() => setFailed((prev) => (prev.includes(s.id) ? prev : [...prev, s.id]))}
              />
            )}
            {/* Gradient keeps the slide readable even if the photo fails to load. */}
            <div className={`absolute inset-0 bg-gradient-to-r ${s.bgGradient} opacity-90`} />
          </div>
        );
      })}

      {/* Foreground content */}
      <div className="relative z-10 container mx-auto px-6 py-16 sm:py-24 md:py-32 flex flex-col justify-between min-h-[480px] sm:min-h-[560px]">
        <div key={current} className="flex flex-1 flex-col justify-center animate-hero-rise">
          {/* Top slide tag */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 backdrop-blur-md">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {slide.badge}
            </span>
            <span className="text-xs font-semibold text-slate-300 tracking-widest uppercase">
              {slide.tag}
            </span>
          </div>

          {/* Title, subtitle and calls to action */}
          <div className="max-w-2xl my-6 space-y-3 px-2 sm:px-4">
            <h1 className="text-3xl sm:text-5xl md:text-[3.5rem] lg:text-[4.2rem] font-black text-white tracking-tight leading-[0.95] drop-shadow-2xl">
              {slide.title.split(' ')[0]}{' '}
              <span className={slide.accentColor + ' drop-shadow-2xl'}>
                {slide.title.split(' ').slice(1).join(' ')}
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-200 font-medium leading-relaxed max-w-xl drop-shadow-md">
              {slide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href={slide.ctaLink}>
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-6 rounded-2xl text-sm sm:text-base shadow-lg shadow-amber-500/20 transition-all hover:scale-105">
                  {slide.ctaText}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/15 hover:text-white font-semibold px-6 py-6 rounded-2xl text-sm sm:text-base backdrop-blur-sm shadow-lg shadow-black/10 transition-all hover:scale-[1.02]">
                  VIEW ALL COLLECTIONS
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Carousel indicators & controls */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10 px-2 sm:px-4">
          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1} of ${HERO_SLIDES.length}`}
                aria-current={i === current}
                className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${
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
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors shadow-lg shadow-black/10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-slate-300 tabular-nums w-12 text-center">
              {current + 1} / {HERO_SLIDES.length}
            </span>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="Next slide"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors shadow-lg shadow-black/10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
