'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';
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

export function MentoosHero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[current];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 shadow-2xl border border-slate-800">
      {/* Background Hero Image */}
      <img
        src={slide.imageUrl}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out"
        style={{ transform: `scale(${current === 0 ? 1.05 : 1})` }}
        loading="eager"
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} opacity-90`} />

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 py-16 sm:py-24 md:py-32 flex flex-col justify-between min-h-[480px] sm:min-h-[560px]">
        {/* Top Slide Tag */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            {slide.badge}
          </span>
          <span className="text-xs font-semibold text-slate-300 tracking-widest uppercase">
            {slide.tag}
          </span>
        </div>

        {/* Hero Title & Subtitle */}
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

          {/* Action Buttons */}
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

        {/* Carousel Indicators & Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10 px-2 sm:px-4">
          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                className={`h-2.5 rounded-full transition-all duration-300 shadow-sm ${
                  i === current ? 'w-8 bg-amber-400 scale-110 shadow-amber-400/40' : 'w-2.5 bg-white/30 hover:bg-white/60 scale-100'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrent((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors shadow-lg shadow-black/10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[11px] font-extrabold text-white/70 tracking-widest hidden sm:inline">{current + 1} / {HERO_SLIDES.length}</span>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % HERO_SLIDES.length)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors shadow-lg shadow-black/10"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
