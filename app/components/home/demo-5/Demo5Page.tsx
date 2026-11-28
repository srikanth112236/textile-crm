'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Heart, Play, RotateCcw, Ruler, ShieldCheck, Sun, Truck } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import { cinzel, outfit } from './fonts';

const TRUST_ICONS = [Truck, RotateCcw, Ruler, ShieldCheck];
const display = { fontFamily: 'var(--font-cinzel)' } as const;

function ArchCarousel() {
  const items = [...NEW_ARRIVALS, ...TRENDING].slice(0, 6);
  const [active, setActive] = useState(0);
  const step = 360 / items.length;

  return (
    <div>
      <div className="relative mx-auto h-[360px] w-full max-w-3xl scale-[0.74] [perspective:1500px] sm:h-[420px] sm:scale-100">
        <div
          className="absolute inset-0 [transform-style:preserve-3d] transition-transform duration-700 ease-out"
          style={{ transform: `rotateY(${-active * step}deg)` }}
        >
          {items.map((p, i) => (
            <div
              key={p.id}
              className="absolute left-1/2 top-1/2 w-[180px] sm:w-[210px]"
              style={{ transform: `translate(-50%, -50%) rotateY(${i * step}deg) translateZ(240px)` }}
            >
              <div className="overflow-hidden rounded-t-[999px] rounded-b-[16px] border border-[#33251c]/10 bg-[#f7eddd] shadow-[0_36px_60px_-40px_rgba(51,37,28,0.65)]">
                <div className="relative aspect-[3/4]">
                  <Image src={p.img} alt={p.name} fill sizes="210px" className="object-cover" />
                </div>
                <div className="px-3 py-2.5 text-center">
                  <p className="truncate text-[11px]" style={display}>{p.name}</p>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#8f4230]">{p.price}</p>
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
          className="grid h-9 w-9 place-items-center rounded-full border border-[#33251c]/25 text-[#33251c]/60 transition-colors hover:border-[#b5563a] hover:text-[#b5563a]"
          aria-label="Previous piece"
        >
          ←
        </button>
        <span className="text-[9px] uppercase tracking-[0.26em] text-[#33251c]/45">0{active + 1} / 0{items.length}</span>
        <button
          type="button"
          onClick={() => setActive((a) => (a + 1) % items.length)}
          className="grid h-9 w-9 place-items-center rounded-full border border-[#33251c]/25 text-[#33251c]/60 transition-colors hover:border-[#b5563a] hover:text-[#b5563a]"
          aria-label="Next piece"
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
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#b5563a]">{n}</p>
        <h2 className="mt-2 text-[clamp(1.8rem,3.8vw,2.9rem)] leading-[1.06]" style={display}>{title}</h2>
      </div>
      {action ? (
        <Link href="/products" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#33251c]/55 hover:text-[#b5563a]">
          {action} <ArrowRight className="h-3 w-3" />
        </Link>
      ) : null}
    </div>
  );
}

export default function Demo5Page() {
  const scope = useRef<HTMLDivElement>(null);
  const [review, setReview] = useState(0);
  useDemoScroll(scope);

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-craft-line]',
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: 'left center', ease: 'none', scrollTrigger: { trigger: '[data-craft]', start: 'top 72%', end: 'bottom 78%', scrub: true } }
      );
    }, el);
    return () => ctx.revert();
  }, [scope]);

  return (
    <div
      ref={scope}
      className={`${cinzel.variable} ${outfit.variable} relative min-h-screen overflow-x-clip bg-[#f3e7d6] text-[#33251c]`}
      style={{ fontFamily: 'var(--font-outfit)' }}
    >
      {/* ── 0. SITE HEADER (shared, unchanged) ───────────────────── */}
      <Header />

      {/* ── 1. HERO ──────────────────────────────────────────────── */}
      <section data-parallax-scope className="relative overflow-hidden px-5 pb-16 pt-10 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute right-[-10%] top-[20%] h-64 w-64 rounded-full bg-[#e2c9a6]/50 blur-2xl" />
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 lg:grid-cols-12">
          <div className="relative lg:col-span-6">
            <div data-parallax="0.22" className="relative mx-auto aspect-[4/5] w-[84%] overflow-hidden rounded-t-[999px] rounded-b-[24px] bg-[#e5d3ba]">
              <Image src={LOOKS[0].img} alt="Mediterranean menswear" fill priority sizes="(max-width: 1024px) 84vw, 40vw" className="object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#33251c]/25 via-transparent to-transparent" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
              className="absolute -left-1 bottom-4 grid h-24 w-24 place-items-center rounded-full border border-[#b5563a]/40 text-[#b5563a] sm:h-28 sm:w-28"
            >
              <Sun className="h-5 w-5" />
            </motion.div>
          </div>

          <div className="lg:col-span-6 lg:pl-6">
            <p className="text-[10px] uppercase tracking-[0.44em] text-[#b5563a]">Autumn harvest · 2026</p>
            <h1 className="mt-4 text-[clamp(2.3rem,5.6vw,4.4rem)] leading-[1.04]" style={display}>
              Earth, linen
              <br />
              and light
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#33251c]/65">
              Cloth pulled from Belgian fields, dried in shade and finished by hand. Warm neutrals,
              deep clay and olive, cut for long afternoons.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/products" className="inline-flex items-center gap-3 rounded-full bg-[#b5563a] px-7 py-3.5 text-[10px] uppercase tracking-[0.28em] text-[#f7eddd] hover:bg-[#8f4230]">
                Shop the harvest <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/about" className="text-[10px] uppercase tracking-[0.28em] text-[#33251c]/60 underline decoration-[#33251c]/20 underline-offset-8 hover:text-[#33251c]">
                Our makers
              </Link>
            </div>
            <div className="mt-10 grid max-w-sm grid-cols-3 gap-4 border-t border-[#33251c]/15 pt-5">
              {[{ k: '100%', v: 'Flax' }, { k: '46', v: 'Picks / inch' }, { k: '3 wk', v: 'Retted' }].map((s) => (
                <div key={s.k}>
                  <p className="text-xl" style={display}>{s.k}</p>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-[#33251c]/45">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SHOP BY CATEGORY ──────────────────────────────────── */}
      <section className="border-y border-[#33251c]/10 bg-[#eee0cc] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="02" title="Shop by category" action="All categories" />
          <div data-reveal-group className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <Link key={c.name} href="/products" className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[16px] bg-[#e5d3ba]">
                  <Image src={c.img} alt={c.name} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover transition-transform duration-[1100ms] group-hover:scale-[1.05]" />
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <h3 className="text-sm tracking-[0.03em]" style={display}>{c.name}</h3>
                  <span className="text-[9px] uppercase tracking-[0.22em] text-[#33251c]/40">{c.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. NEW ARRIVALS ──────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="03" title="New arrivals" action="New in" />
          <div data-reveal-group className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {NEW_ARRIVALS.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[14px] bg-[#e5d3ba]">
                  <Image src={p.img} alt={p.name} fill sizes="(max-width: 640px) 50vw, 24vw" className="object-cover transition-transform duration-[1000ms] group-hover:scale-[1.06]" />
                  <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-[#f7eddd]/90 opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-[#33251c]/15 pt-3">
                  <div>
                    <h3 className="text-sm tracking-[0.03em]" style={display}>{p.name}</h3>
                    <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-[#33251c]/40">{p.tag} · {p.colour}</p>
                  </div>
                  <span className="rounded-full bg-[#b5563a]/10 px-2.5 py-1 text-[11px] text-[#8f4230]">{p.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. TRENDING NOW (pinned arch rail) ───────────────────── */}
      <section className="relative flex items-center overflow-x-auto border-y border-[#33251c]/10 bg-[#e9d9c1] pb-14 pt-28 lg:h-[100svh] lg:overflow-hidden lg:py-0">
        <div className="pointer-events-none absolute inset-x-0 top-7 z-10 flex items-end justify-between px-5 sm:px-8 lg:px-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#b5563a]">04 · Trending</p>
            <h2 className="mt-1 text-3xl sm:text-4xl" style={display}>In the sun</h2>
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#33251c]/45">Scroll →</span>
        </div>
        <div data-hscroll className="flex w-max snap-x snap-mandatory items-end gap-6 px-5 sm:gap-9 sm:px-8 lg:px-12 lg:pl-[30vw]">
          {TRENDING.map((p) => (
            <article key={p.id} className="group w-[70vw] shrink-0 sm:w-[40vw] lg:w-[26vw]">
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[16px]">
                <Image src={p.img} alt={p.name} fill sizes="(max-width: 1024px) 70vw, 26vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-base tracking-[0.03em]" style={display}>{p.name}</h3>
                <p className="mt-1 text-[9px] uppercase tracking-[0.24em] text-[#33251c]/45">{p.tag} · {p.price}</p>
              </div>
            </article>
          ))}
          <div className="w-[8vw] shrink-0" />
        </div>
      </section>

      {/* ── 5. BEST SELLERS (medallions) ─────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="05" title="Best sellers" action="Ranked by you" />
          <div data-reveal-group className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {BEST_SELLERS.map((p, i) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group text-center">
                <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-full bg-[#e5d3ba]">
                  <Image src={p.img} alt={p.name} fill sizes="(max-width: 640px) 46vw, 22vw" className="object-cover transition-transform duration-[1000ms] group-hover:scale-105" />
                  <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-[#f7eddd]/90 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.22em] text-[#8f4230]">{p.tag}</span>
                </div>
                <h3 className="mt-4 text-sm tracking-[0.03em]" style={display}>{p.name}</h3>
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#33251c]/45">{p.price} · {p.rating} ★ ({p.reviews})</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. SHOP BY FIT ───────────────────────────────────────── */}
      <section className="border-y border-[#33251c]/10 bg-[#eee0cc] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="06" title="Shop by fit" />
          <div data-reveal-group className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {FITS.map((f, i) => (
              <Link key={f.name} href="/products" className="group">
                <div className="relative aspect-[2/3] overflow-hidden rounded-t-[999px] bg-[#e5d3ba]">
                  <Image src={f.img} alt={f.name} fill sizes="(max-width: 640px) 50vw, 24vw" className="object-cover transition-transform duration-[1100ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#33251c]/45 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.24em] text-white/85">0{i + 1}</span>
                </div>
                <h3 className="mt-3 text-center text-sm tracking-[0.03em]" style={display}>{f.name}</h3>
                <p className="mt-1 text-center text-[9px] uppercase tracking-[0.2em] text-[#33251c]/40">{f.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. SHOP BY STYLE ─────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="07" title="Shop by style" action="Four moods" />
          <div className="space-y-8">
            {STYLES.map((s, i) => (
              <Link key={s.name} href="/products" className={`group grid items-center gap-7 md:grid-cols-12 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] bg-[#e5d3ba] md:col-span-7">
                  <Image src={s.img} alt={s.name} fill sizes="(max-width: 768px) 100vw, 55vw" className="object-cover transition-transform duration-[1100ms] group-hover:scale-[1.04]" />
                </div>
                <div className="md:col-span-5">
                  <span className="text-[9px] uppercase tracking-[0.32em] text-[#b5563a]">Style 0{i + 1}</span>
                  <h3 className="mt-2 text-[clamp(1.4rem,2.8vw,2.1rem)] leading-tight" style={display}>{s.name}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#33251c]/60">{s.note}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-[#33251c]/50 group-hover:text-[#b5563a]">Explore <ArrowRight className="h-3 w-3" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. SHOP THE LOOK (layered arches) ────────────────────── */}
      <section className="border-y border-[#33251c]/10 px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="08" title="Shop the look" />
          <div className="grid gap-6 lg:grid-cols-3">
            {LOOKS.map((l, i) => (
              <article key={l.title} className={`group ${i === 1 ? 'lg:translate-y-10' : i === 2 ? 'lg:translate-y-4' : ''}`}>
                <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[18px] bg-[#e5d3ba]">
                  <Image src={l.img} alt={l.title} fill sizes="(max-width: 1024px) 100vw, 30vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                  <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-[#f7eddd]/90 px-3 py-1 text-[9px] uppercase tracking-[0.22em] text-[#8f4230]">{l.note}</span>
                </div>
                <h3 className="mt-4 text-center text-base tracking-[0.03em]" style={display}>{l.title}</h3>
                <ul className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
                  {l.pieces.map((piece) => (
                    <li key={piece} className="text-[9px] uppercase tracking-[0.18em] text-[#33251c]/40">{piece}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8b. 3D HARVEST RING ──────────────────────────────────── */}
      <section className="overflow-hidden border-y border-[#33251c]/10 bg-[#eee0cc] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="08b" title="Turn the harvest ring" action="Six pieces" />
          <ArchCarousel />
        </div>
      </section>

      {/* ── 8c. STICKY CRAFT STORY ───────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-t-[999px] rounded-b-[22px] bg-[#e5d3ba] lg:sticky lg:top-24">
              <div className="relative aspect-[4/5]">
                <Image src={CATEGORIES[1].img} alt="Linen detail" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
              </div>
            </div>
          </div>
          <div className="space-y-14 lg:col-span-7 lg:pt-12">
            {[
              { k: 'I', t: 'Pulled, not cut', b: 'Flax is pulled whole so the fibre keeps its full length, then retted in open air.' },
              { k: 'II', t: 'Woven slow', b: 'Forty-six picks an inch — enough air for summer, enough body to hold a collar.' },
              { k: 'III', t: 'Finished by hand', b: 'Every hem is pressed and inspected on a table, not a conveyor.' },
            ].map((step) => (
              <div key={step.k} data-reveal className="border-t border-[#33251c]/12 pt-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#b5563a]">{step.k}</span>
                <h3 className="mt-3 text-[clamp(1.3rem,2.4vw,1.9rem)] leading-tight" style={display}>{step.t}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[#33251c]/60">{step.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CUSTOMER REVIEWS ──────────────────────────────────── */}
      <section className="bg-[#b5563a] px-5 py-16 text-[#f7eddd] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.4em] text-white/70">
            <Sun className="h-3.5 w-3.5" /> 09 · Reviews
          </div>
          <div className="relative mt-7 min-h-[9rem]">
            <AnimatePresence mode="wait">
              <motion.blockquote key={review} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.55, ease: EASE_OUT }}>
                <p className="text-[clamp(1.2rem,2.7vw,1.9rem)] leading-[1.45]">“{REVIEWS[review].text}”</p>
                <footer className="mt-6 text-[9px] uppercase tracking-[0.3em] opacity-70">{REVIEWS[review].name} — {REVIEWS[review].city}</footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
          <div className="mt-5 flex justify-center gap-2">
            {REVIEWS.map((r, i) => (
              <button key={r.name} type="button" aria-label={`Review ${i + 1}`} onClick={() => setReview(i)} className={`h-1.5 rounded-full transition-all ${i === review ? 'w-8 bg-[#f7eddd]' : 'w-3 bg-[#f7eddd]/40'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. UGC / CUSTOMER VIDEOS ────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="10" title="Worn by you" action="Tag @mentoos" />
          <div data-reveal-group className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {UGC.map((u) => (
              <div key={u.handle} className="group relative overflow-hidden rounded-t-[999px] rounded-b-[16px] bg-[#e5d3ba]">
                <div className="relative aspect-[9/14]">
                  <Image src={u.img} alt={u.caption} fill sizes="(max-width: 640px) 50vw, 24vw" className="object-cover transition-transform duration-[1000ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#33251c]/55 via-transparent to-transparent" />
                </div>
                <span className="absolute left-1/2 top-4 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-[#f7eddd]/85 text-[#33251c]"><Play className="h-3 w-3 fill-current" /></span>
                <div className="absolute inset-x-0 bottom-3 text-center text-white">
                  <p className="text-[11px]">{u.handle}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/70">{u.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. INSTAGRAM / SOCIAL ───────────────────────────────── */}
      <section className="border-y border-[#33251c]/10 bg-[#eee0cc] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="11" title="@mentoos on Instagram" action="Follow" />
          <div className="grid grid-cols-3 gap-3">
            {SOCIAL.map((s) => (
              <a key={s.caption} href="https://instagram.com" target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-[16px]">
                <div className="relative aspect-square">
                  <Image src={s.img} alt={s.caption} fill sizes="33vw" className="object-cover transition-transform duration-[900ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[#b5563a]/0 transition-colors duration-500 group-hover:bg-[#b5563a]/40" />
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
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <Head n="12" title="From the house" />
          <div className="grid gap-5 md:grid-cols-3">
            {OFFERS.map((o) => (
              <div key={o.code} className="flex flex-col justify-between rounded-[20px] bg-[#e9d9c1] p-6">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#b5563a]">{o.rule}</p>
                  <h3 className="mt-3 text-lg leading-snug" style={display}>{o.headline}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#33251c]/55">{o.detail}</p>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="rounded-full bg-[#f7eddd] px-3 py-1.5 text-[9px] uppercase tracking-[0.26em]">{o.code}</span>
                  <Link href="/products" className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.24em] text-[#b5563a]">Redeem <ArrowUpRight className="h-3 w-3" /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. TRUST (craft line) ───────────────────────────────── */}
      <section data-craft className="relative border-y border-[#33251c]/10 bg-[#eee0cc] px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative">
            <div className="absolute left-0 top-6 hidden h-px w-full bg-[#33251c]/15 lg:block" />
            <div data-craft-line className="absolute left-0 top-6 hidden h-px w-full origin-left bg-[#b5563a] lg:block" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST.map((t, i) => {
                const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
                return (
                  <div key={t.title} className="lg:pt-12">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f7eddd] text-[#b5563a]"><Icon className="h-4 w-4" /></span>
                    <h3 className="mt-3 text-sm leading-snug" style={display}>{t.title}</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#33251c]/50">{t.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 14. FOOTER (Mediterranean) ───────────────────────────── */}
      <footer className="bg-[#e9d9c1] px-5 pb-10 pt-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col items-center gap-6 border-b border-[#33251c]/12 pb-10 text-center">
            <p className="text-2xl tracking-[0.24em]" style={display}>MENTOOS</p>
            <p className="max-w-sm text-sm leading-relaxed text-[#33251c]/55">
              Harvest letters, four times a year. New cloth, restocks and the odd recipe.
            </p>
            <div className="flex w-full max-w-sm items-center gap-2 border-b border-[#33251c]/20 pb-2">
              <input type="email" placeholder="Email address" aria-label="Email" className="w-full bg-transparent text-center text-xs placeholder:text-[#33251c]/30 focus:outline-none" />
              <button type="button" className="whitespace-nowrap text-[9px] uppercase tracking-[0.26em] text-[#b5563a]">Join</button>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] uppercase tracking-[0.26em] text-[#33251c]/50">
              <Link className="hover:text-[#b5563a]" href="/products">Shop</Link>
              <Link className="hover:text-[#b5563a]" href="/shipping">Shipping</Link>
              <Link className="hover:text-[#b5563a]" href="/returns">Returns</Link>
              <Link className="hover:text-[#b5563a]" href="/support">Support</Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[9px] uppercase tracking-[0.26em] text-[#33251c]/35">
              <span>Atelier 14, Lower Parel · Mumbai</span>
              <span>© 2026 Mentoos Harvest · Demo 05</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
