'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ChevronUp, ChevronDown, Truck, DollarSign, ShieldCheck } from 'lucide-react';

const LOOKS = [
  {
    id: 'look-1',
    modelImage: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1000&q=80',
    tag: 'Caramel Cashmere Blend & Wool Trousers',
  },
  {
    id: 'look-2',
    modelImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=80',
    tag: 'Charcoal Minimalist Suit & Knitwear',
  },
  {
    id: 'look-3',
    modelImage: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1000&q=80',
    tag: 'Tailored Linen Overshirt & Chinos',
  },
];

export function ElevateEverydayStyle() {
  const [activeIndex, setActiveIndex] = useState(0);

  const prevLook = () => {
    setActiveIndex((prev) => (prev - 1 + LOOKS.length) % LOOKS.length);
  };

  const nextLook = () => {
    setActiveIndex((prev) => (prev + 1) % LOOKS.length);
  };

  const currentLook = LOOKS[activeIndex];

  return (
    <section
      aria-label="Elevate Your Everyday Style"
      className="relative overflow-hidden rounded-[36px] bg-[#1a1816] p-6 sm:p-10 text-white shadow-2xl border border-[#2b2724]"
    >
      {/* Top Grid: Left 2 stacked cards + Right tall card */}
      <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
        {/* Left Stacked Column (col-span-6 or col-span-7) */}
        <div className="flex flex-col justify-between gap-5 lg:col-span-6">
          {/* Top Left Card with Textured Warm Background & Terracotta Typography */}
          <div className="relative overflow-hidden rounded-[28px] bg-[#27231f] p-7 sm:p-9 border border-[#38332c] shadow-lg flex flex-col justify-between min-h-[220px]">
            {/* Subtle textured overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#3a342d_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

            <div className="relative z-10 space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-[42px] font-extrabold leading-[1.08] tracking-tight text-[#e59b7b]">
                Elevate Your<br />Everyday Style
              </h2>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d6b7a5] max-w-sm">
                Find outfits that match your personality. Premium quality, affordable prices.
              </p>
            </div>

            <div className="relative z-10 pt-6">
              <Link
                href="/products?sort=best-selling&order=desc"
                className="inline-flex items-center gap-2 rounded-full bg-[#e59b7b] px-5 py-2.5 text-xs font-extrabold tracking-wide text-slate-950 transition-all hover:bg-[#d88a68] hover:scale-105 active:scale-95 shadow-md"
              >
                explore more <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
              </Link>
            </div>
          </div>

          {/* Bottom Left Card: Wardrobe Essentials Shelf */}
          <div className="relative overflow-hidden rounded-[28px] bg-[#221f1c] p-4 sm:p-5 border border-[#35302a] shadow-lg min-h-[200px] flex items-center justify-center">
            <div className="relative aspect-[16/8] w-full overflow-hidden rounded-2xl bg-[#181614]">
              <Image
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80"
                alt="Curated wardrobe accessories, leather shoes and folded denim"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e59b7b] bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md">
                  Signature Essentials
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tall Hero Card (col-span-6) */}
        <div className="relative lg:col-span-6">
          <div className="relative h-[380px] sm:h-[460px] lg:h-full min-h-[460px] w-full overflow-hidden rounded-[28px] bg-[#ebe7df] shadow-xl">
            {LOOKS.map((look, idx) => (
              <div
                key={look.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <Image
                  src={look.modelImage}
                  alt={look.tag}
                  fill
                  priority={idx === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-[50%_25%]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-5 right-20">
                  <p className="text-xs font-semibold text-white/90 drop-shadow-md">
                    {look.tag}
                  </p>
                </div>
              </div>
            ))}

            {/* Right Side Navigation Dots & Up/Down Arrows (Exact from Reference Image 2) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3">
              {/* Pagination Dots */}
              <div className="flex flex-col items-center gap-2 mb-2">
                {LOOKS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? 'h-6 w-2 bg-[#1a1816]'
                        : 'h-2 w-2 bg-[#1a1816]/40 hover:bg-[#1a1816]/70'
                    }`}
                    aria-label={`Jump to look ${i + 1}`}
                  />
                ))}
              </div>

              {/* Up & Down Circular Buttons */}
              <button
                type="button"
                onClick={prevLook}
                aria-label="Previous look"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1816]/80 text-white backdrop-blur-md transition-all hover:bg-[#1a1816] hover:scale-110 shadow-md"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={nextLook}
                aria-label="Next look"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1816]/80 text-white backdrop-blur-md transition-all hover:bg-[#1a1816] hover:scale-110 shadow-md"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3-Pillar Feature Strip (Exact from Reference Image 2) */}
      <div className="mt-5 rounded-2xl bg-[#24201c] border border-[#332c25] p-4 sm:p-5 shadow-inner">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#3d362f] gap-4 sm:gap-0">
          <div className="flex items-center justify-center gap-3 px-4 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white shadow-sm">
              <Truck className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              Free Shipping & Returns
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 px-4 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white shadow-sm">
              <DollarSign className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              100% Money Back Guarantee
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 px-4 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              Safe and Secure Checkout
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
