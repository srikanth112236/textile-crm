'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Heart, Instagram, Play, RotateCcw, Ruler, ShieldCheck, Star, Truck } from 'lucide-react';
import { Header } from '@/components/navigation/Header';
import { TiltCard } from '@/components/home/demo-shared/TiltCard';
import { EASE_OUT, useDemoScroll } from '@/components/home/demo-shared/useDemoScroll';
import {
  BEST_SELLERS,
  CATEGORIES,
  FITS,
  LOOKS,
  NEW_ARRIVALS,
  OFFERS,
  REVIEWS,
  SOCIAL,
  STYLES,
  TRENDING,
  TRUST,
  UGC,
} from '@/components/home/demo-shared/demoContent';
import { fraunces, manrope } from './fonts';

const ROTATING = ['Tailoring', 'Linen', 'Quiet Form', 'Presence'];
const TRUST_ICONS = [Truck, RotateCcw, Ruler, ShieldCheck];
const serif = { fontFamily: 'var(--font-fraunces)' } as const;

function SectionHead({ kicker, title, action }: { kicker: string; title: string; action?: string }) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#161310]/45">{kicker}</p>
        <h2 className="mt-3 text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1.05] tracking-[-0.03em]" style={serif}>
          {title}
        </h2>
      </div>
      {action ? (
        <Link
          href="/products"
          className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#161310]/55 hover:text-[#b7791f]"
        >
          {action}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}

export function Demo1Page() {
  const scope = useRef<HTMLDivElement>(null);
  const [word, setWord] = useState(0);
  const [chapter, setChapter] = useState(0);
  const [quote, setQuote] = useState(0);

  useDemoScroll(scope);

  useEffect(() => {
    const id = window.setInterval(() => setWord((w) => (w + 1) % ROTATING.length), 3200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setQuote((q) => (q + 1) % REVIEWS.length), 5600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      ref={scope}
      className={`${fraunces.variable} ${manrope.variable} relative min-h-screen overflow-x-clip bg-[#f7f3ec] text-[#161310]`}
      style={{ fontFamily: 'var(--font-manrope)' }}
    >
      {/* ── 0. SITE HEADER (shared, unchanged) ───────────────────── */}
      <Header />

      {/* ── 1. HERO ──────────────────────────────────────────────── */}
      <section data-parallax-scope className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 lg:px-14 lg:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-[42%] -translate-y-1/2 select-none text-center">
          <span
            className="block leading-[0.72] tracking-[-0.06em] text-[#161310]/[0.05]"
            style={{ ...serif, fontSize: 'clamp(6rem, 22vw, 22rem)' }}
          >
            ATELIER
          </span>
        </div>

        <div className="relative mx-auto grid max-w-[1440px] items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-6 flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-[#161310]/45">
              <span className="h-px w-10 bg-[#161310]/30" />
              Vol. XXIV · AW26
            </div>
            <h1 className="text-[clamp(2.7rem,6.8vw,5.9rem)] leading-[0.93] tracking-[-0.045em]" style={serif}>
              The architecture
              <br />
              of{' '}
              <span className="relative inline-block min-w-[6.2em] italic text-[#b7791f]">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={ROTATING[word]}
                    initial={{ y: '0.6em', opacity: 0, filter: 'blur(6px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: '-0.6em', opacity: 0, filter: 'blur(6px)' }}
                    transition={{ duration: 0.65, ease: EASE_OUT }}
                    className="inline-block"
                  >
                    {ROTATING[word]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
            <p className="mt-8 max-w-md text-sm leading-relaxed text-[#161310]/65">
              A slow-made wardrobe in Belgian flax, 240 GSM combed cotton and half-canvassed wool.
              Cut once, worn for years.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="group inline-flex items-center gap-3 rounded-full bg-[#161310] px-7 py-3.5 text-[10px] uppercase tracking-[0.28em] text-[#f7f3ec] transition-colors hover:bg-[#b7791f]"
              >
                Enter the collection
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/about"
                className="text-[10px] uppercase tracking-[0.28em] text-[#161310]/55 underline decoration-[#161310]/20 underline-offset-8 hover:text-[#161310]"
              >
                The making of
              </Link>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div data-parallax="0.34" className="relative ml-auto aspect-[4/5] w-[74%] overflow-hidden rounded-t-[180px] bg-[#e8e0d2]">
              <Image
                src={LOOKS[1].img}
                alt="Editorial menswear look"
                fill
                priority
                sizes="(max-width: 1024px) 74vw, 30vw"
                className="object-cover object-top"
              />
            </div>
            <div
              data-parallax="-0.26"
              className="absolute -bottom-12 left-0 w-[52%] overflow-hidden rounded-sm border-4 border-[#f7f3ec] bg-[#e8e0d2] shadow-[0_30px_60px_-30px_rgba(22,19,16,0.5)]"
            >
              <div className="relative aspect-square">
                <Image src={NEW_ARRIVALS[0].img} alt="Cotton detail" fill priority sizes="(max-width: 1024px) 52vw, 20vw" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SHOP BY CATEGORY ──────────────────────────────────── */}
      <section className="border-y border-[#161310]/10 px-5 py-20 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1440px]">
          <SectionHead kicker="Index 02" title="Shop by category" action="All categories" />
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="border-t border-[#161310]/15">
                {CATEGORIES.map((c, i) => (
                  <Link
                    key={c.name}
                    href="/products"
                    onMouseEnter={() => setChapter(i)}
                    onFocus={() => setChapter(i)}
                    className="group flex items-center justify-between gap-4 border-b border-[#161310]/15 py-5 transition-colors hover:text-[#b7791f]"
                  >
                    <span className="flex items-baseline gap-5">
                      <span className="text-[10px] tracking-[0.3em] text-[#161310]/35">0{i + 1}</span>
                      <span className="text-xl tracking-[-0.02em] sm:text-2xl" style={serif}>
                        {c.name}
                      </span>
                    </span>
                    <span className="flex items-center gap-4 text-[10px] uppercase tracking-[0.22em] text-[#161310]/40">
                      {c.count}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="relative aspect-[16/11] overflow-hidden bg-[#e8e0d2]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={chapter}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: EASE_OUT }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={CATEGORIES[chapter].img}
                      alt={CATEGORIES[chapter].name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 48vw"
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
                <span className="absolute bottom-3 left-3 bg-[#f7f3ec]/90 px-3 py-1 text-[9px] uppercase tracking-[0.28em]">
                  {CATEGORIES[chapter].name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. NEW ARRIVALS ──────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <SectionHead kicker="Index 03" title="New arrivals" action="New in" />
          <div data-reveal-group className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {NEW_ARRIVALS.map((p, i) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#e2d9c8]">
                  <Image
                    src={p.img}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 23vw"
                    className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                  />
                  <span className="absolute left-3 top-3 text-[10px] tracking-[0.3em] text-[#161310]/60">0{i + 1}</span>
                  <span className="absolute bottom-3 left-3 bg-[#f7f3ec]/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.26em] text-[#161310]/70">
                    {p.tag}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h3 className="text-base italic leading-snug" style={serif}>
                    {p.name}
                  </h3>
                  <span className="text-sm text-[#161310]/70">{p.price}</span>
                </div>
                <span className="mt-2 block h-px w-0 bg-[#b7791f] transition-all duration-500 group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. TRENDING NOW (snap rail) ──────────────────────────── */}
      <section className="border-y border-[#161310]/10 bg-[#efe9df] py-20">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
          <SectionHead kicker="Index 04" title="Trending now" action="Shop trending" />
        </div>
        <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 sm:px-8 lg:px-14">
          {TRENDING.map((p, i) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="group w-[78vw] shrink-0 snap-start sm:w-[44vw] lg:w-[30vw]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#e2d9c8]">
                <Image
                  src={p.img}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 78vw, 30vw"
                  className="object-cover transition-transform duration-[1000ms] group-hover:scale-105"
                />
                <span className="absolute right-3 top-3 rounded-full bg-[#161310]/85 px-2.5 py-1 text-[9px] uppercase tracking-[0.24em] text-[#f7f3ec]">
                  {p.tag}
                </span>
              </div>
              <div className="mt-4 flex items-baseline justify-between border-t border-[#161310]/15 pt-3">
                <div>
                  <h3 className="text-lg italic" style={serif}>
                    {p.name}
                  </h3>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-[#161310]/40">
                    0{i + 1} · {p.colour}
                  </p>
                </div>
                <span className="text-sm text-[#161310]/70">{p.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5. BEST SELLERS ──────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <SectionHead kicker="Index 05" title="Best sellers" action="Ranked by you" />
          <div className="grid gap-10 lg:grid-cols-2">
            {BEST_SELLERS.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group flex items-center gap-5 border-b border-[#161310]/12 pb-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#b7791f]">{p.tag}</span>
                <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-[#e2d9c8]">
                  <Image src={p.img} alt={p.name} fill sizes="80px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-xl italic" style={serif}>
                    {p.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#161310]/45">
                    <Star className="h-3 w-3 fill-[#b7791f] text-[#b7791f]" />
                    {p.rating} · {p.reviews} reviews
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{p.price}</p>
                  <ArrowUpRight className="ml-auto mt-1 h-4 w-4 text-[#161310]/30 transition-colors group-hover:text-[#b7791f]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. SHOP BY FIT ───────────────────────────────────────── */}
      <section className="bg-[#161310] px-5 py-20 text-[#f7f3ec] sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#f7f3ec]/40">Index 06</p>
            <h2 className="mt-3 text-[clamp(1.9rem,3.6vw,2.9rem)] leading-none" style={serif}>
              Shop by fit
            </h2>
          </div>
          <div data-reveal-group className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {FITS.map((f, i) => (
              <Link key={f.name} href="/products" className="group relative overflow-hidden">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={f.img}
                    alt={f.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 23vw"
                    className="object-cover grayscale transition-all duration-[900ms] group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                </div>
                <div className="absolute inset-x-4 bottom-4">
                  <span className="text-[10px] tracking-[0.3em] text-[#d8a25a]">0{i + 1}</span>
                  <h3 className="text-xl italic" style={serif}>
                    {f.name}
                  </h3>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/60">{f.note}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. SHOP BY STYLE ─────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <SectionHead kicker="Index 07" title="Shop by style" action="Four moods" />
          <div className="space-y-8">
            {STYLES.map((s, i) => (
              <Link
                key={s.name}
                href="/products"
                className={`group grid items-center gap-8 border-t border-[#161310]/12 pt-8 md:grid-cols-2 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#e2d9c8]">
                  <Image
                    src={s.img}
                    alt={s.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 48vw"
                    className="object-cover transition-transform duration-[1000ms] group-hover:scale-[1.04]"
                  />
                </div>
                <div className={i % 2 ? 'md:pr-10' : 'md:pl-10'}>
                  <span className="text-[10px] tracking-[0.32em] text-[#b7791f]">0{i + 1}</span>
                  <h3 className="mt-2 text-[clamp(1.6rem,3vw,2.4rem)] leading-tight" style={serif}>
                    {s.name}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#161310]/60">{s.note}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-[#161310]/55 group-hover:text-[#b7791f]">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. SHOP THE LOOK (pinned) ────────────────────────────── */}
      <section className="relative flex items-center overflow-x-auto bg-[#efe9df] pb-14 pt-28 lg:h-[100svh] lg:overflow-hidden lg:py-0">
        <div className="pointer-events-none absolute left-5 top-8 z-10 sm:left-8 lg:left-14">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#161310]/40">Index 08</p>
          <h2 className="mt-2 text-4xl tracking-[-0.03em] sm:text-5xl" style={serif}>
            Shop the look
          </h2>
        </div>
        <div data-hscroll className="flex w-max snap-x snap-mandatory items-center gap-8 px-5 sm:px-8 lg:px-14 lg:pl-[34vw]">
          {LOOKS.map((l) => (
            <article key={l.title} className="group w-[70vw] shrink-0 sm:w-[42vw] lg:w-[28vw]">
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={l.img}
                  alt={l.title}
                  fill
                  sizes="(max-width: 640px) 70vw, 28vw"
                  className="object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                />
                <span className="absolute left-3 top-3 text-[10px] uppercase tracking-[0.3em] text-white/80">{l.note}</span>
              </div>
              <h3 className="mt-4 text-lg italic" style={serif}>
                {l.title}
              </h3>
              <ul className="mt-2 space-y-1 text-[10px] uppercase tracking-[0.2em] text-[#161310]/45">
                {l.pieces.map((piece) => (
                  <li key={piece}>— {piece}</li>
                ))}
              </ul>
            </article>
          ))}
          <div className="w-[8vw] shrink-0" />
        </div>
      </section>

      {/* ── 8b. FULL-SCREEN PRODUCT TAKEOVER ────────────────────── */}
      <section data-parallax-scope className="relative h-[185svh] bg-[#efe9df]">
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-[26vw] leading-none tracking-[-0.06em] text-[#161310]/[0.055]"
            style={serif}
          >
            LINEN
          </span>
          <div className="relative z-10 mx-auto grid w-full max-w-[1080px] grid-cols-3 items-center gap-3 px-4 sm:gap-8 sm:px-8">
            {[NEW_ARRIVALS[1], TRENDING[0], BEST_SELLERS[1]].map((p, i) => (
              <div key={p.id} data-parallax={i === 1 ? '0.3' : '-0.2'} className={i === 1 ? 'sm:-translate-y-8' : 'sm:translate-y-10'}>
                <div className="relative aspect-[3/4] overflow-hidden bg-[#e2d9c8]">
                  <Image src={p.img} alt={p.name} fill sizes="(max-width: 640px) 30vw, 24vw" className="object-cover" />
                </div>
                <div className="mt-2 flex flex-col gap-0.5 sm:mt-3 sm:flex-row sm:items-baseline sm:justify-between">
                  <span className="text-[9px] uppercase tracking-[0.18em] sm:text-[10px]">{p.name}</span>
                  <span className="text-[9px] text-[#161310]/60 sm:text-[10px]">{p.price}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] uppercase tracking-[0.32em] text-[#161310]/45">
            The linen edit · 22 pieces · scroll
          </div>
        </div>
      </section>

      {/* ── 8c. 3D FITTING ROOM ──────────────────────────────────── */}
      <section className="bg-[#e8e0d2] px-5 py-20 sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#161310]/40">08c · Interactive</p>
            <h2 className="mt-3 text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[1.06]" style={serif}>Turn it in your hand</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#161310]/60">
              Move your cursor across the card. The garment sits on three layers, so the drape and the
              trim read from any angle.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['S', 'M', 'L', 'XL'].map((s) => (
                <span key={s} className="rounded-full border border-[#161310]/25 px-3 py-1 text-[10px] tracking-[0.2em]">{s}</span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-t border-[#161310]/15 pt-5 text-[10px] uppercase tracking-[0.2em] text-[#161310]/50">
              <span>165 GSM</span><span>Pure flax</span><span>Corozo buttons</span>
            </div>
          </div>
          <TiltCard className="mx-auto w-full max-w-sm" max={13} glare>
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#dcd2c0] shadow-[0_40px_80px_-40px_rgba(22,19,16,0.6)]">
              <Image src={NEW_ARRIVALS[1].img} alt={NEW_ARRIVALS[1].name} fill sizes="(max-width: 1024px) 90vw, 40vw" className="object-cover" />
              <span style={{ transform: 'translateZ(70px)' }} className="absolute left-3 top-3 rounded-full bg-[#f7f3ec] px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-[#161310]">
                {NEW_ARRIVALS[1].price}
              </span>
              <span style={{ transform: 'translateZ(45px)' }} className="absolute bottom-3 right-3 rounded-full bg-[#161310]/85 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-[#f7f3ec]">
                {NEW_ARRIVALS[1].tag}
              </span>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── 9. CUSTOMER REVIEWS ──────────────────────────────────── */}
      <section className="bg-[#b7791f] px-5 py-20 text-[#f7f3ec] sm:px-8 lg:px-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/60">Index 09 · Reviews</p>
          <div className="mt-6 mb-6 flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <div className="relative min-h-[8.5rem]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={quote}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.55, ease: EASE_OUT }}
                className="text-[clamp(1.3rem,2.9vw,2.1rem)] leading-[1.32]"
                style={serif}
              >
                “{REVIEWS[quote].text}”
                <footer className="mt-6 text-[10px] uppercase tracking-[0.32em] opacity-70" style={{ fontFamily: 'var(--font-manrope)' }}>
                  {REVIEWS[quote].name} — {REVIEWS[quote].city}
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
          <div className="mt-6 flex justify-center gap-2">
            {REVIEWS.map((r, i) => (
              <button
                key={r.name}
                type="button"
                aria-label={`Review ${i + 1}`}
                onClick={() => setQuote(i)}
                className={`h-1.5 rounded-full transition-all ${i === quote ? 'w-8 bg-[#f7f3ec]' : 'w-3 bg-[#f7f3ec]/40'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. UGC / CUSTOMER VIDEOS ────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8 lg:px-14 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <SectionHead kicker="Index 10" title="Worn by you" action="Tag @mentoos" />
          <div data-reveal-group className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {UGC.map((u) => (
              <div key={u.handle} className="group relative overflow-hidden bg-[#e2d9c8]">
                <div className="relative aspect-[9/14]">
                  <Image
                    src={u.img}
                    alt={u.caption}
                    fill
                    sizes="(max-width: 640px) 50vw, 23vw"
                    className="object-cover transition-transform duration-[1000ms] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />
                </div>
                <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/50 text-white backdrop-blur">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                <div className="absolute inset-x-3 bottom-3 text-white">
                  <p className="text-xs">{u.handle}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.2em] text-white/70">{u.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. INSTAGRAM / SOCIAL ───────────────────────────────── */}
      <section className="border-y border-[#161310]/10 bg-[#efe9df] px-5 py-20 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1440px]">
          <SectionHead kicker="Index 11" title="@mentoos on Instagram" action="Follow" />
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {SOCIAL.map((s) => (
              <a key={s.caption} href="https://instagram.com" target="_blank" rel="noreferrer" className="group relative block overflow-hidden">
                <div className="relative aspect-square">
                  <Image src={s.img} alt={s.caption} fill sizes="33vw" className="object-cover transition-transform duration-[900ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[#161310]/0 transition-colors duration-500 group-hover:bg-[#161310]/40" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <Heart className="h-4 w-4 fill-current" />
                  <span className="text-[10px] tracking-[0.2em]">{s.likes}</span>
                </div>
                <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-white/0 transition-colors group-hover:text-white/80">
                  <Instagram className="h-3 w-3" /> {s.caption}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. OFFERS ───────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-[1440px]">
          <SectionHead kicker="Index 12" title="Offers on the house" />
          <div className="divide-y divide-dashed divide-[#161310]/25 border-y border-dashed border-[#161310]/25">
            {OFFERS.map((o) => (
              <div key={o.code} className="flex flex-wrap items-center justify-between gap-4 py-6">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.32em] text-[#b7791f]">{o.rule}</p>
                  <h3 className="mt-1 text-xl italic sm:text-2xl" style={serif}>
                    {o.headline}
                  </h3>
                  <p className="mt-1 text-xs text-[#161310]/55">{o.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-[#161310]/25 px-4 py-2 text-[10px] tracking-[0.28em]">{o.code}</span>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-[#161310]/60 hover:text-[#b7791f]"
                  >
                    Redeem <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. TRUST ────────────────────────────────────────────── */}
      <section className="bg-[#efe9df] px-5 py-16 sm:px-8 lg:px-14">
        <div className="mx-auto grid max-w-[1440px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <div key={t.title} className="border-l border-[#161310]/15 pl-5">
                <Icon className="h-4 w-4 text-[#b7791f]" />
                <h3 className="mt-3 text-base italic leading-snug" style={serif}>
                  {t.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#161310]/55">{t.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 14. FOOTER (editorial) ───────────────────────────────── */}
      <footer className="relative overflow-hidden bg-[#161310] pb-10 pt-16 text-[#f7f3ec]">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
          <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-3xl tracking-[-0.03em]" style={serif}>
                Mentoos Atelier
              </p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
                One letter a month. New drafts, restocks and nothing else.
              </p>
              <div className="mt-6 flex items-center gap-2 border-b border-white/20 pb-2">
                <input
                  type="email"
                  placeholder="you@email.com"
                  aria-label="Email"
                  className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/30 focus:outline-none"
                />
                <button type="button" className="text-[10px] uppercase tracking-[0.26em] text-[#d8a25a]">
                  Join
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 text-[11px] text-white/55 lg:col-span-4 lg:col-start-7">
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">Shop</p>
                <Link className="block hover:text-white" href="/products">New arrivals</Link>
                <Link className="block hover:text-white" href="/products">Best sellers</Link>
                <Link className="block hover:text-white" href="/products">Offers</Link>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">Help</p>
                <Link className="block hover:text-white" href="/shipping">Shipping</Link>
                <Link className="block hover:text-white" href="/returns">Returns</Link>
                <Link className="block hover:text-white" href="/support">Support</Link>
              </div>
            </div>
            <div className="lg:col-span-2 lg:col-start-11">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">Visit</p>
              <p className="mt-2 text-[11px] leading-relaxed text-white/55">
                Atelier 14, Lower Parel
                <br />
                Mumbai 400013
              </p>
            </div>
          </div>
          <div className="mt-10 overflow-hidden">
            <div className="flex w-max animate-marquee gap-10 whitespace-nowrap text-[9vw] leading-none tracking-[-0.04em] text-white/[0.07]">
              {Array.from({ length: 2 }).map((_, i) => (
                <span key={i} className="flex gap-10" style={serif}>
                  EDITORIAL LUXE — AW26 — MENTOOS ATELIER —&nbsp;
                </span>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[9px] uppercase tracking-[0.3em] text-white/30">
            <span>© 2026 Mentoos Atelier</span>
            <span>Demo 01 · Editorial Luxe</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
