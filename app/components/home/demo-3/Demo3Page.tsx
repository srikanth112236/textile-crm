'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Heart, Play, RotateCcw, Ruler, ShieldCheck, Star, Truck } from 'lucide-react';
import { Header } from '@/components/navigation/Header';
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
import { playfair, plusJakarta } from './fonts';

const TRUST_ICONS = [Truck, RotateCcw, Ruler, ShieldCheck];
const serif = { fontFamily: 'var(--font-playfair)' } as const;

function Carousel3D() {
  const items = [...NEW_ARRIVALS, ...TRENDING].slice(0, 6);
  const [active, setActive] = useState(0);
  const step = 360 / items.length;

  return (
    <div>
      <div className="relative mx-auto h-[340px] w-full max-w-3xl scale-[0.72] [perspective:1400px] sm:h-[400px] sm:scale-100">
        <div
          className="absolute inset-0 [transform-style:preserve-3d] transition-transform duration-700 ease-out"
          style={{ transform: `rotateY(${-active * step}deg)` }}
        >
          {items.map((p, i) => (
            <div
              key={p.id}
              className="absolute left-1/2 top-1/2 w-[190px] sm:w-[220px]"
              style={{ transform: `translate(-50%, -50%) rotateY(${i * step}deg) translateZ(230px)` }}
            >
              <div className="overflow-hidden rounded-[20px] border border-[#1b1b19]/10 bg-white shadow-[0_30px_60px_-35px_rgba(27,27,25,0.55)]">
                <div className="relative aspect-[3/4]">
                  <Image src={p.img} alt={p.name} fill sizes="220px" className="object-cover" />
                </div>
                <div className="px-3 py-2">
                  <p className="truncate text-[11px] font-normal" style={serif}>{p.name}</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#1b1b19]/45">{p.price}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setActive((a) => (a - 1 + items.length) % items.length)}
          className="grid h-9 w-9 place-items-center rounded-full border border-[#1b1b19]/20 text-[#1b1b19]/60 transition-colors hover:border-[#7c8b74] hover:text-[#7c8b74]"
          aria-label="Previous product"
        >
          ←
        </button>
        <span className="text-[9px] uppercase tracking-[0.26em] text-[#1b1b19]/40">0{active + 1} / 0{items.length}</span>
        <button
          type="button"
          onClick={() => setActive((a) => (a + 1) % items.length)}
          className="grid h-9 w-9 place-items-center rounded-full border border-[#1b1b19]/20 text-[#1b1b19]/60 transition-colors hover:border-[#7c8b74] hover:text-[#7c8b74]"
          aria-label="Next product"
        >
          →
        </button>
      </div>
    </div>
  );
}

function Head({ n, title, action }: { n: string; title: string; action?: string }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#1b1b19]/40">{n}</p>
        <h2 className="mt-3 text-[clamp(1.7rem,3.4vw,2.6rem)] font-light leading-[1.08] tracking-[-0.02em]" style={serif}>
          {title}
        </h2>
      </div>
      {action ? (
        <Link href="/products" className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-[#1b1b19]/50 hover:text-[#7c8b74]">
          {action} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}

export default function Demo3Page() {
  const scope = useRef<HTMLDivElement>(null);
  const [review, setReview] = useState(0);
  useDemoScroll(scope);

  return (
    <div
      ref={scope}
      className={`${playfair.variable} ${plusJakarta.variable} relative min-h-screen overflow-x-clip bg-[#f4f3ef] text-[#1b1b19]`}
      style={{ fontFamily: 'var(--font-plus-jakarta)' }}
    >
      {/* ── 0. SITE HEADER (shared, unchanged) ───────────────────── */}
      <Header />

      {/* ── 1. HERO ──────────────────────────────────────────────── */}
      <section data-parallax-scope className="px-4 pb-16 pt-10 sm:px-6">
        <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[32px] bg-[#e6e5df]">
          <div data-scale-scroll className="relative h-[68svh] min-h-[440px] w-full">
            <Image src={TRENDING[0].img} alt="Studio collection" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1b1b19]/25 via-transparent to-[#1b1b19]/45" />
          </div>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE_OUT }} className="text-[10px] uppercase tracking-[0.5em] text-white/75">
              Drop 03 — Neo minimal
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE_OUT, delay: 0.1 }} className="mt-5 max-w-3xl text-[clamp(2.3rem,6.2vw,5rem)] font-light leading-[1.03] tracking-[-0.02em]" style={serif}>
              Clothes that keep
              <br />
              <span className="italic">their composure</span>
            </motion.h1>
            <div className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[10px] uppercase tracking-[0.24em] text-[#1b1b19] transition-colors hover:bg-[#7c8b74] hover:text-white">
                Shop drop 03 <ArrowRight className="h-3 w-3" />
              </Link>
              <Link href="/about" className="rounded-full border border-white/50 px-6 py-3 text-[10px] uppercase tracking-[0.24em] text-white hover:bg-white/10">
                Studio diary
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-14 grid max-w-[1320px] gap-8 lg:grid-cols-12">
          <p data-line className="text-[clamp(1.2rem,2.2vw,1.7rem)] font-light leading-[1.45] lg:col-span-6" style={serif}>
            A wardrobe of nine garments that all answer to one another.
          </p>
          <p className="text-sm leading-relaxed text-[#1b1b19]/55 lg:col-span-4 lg:col-start-9">
            We design in pairs: a shirt and its trouser, a tee and its jacket. Nothing enters the
            studio unless it can be worn three ways with what already exists.
          </p>
        </div>
      </section>

      {/* ── 2. SHOP BY CATEGORY ──────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="02" title="Shop by category" action="All categories" />
          <div data-reveal-group className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {CATEGORIES.map((c) => (
              <Link key={c.name} href="/products" className="group">
                <div className="relative aspect-[5/4] overflow-hidden rounded-[22px] bg-[#e9e7e0]">
                  <Image src={c.img} alt={c.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition-transform duration-[1000ms] group-hover:scale-[1.05]" />
                  <div className="absolute inset-0 bg-[#7c8b74]/0 transition-colors duration-500 group-hover:bg-[#7c8b74]/20" />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <h3 className="text-base font-normal" style={serif}>{c.name}</h3>
                  <span className="text-[9px] uppercase tracking-[0.22em] text-[#1b1b19]/40">{c.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. NEW ARRIVALS ──────────────────────────────────────── */}
      <section className="border-y border-[#1b1b19]/10 bg-[#eeece6] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="03" title="New arrivals" action="New in" />
          <div data-reveal-group className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {NEW_ARRIVALS.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group block">
                <div className="relative overflow-hidden rounded-[24px] bg-[#e5e3dc]">
                  <div className="relative aspect-[4/5]">
                    <Image src={p.img} alt={p.name} fill sizes="(max-width: 640px) 100vw, 23vw" className="object-cover transition-transform duration-[1100ms] group-hover:scale-[1.05]" />
                  </div>
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[8px] uppercase tracking-[0.22em]">{p.tag}</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-normal" style={serif}>{p.name}</h3>
                  <span className="text-sm text-[#1b1b19]/60">{p.price}</span>
                </div>
                <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-[#1b1b19]/35">{p.colour} · {p.rating} ★</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. TRENDING NOW ──────────────────────────────────────── */}
      <section className="py-16">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <Head n="04" title="Trending now" action="Shop trending" />
        </div>
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:px-6">
          {TRENDING.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="group relative w-[76vw] shrink-0 snap-start overflow-hidden rounded-[24px] sm:w-[40vw] lg:w-[28vw]">
              <div className="relative aspect-[4/5]">
                <Image src={p.img} alt={p.name} fill sizes="(max-width: 640px) 76vw, 28vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b19]/60 via-transparent to-transparent" />
              </div>
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="text-[9px] uppercase tracking-[0.24em] text-white/70">{p.tag}</p>
                <h3 className="mt-1 text-lg font-normal" style={serif}>{p.name}</h3>
                <p className="mt-1 text-xs text-white/80">{p.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 5. BEST SELLERS ──────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="05" title="Best sellers" action="Ranked by you" />
          <div className="divide-y divide-[#1b1b19]/10 border-t border-[#1b1b19]/10">
            {BEST_SELLERS.map((p, i) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group flex items-center gap-5 py-5">
                <span className="w-6 text-[10px] uppercase tracking-[0.24em] text-[#7c8b74]">0{i + 1}</span>
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[14px] bg-[#e5e3dc]">
                  <Image src={p.img} alt={p.name} fill sizes="64px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-normal" style={serif}>{p.name}</h3>
                  <p className="mt-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[#1b1b19]/40">
                    <Star className="h-3 w-3 fill-[#7c8b74] text-[#7c8b74]" /> {p.reviews} reviews
                  </p>
                </div>
                <span className="text-sm text-[#1b1b19]/60">{p.price}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. SHOP BY FIT ───────────────────────────────────────── */}
      <section className="border-y border-[#1b1b19]/10 bg-[#eeece6] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="06" title="Shop by fit" />
          <div data-reveal-group className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {FITS.map((f) => (
              <Link key={f.name} href="/products" className="group text-center">
                <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-[#e2e0d8]">
                  <Image src={f.img} alt={f.name} fill sizes="(max-width: 640px) 46vw, 22vw" className="object-cover transition-transform duration-[1000ms] group-hover:scale-105" />
                </div>
                <h3 className="mt-4 text-base font-normal" style={serif}>{f.name}</h3>
                <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-[#1b1b19]/40">{f.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. SHOP BY STYLE ─────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="07" title="Shop by style" action="Four moods" />
          <div className="space-y-10">
            {STYLES.map((s, i) => (
              <Link key={s.name} href="/products" className={`group grid items-center gap-8 md:grid-cols-12 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] bg-[#e5e3dc] md:col-span-7">
                  <Image src={s.img} alt={s.name} fill sizes="(max-width: 768px) 100vw, 55vw" className="object-cover transition-transform duration-[1100ms] group-hover:scale-[1.04]" />
                </div>
                <div className="md:col-span-5">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-[#7c8b74]">Style 0{i + 1}</span>
                  <h3 className="mt-2 text-[clamp(1.5rem,2.8vw,2.2rem)] font-light leading-tight" style={serif}>{s.name}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#1b1b19]/55">{s.note}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#1b1b19]/45 group-hover:text-[#7c8b74]">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. SHOP THE LOOK (sticky stack) ──────────────────────── */}
      <section className="px-4 pb-20 pt-4 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="08" title="Shop the look" />
          <div className="space-y-5">
            {LOOKS.map((l, i) => (
              <article key={l.title} className="overflow-hidden rounded-[28px] border border-[#1b1b19]/10 bg-[#eeece6] lg:sticky" style={{ top: `${84 + i * 16}px` }}>
                <div className="grid items-stretch md:grid-cols-2">
                  <div className="relative h-64 md:h-[380px]">
                    <Image src={l.img} alt={l.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-between gap-6 p-7 md:p-10">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.34em] text-[#7c8b74]">{l.note}</p>
                      <h3 className="mt-3 text-[clamp(1.4rem,2.6vw,2rem)] font-light" style={serif}>{l.title}</h3>
                      <ul className="mt-4 space-y-1.5">
                        {l.pieces.map((piece) => (
                          <li key={piece} className="text-[11px] uppercase tracking-[0.18em] text-[#1b1b19]/50">— {piece}</li>
                        ))}
                      </ul>
                    </div>
                    <Link href="/products" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#1b1b19] px-5 py-2.5 text-[9px] uppercase tracking-[0.24em] text-[#f4f3ef]">
                      Shop this look <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8b. 3D PRODUCT CAROUSEL ──────────────────────────────── */}
      <section className="overflow-hidden border-y border-[#1b1b19]/10 bg-[#eeece6] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="08b" title="Walk around the rail" action="Six pieces" />
          <Carousel3D />
        </div>
      </section>

      {/* ── 8c. STICKY STUDIO STORY ──────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-[26px] bg-[#e5e3dc] lg:sticky lg:top-24">
              <div className="relative aspect-[4/5]">
                <Image src={STYLES[3].img} alt="Studio detail" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
              </div>
            </div>
          </div>
          <div className="space-y-14 lg:col-span-7 lg:pt-10">
            {[
              { k: '01', t: 'One mill, one lot', b: 'Grey cloth is booked a season ahead so every drop shares a dye lot.' },
              { k: '02', t: 'Cut in pairs', b: 'A shirt and its trouser are cut together, from the same table, by the same hand.' },
              { k: '03', t: 'Pressed, then rested', b: 'Finished garments rest 24 hours before folding, so seams settle flat.' },
            ].map((step) => (
              <div key={step.k} data-reveal className="border-t border-[#1b1b19]/12 pt-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#7c8b74]">{step.k}</span>
                <h3 className="mt-3 text-[clamp(1.3rem,2.4vw,1.8rem)] font-light" style={serif}>{step.t}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#1b1b19]/55">{step.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CUSTOMER REVIEWS ──────────────────────────────────── */}
      <section className="border-y border-[#1b1b19]/10 bg-[#eeece6] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#1b1b19]/40">09 · Reviews</p>
          <div className="relative mt-8 min-h-[10rem]">
            <AnimatePresence mode="wait">
              <motion.blockquote key={review} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.55, ease: EASE_OUT }}>
                <div className="mb-5 flex justify-center gap-1">
                  {Array.from({ length: REVIEWS[review].rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-[#7c8b74] text-[#7c8b74]" />
                  ))}
                </div>
                <p className="text-[clamp(1.2rem,2.6vw,1.9rem)] font-light leading-[1.45]" style={serif}>“{REVIEWS[review].text}”</p>
                <footer className="mt-6 text-[9px] uppercase tracking-[0.3em] text-[#1b1b19]/45">{REVIEWS[review].name} — {REVIEWS[review].city}</footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {REVIEWS.map((r, i) => (
              <button key={r.name} type="button" aria-label={`Review ${i + 1}`} onClick={() => setReview(i)} className={`h-1.5 rounded-full transition-all ${i === review ? 'w-8 bg-[#7c8b74]' : 'w-3 bg-[#1b1b19]/20'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. UGC / CUSTOMER VIDEOS ────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="10" title="Worn by you" action="Tag @mentoos" />
          <div data-reveal-group className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {UGC.map((u) => (
              <div key={u.handle} className="group relative overflow-hidden rounded-[22px] bg-[#e5e3dc]">
                <div className="relative aspect-[9/14]">
                  <Image src={u.img} alt={u.caption} fill sizes="(max-width: 640px) 50vw, 23vw" className="object-cover transition-transform duration-[1000ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b19]/55 via-transparent to-transparent" />
                </div>
                <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-[#1b1b19]">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                <div className="absolute inset-x-3 bottom-3 text-white">
                  <p className="text-[11px]">{u.handle}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/70">{u.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. INSTAGRAM / SOCIAL ───────────────────────────────── */}
      <section className="border-y border-[#1b1b19]/10 bg-[#eeece6] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="11" title="@mentoos on Instagram" action="Follow" />
          <div className="grid grid-cols-3 gap-3">
            {SOCIAL.map((s) => (
              <a key={s.caption} href="https://instagram.com" target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-[18px]">
                <div className="relative aspect-square">
                  <Image src={s.img} alt={s.caption} fill sizes="33vw" className="object-cover transition-transform duration-[900ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[#7c8b74]/0 transition-colors duration-500 group-hover:bg-[#7c8b74]/30" />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <Heart className="h-4 w-4 fill-current" />
                  <span className="text-[9px] tracking-[0.2em]">{s.likes}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. OFFERS ───────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <Head n="12" title="Quiet offers" />
          <div className="grid gap-4 md:grid-cols-3">
            {OFFERS.map((o) => (
              <div key={o.code} className="rounded-[22px] border border-dashed border-[#1b1b19]/25 p-6">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#7c8b74]">{o.rule}</p>
                <h3 className="mt-3 text-lg font-light leading-snug" style={serif}>{o.headline}</h3>
                <p className="mt-2 text-[11px] leading-relaxed text-[#1b1b19]/50">{o.detail}</p>
                <span className="mt-5 inline-block rounded-full bg-[#1b1b19]/5 px-3 py-1.5 text-[9px] uppercase tracking-[0.26em]">{o.code}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. TRUST ────────────────────────────────────────────── */}
      <section className="border-t border-[#1b1b19]/10 px-4 py-14 sm:px-6">
        <div className="mx-auto grid max-w-[1320px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <div key={t.title} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#7c8b74]/12 text-[#7c8b74]">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-normal leading-snug" style={serif}>{t.title}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#1b1b19]/45">{t.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 14. FOOTER (minimal studio) ──────────────────────────── */}
      <footer className="border-t border-[#1b1b19]/10 bg-[#e9e7e0] px-4 pb-10 pt-16 sm:px-6">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#7c8b74] text-[11px] text-white">M</span>
            <p className="mt-5 text-[10px] uppercase tracking-[0.44em] text-[#1b1b19]/40">Mentoos Studio</p>
            <p className="mt-4 max-w-md text-[clamp(1.3rem,2.8vw,2rem)] font-light leading-[1.35]" style={serif}>
              Nine pieces.
              <span className="italic text-[#7c8b74]"> One wardrobe.</span>
            </p>
            <div className="mt-7 flex w-full max-w-sm items-center gap-2 border-b border-[#1b1b19]/20 pb-2">
              <input type="email" placeholder="Email for the studio letter" aria-label="Email" className="w-full bg-transparent text-center text-xs placeholder:text-[#1b1b19]/30 focus:outline-none" />
              <button type="button" className="text-[9px] uppercase tracking-[0.24em] whitespace-nowrap text-[#7c8b74]">Join</button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[9px] uppercase tracking-[0.26em] text-[#1b1b19]/45">
              <Link className="hover:text-[#1b1b19]" href="/products">Shop</Link>
              <Link className="hover:text-[#1b1b19]" href="/shipping">Shipping</Link>
              <Link className="hover:text-[#1b1b19]" href="/returns">Returns</Link>
              <Link className="hover:text-[#1b1b19]" href="/support">Support</Link>
              <Link className="hover:text-[#1b1b19]" href="/contact">Contact</Link>
            </div>
            <p className="mt-8 text-[9px] uppercase tracking-[0.3em] text-[#1b1b19]/25">© 2026 Mentoos Studio · Demo 03</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
