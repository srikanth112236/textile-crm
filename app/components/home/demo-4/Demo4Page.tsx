'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Heart, Play, RotateCcw, Ruler, ShieldCheck, Truck } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import { bebasNeue, dmSans } from './fonts';

const CLIPS = [
  'polygon(0 0, 100% 6%, 100% 100%, 0 94%)',
  'polygon(0 6%, 100% 0, 100% 94%, 0 100%)',
];
const TRUST_ICONS = [Truck, RotateCcw, Ruler, ShieldCheck];
const display = { fontFamily: 'var(--font-bebas-neue)' } as const;

function Head({ n, title, action }: { n: string; title: string; action?: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.34em] text-[#ccff33]">{n}</p>
        <h2 className="mt-1 text-[clamp(2rem,4.6vw,3.6rem)] uppercase leading-[0.9]" style={display}>{title}</h2>
      </div>
      {action ? (
        <Link href="/products" className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/50 hover:text-[#ccff33]">
          {action} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}

export default function Demo4Page() {
  const scope = useRef<HTMLDivElement>(null);
  useDemoScroll(scope);

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const skewTo = gsap.quickTo('[data-velocity-skew]', 'skewY', { duration: 0.55, ease: 'power2.out' });
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      skewTo(gsap.utils.clamp(-5, 5, (y - last) * 0.12));
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-counter]').forEach((node) => {
        const target = Number(node.dataset.counter || '0');
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: node, start: 'top 90%', once: true },
          onUpdate: () => {
            node.textContent = String(Math.round(state.v));
          },
        });
      });
    }, el);

    return () => {
      window.removeEventListener('scroll', onScroll);
      ctx.revert();
    };
  }, [scope]);

  return (
    <div
      ref={scope}
      className={`${bebasNeue.variable} ${dmSans.variable} relative min-h-screen overflow-x-clip bg-[#08080a] text-[#f2f2ee]`}
      style={{ fontFamily: 'var(--font-dm-sans)' }}
    >
      {/* ── 0. SITE HEADER (shared, unchanged) ───────────────────── */}
      <Header />

      {/* ── 1. HERO ──────────────────────────────────────────────── */}
      <section data-parallax-scope className="relative overflow-hidden pb-8 pt-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.16]">
          <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #f2f2ee 1px, transparent 1px)', backgroundSize: '18vw 100%' }} />
        </div>
        <div className="relative mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.32em] text-white/45">
            <span>Live runway — AW26</span>
            <span className="hidden sm:block">Scroll to accelerate</span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE_OUT }} className="relative z-10 mt-4 text-[clamp(4rem,17vw,15rem)] uppercase leading-[0.78]" style={display}>
            <span className="block">Kinetic</span>
            <span className="block text-transparent" style={{ WebkitTextStroke: '2px #ccff33' }}>Runway</span>
          </motion.h1>
          <div data-velocity-skew data-parallax="-0.12" className="relative z-0 -mt-[5vw]">
            <div className="relative mx-auto h-[42svh] min-h-[260px] w-full overflow-hidden">
              <Image src={LOOKS[2].img} alt="Runway look" fill priority sizes="100vw" className="object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-white/85">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/40"><Play className="h-3 w-3" /></span>
                Look 01 — monochrome layer
              </div>
            </div>
          </div>
          <div className="relative z-10 mt-7 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-sm text-sm leading-relaxed text-white/55">
              Eighteen looks cut for movement — oversized jersey, pleated linen and a blazer light
              enough to run in.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="group inline-flex items-center gap-3 bg-[#ccff33] px-7 py-3.5 text-[11px] uppercase tracking-[0.26em] text-[#08080a] transition-transform hover:-translate-y-0.5">
                Shop the drop <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/about" className="inline-flex items-center gap-2 border border-white/25 px-7 py-3.5 text-[11px] uppercase tracking-[0.26em] text-white/70 hover:border-white hover:text-white">
                Watch film
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SHOP BY CATEGORY ──────────────────────────────────── */}
      <section className="border-y border-white/10 px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <Head n="02" title="Shop by category" action="All categories" />
          <div data-reveal-group className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <Link key={c.name} href="/products" className="group relative overflow-hidden border border-white/12 bg-[#101014]">
                <div className="relative aspect-[4/3]">
                  <Image src={c.img} alt={c.name} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover opacity-75 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100" />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-white/12 px-3 py-2.5">
                  <h3 className="text-lg uppercase leading-none" style={display}>{c.name}</h3>
                  <span className="text-[9px] uppercase tracking-[0.22em] text-[#ccff33]">0{i + 1}</span>
                </div>
                <span className="absolute right-2 top-2 bg-[#ccff33] px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-[#08080a] opacity-0 transition-opacity group-hover:opacity-100">
                  {c.count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. NEW ARRIVALS ──────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <Head n="03" title="New arrivals" action="New in" />
          <div data-reveal-group className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {NEW_ARRIVALS.map((p, i) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group relative block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#141416]" style={{ clipPath: CLIPS[i % 2] }}>
                  <Image src={p.img} alt={p.name} fill sizes="(max-width: 640px) 50vw, 24vw" className="object-cover transition-transform duration-[1100ms] group-hover:scale-110" />
                  <span className="absolute left-2 top-2 bg-[#08080a]/80 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] text-[#ccff33]">{p.tag}</span>
                  <div className="absolute inset-x-0 bottom-0 translate-y-full bg-[#ccff33] px-3 py-2 text-[9px] uppercase tracking-[0.2em] text-[#08080a] transition-transform duration-500 group-hover:translate-y-0">
                    View piece
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <h3 className="text-lg uppercase leading-none" style={display}>{p.name}</h3>
                  <span className="text-xs text-white/60">{p.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. TRENDING NOW (pinned film strip) ──────────────────── */}
      <section className="relative flex items-center overflow-x-auto border-y border-white/10 pb-12 pt-24 lg:h-[100svh] lg:overflow-hidden lg:py-0">
        <div className="pointer-events-none absolute left-5 top-8 z-10 sm:left-8 lg:left-12">
          <p className="text-[10px] uppercase tracking-[0.34em] text-[#ccff33]">04 · Trending</p>
          <h2 className="mt-1 text-[clamp(2rem,5vw,4rem)] uppercase leading-none" style={display}>On the strip</h2>
        </div>
        <div data-hscroll className="flex w-max snap-x snap-mandatory items-end gap-5 px-5 sm:gap-8 sm:px-8 lg:px-12 lg:pl-[38vw]">
          {TRENDING.map((p, i) => (
            <article key={p.id} className="group relative w-[74vw] shrink-0 sm:w-[46vw] lg:w-[32vw]">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={p.img} alt={p.name} fill sizes="(max-width: 1024px) 74vw, 32vw" className="object-cover transition-transform duration-[1300ms] group-hover:scale-105" />
                <span className="absolute left-3 top-3 bg-[#ccff33] px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-[#08080a]">0{i + 1}</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-white/15 pt-3">
                <h3 className="text-xl uppercase" style={display}>{p.name}</h3>
                <span className="text-[10px] uppercase tracking-[0.24em] text-white/45">{p.price}</span>
              </div>
            </article>
          ))}
          <div className="w-[8vw] shrink-0" />
        </div>
      </section>

      {/* ── 5. BEST SELLERS ──────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <Head n="05" title="Best sellers" action="Ranked" />
          <div className="border-t border-white/12">
            {BEST_SELLERS.map((p, i) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group grid grid-cols-12 items-center gap-3 border-b border-white/12 py-5 transition-colors hover:bg-[#ccff33] hover:text-[#08080a]">
                <span className="col-span-2 text-3xl leading-none sm:col-span-1" style={display}>0{i + 1}</span>
                <div className="col-span-2 sm:col-span-1">
                  <div className="relative h-14 w-12 overflow-hidden"><Image src={p.img} alt={p.name} fill sizes="60px" className="object-cover" /></div>
                </div>
                <h3 className="col-span-5 text-xl uppercase leading-none sm:col-span-4" style={display}>{p.name}</h3>
                <p className="col-span-12 text-[9px] uppercase tracking-[0.22em] opacity-50 sm:col-span-3">{p.reviews} sold · {p.colour}</p>
                <span className="col-span-3 flex items-center justify-end gap-2 text-xs sm:col-span-3">{p.price} <ArrowUpRight className="h-3.5 w-3.5" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. SHOP BY FIT ───────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-[#0d0d10] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <Head n="06" title="Shop by fit" />
          <div data-reveal-group className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FITS.map((f, i) => (
              <Link key={f.name} href="/products" className="group relative overflow-hidden bg-[#141416]">
                <div className="relative aspect-[4/5]">
                  <Image src={f.img} alt={f.name} fill sizes="(max-width: 640px) 100vw, 24vw" className="object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent" />
                </div>
                <div className="absolute inset-x-3 bottom-3">
                  <span className="text-[9px] uppercase tracking-[0.24em] text-[#ccff33]">0{i + 1} / fit</span>
                  <h3 className="text-2xl uppercase leading-none" style={display}>{f.name}</h3>
                  <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/50">{f.note}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. SHOP BY STYLE ─────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <Head n="07" title="Shop by style" action="Four moods" />
          <div className="grid gap-4 lg:grid-cols-2">
            {STYLES.map((s, i) => (
              <Link key={s.name} href="/products" className="group relative overflow-hidden">
                <div className="relative aspect-[16/9]">
                  <Image src={s.img} alt={s.name} fill sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover transition-transform duration-[1100ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#08080a]/85 via-[#08080a]/25 to-transparent" />
                </div>
                <div className="absolute inset-y-0 left-0 flex w-3/4 flex-col justify-between p-5">
                  <span className="text-[9px] uppercase tracking-[0.28em] text-[#ccff33]">Style 0{i + 1}</span>
                  <div>
                    <h3 className="text-[clamp(1.6rem,3vw,2.4rem)] uppercase leading-[0.9]" style={display}>{s.name}</h3>
                    <p className="mt-2 max-w-xs text-xs text-white/65">{s.note}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.24em] text-white/60 group-hover:text-[#ccff33]">Explore →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. SHOP THE LOOK ─────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-[#0d0d10] px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <Head n="08" title="Shop the look" />
          <div className="grid gap-5 lg:grid-cols-3">
            {LOOKS.map((l, i) => (
              <article key={l.title} className={`group relative ${i === 1 ? 'lg:translate-y-8' : ''}`}>
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={l.img} alt={l.title} fill sizes="(max-width: 1024px) 100vw, 32vw" className="object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                  <span className="absolute left-3 top-3 bg-[#ccff33] px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] text-[#08080a]">{l.note}</span>
                </div>
                <h3 className="mt-3 text-xl uppercase leading-none" style={display}>{l.title}</h3>
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {l.pieces.map((piece) => (
                    <li key={piece} className="text-[9px] uppercase tracking-[0.18em] text-white/45">{piece}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8b. FULL-SCREEN TAKEOVER ─────────────────────────────── */}
      <section data-parallax-scope className="relative h-[175svh] border-y border-white/10 bg-[#0c0c0f]">
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          <span
            aria-hidden
            data-scale-scroll
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-[28vw] uppercase leading-none text-transparent"
            style={{ ...display, WebkitTextStroke: '1px rgba(204,255,51,0.35)' }}
          >
            NIGHT
          </span>
          <div className="relative z-10 mx-auto grid w-full max-w-[1000px] grid-cols-3 items-center gap-3 px-4 sm:gap-6 sm:px-8">
            {[NEW_ARRIVALS[2], TRENDING[1], BEST_SELLERS[2]].map((p, i) => (
              <div key={p.id} data-parallax={i === 1 ? '0.32' : '-0.18'} className={i === 1 ? 'sm:-translate-y-10' : 'sm:translate-y-8'}>
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={p.img} alt={p.name} fill sizes="(max-width: 640px) 32vw, 24vw" className="object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 bg-[#ccff33] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[#08080a]">{p.price}</span>
                </div>
                <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-white/55">{p.name}</p>
              </div>
            ))}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] uppercase tracking-[0.32em] text-white/40">
            Night cotton · scroll to read
          </div>
        </div>
      </section>

      {/* ── 8c. 3D DECK ─────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#ccff33]">08c · Interactive</p>
            <h2 className="mt-2 text-[clamp(2rem,4.4vw,3.4rem)] uppercase leading-[0.9]" style={display}>The night deck</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
              Tilt the deck. Each layer carries its own depth, so the stack reads like a physical
              sample set.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.2em] text-white/60">
              {['280 GSM', 'Garment dyed', 'Made in India'].map((t) => (
                <span key={t} className="border border-white/20 px-2.5 py-1">{t}</span>
              ))}
            </div>
            <div className="mt-6 grid max-w-xs grid-cols-3 gap-2">
              {['S', 'M', 'L'].map((s) => (
                <span key={s} className="border border-white/20 py-1.5 text-center text-[10px] uppercase tracking-[0.18em] text-white/70">{s}</span>
              ))}
            </div>
          </div>
          <TiltCard className="mx-auto w-full max-w-md" max={12} glare>
            <div className="relative aspect-[4/5] overflow-hidden bg-[#141416]">
              <Image src={TRENDING[1].img} alt={TRENDING[1].name} fill sizes="(max-width: 1024px) 90vw, 40vw" className="object-cover" />
              <span style={{ transform: 'translateZ(80px)' }} className="absolute left-3 top-3 bg-[#ccff33] px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-[#08080a]">
                {TRENDING[1].tag}
              </span>
              <span style={{ transform: 'translateZ(50px)' }} className="absolute bottom-3 right-3 bg-[#08080a]/85 px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-[#ccff33]">
                {TRENDING[1].price}
              </span>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── 9. CUSTOMER REVIEWS (marquee) ────────────────────────── */}
      <section className="overflow-hidden py-16">
        <div className="mx-auto mb-8 max-w-[1600px] px-5 sm:px-8 lg:px-12">
          <Head n="09" title="Customer reviews" />
        </div>
        <div className="flex w-max animate-marquee gap-4 whitespace-nowrap">
          {[...REVIEWS, ...REVIEWS].map((r, i) => (
            <blockquote key={`${r.name}-${i}`} className="w-[80vw] shrink-0 border border-white/12 p-6 sm:w-[36vw] lg:w-[26vw]">
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <span key={j} className="text-[#ccff33]">★</span>
                ))}
              </div>
              <p className="mt-3 whitespace-normal text-sm leading-relaxed text-white/80">“{r.text}”</p>
              <footer className="mt-4 text-[9px] uppercase tracking-[0.24em] text-white/40">{r.name} — {r.city}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ── 10. UGC / CUSTOMER VIDEOS ────────────────────────────── */}
      <section className="border-y border-white/10 px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <Head n="10" title="Worn by you" action="Tag @mentoos" />
          <div data-reveal-group className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {UGC.map((u) => (
              <div key={u.handle} className="group relative overflow-hidden bg-[#141416]">
                <div className="relative aspect-[9/14]">
                  <Image src={u.img} alt={u.caption} fill sizes="(max-width: 640px) 50vw, 24vw" className="object-cover opacity-85 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080a]/70 via-transparent to-transparent" />
                </div>
                <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-[#ccff33] text-[#08080a]"><Play className="h-3.5 w-3.5 fill-current" /></span>
                <div className="absolute inset-x-3 bottom-3">
                  <p className="text-xs text-white">{u.handle}</p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/55">{u.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. INSTAGRAM / SOCIAL ───────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <Head n="11" title="@mentoos on Instagram" action="Follow" />
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {SOCIAL.map((s) => (
              <a key={s.caption} href="https://instagram.com" target="_blank" rel="noreferrer" className="group relative block overflow-hidden">
                <div className="relative aspect-square">
                  <Image src={s.img} alt={s.caption} fill sizes="33vw" className="object-cover transition-transform duration-[900ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[#ccff33]/0 transition-colors duration-500 group-hover:bg-[#ccff33]/85" />
                </div>
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[#08080a] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Heart className="h-4 w-4 fill-current" />
                  <span className="text-[9px] uppercase tracking-[0.2em]">{s.likes}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. OFFERS ───────────────────────────────────────────── */}
      <section className="bg-[#ccff33] px-5 py-14 text-[#08080a] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6 flex items-center justify-between border-b border-[#08080a] pb-2 text-[10px] uppercase tracking-[0.28em]">
            <span>12 / Offers</span>
            <span>Apply at checkout</span>
          </div>
          <div className="space-y-0">
            {OFFERS.map((o) => (
              <div key={o.code} className="flex flex-wrap items-center justify-between gap-4 border-b border-[#08080a] py-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.26em] opacity-60">{o.rule}</p>
                  <h3 className="mt-1 text-[clamp(1.5rem,3.4vw,2.6rem)] uppercase leading-none" style={display}>{o.headline}</h3>
                  <p className="mt-1 text-[11px] opacity-70">{o.detail}</p>
                </div>
                <span className="border border-[#08080a] px-4 py-2 text-[11px] font-bold tracking-[0.18em]">{o.code}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. TRUST ────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-[#0d0d10] px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[1600px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <div key={t.title} className="border-l border-[#ccff33]/40 pl-4">
                <Icon className="h-5 w-5 text-[#ccff33]" />
                <h3 className="mt-3 text-sm uppercase leading-tight tracking-[0.04em]">{t.title}</h3>
                <p className="mt-1.5 text-[10px] leading-relaxed text-white/45">{t.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 14. FOOTER (kinetic) ─────────────────────────────────── */}
      <footer className="relative overflow-hidden px-5 pb-10 pt-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-col justify-between gap-8 border-b border-white/10 pb-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.32em] text-[#ccff33]">Next drop</p>
              <p className="mt-2 text-[clamp(2.4rem,8vw,6rem)] uppercase leading-[0.82] text-transparent" style={{ ...display, WebkitTextStroke: '1.5px #f2f2ee' }}>
                Made to move
              </p>
            </div>
            <div className="flex items-center gap-2 border-b border-white/25 pb-2 lg:w-72">
              <input type="email" placeholder="Email for drop alerts" aria-label="Email" className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none" />
              <button type="button" className="text-[9px] uppercase tracking-[0.22em] text-[#ccff33]">Join</button>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-7 gap-y-2 text-[10px] uppercase tracking-[0.26em] text-white/45">
              <Link className="hover:text-[#ccff33]" href="/products">Runway</Link>
              <Link className="hover:text-[#ccff33]" href="/shipping">Shipping</Link>
              <Link className="hover:text-[#ccff33]" href="/returns">Returns</Link>
              <Link className="hover:text-[#ccff33]" href="/support">Support</Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[9px] uppercase tracking-[0.26em] text-white/30">
              <span>32,000 runners · 4.8 ★</span>
              <span>© 2026 Mentoos Kinetic · Demo 04</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
