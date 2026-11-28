'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Boxes, Play, RotateCcw, Ruler, ShieldCheck, Truck } from 'lucide-react';
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
import { jetbrainsMono, spaceGrotesk, syne } from './fonts';

const SPECS = [
  { k: 'Fabric weight', v: '240 – 280 GSM' },
  { k: 'Shrinkage', v: '≤ 2.1 % bio-wash' },
  { k: 'Stitch density', v: '12 SPI lockstitch' },
  { k: 'Origin', v: 'Tiruppur · India' },
];

const TRUST_ICONS = [Truck, RotateCcw, Ruler, ShieldCheck];
const mono = { fontFamily: 'var(--font-jetbrains-mono)' } as const;
const display = { fontFamily: 'var(--font-syne)' } as const;

function Label({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-8 flex items-center justify-between border-b-2 border-[#0a0a0a] pb-2">
      <span className="text-[10px] uppercase tracking-[0.28em]" style={mono}>
        {n} / {children}
      </span>
      <span className="text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a]/45" style={mono}>
        Mentoos spec
      </span>
    </div>
  );
}

export default function Demo2Page() {
  const scope = useRef<HTMLDivElement>(null);
  useDemoScroll(scope);

  return (
    <div
      ref={scope}
      className={`${syne.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} relative min-h-screen overflow-x-clip bg-[#f2f0eb] text-[#0a0a0a]`}
      style={{ fontFamily: 'var(--font-space-grotesk)' }}
    >
      {/* ── 0. SITE HEADER (shared, unchanged) ───────────────────── */}
      <Header />

      {/* ── 1. HERO ──────────────────────────────────────────────── */}
      <section
        data-parallax-scope
        className="relative overflow-hidden border-b-2 border-[#0a0a0a] px-4 pb-12 pt-12 sm:px-6 lg:px-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(10,10,10,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.07) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      >
        <div data-parallax="0.3" className="pointer-events-none absolute right-[6%] top-[16%] h-36 w-36 bg-[#d4ff3f] sm:h-52 sm:w-52" />
        <div data-parallax="-0.18" className="pointer-events-none absolute bottom-[10%] left-[3%] h-20 w-20 rounded-full border-2 border-[#0a0a0a] sm:h-32 sm:w-32" />

        <div className="relative mx-auto max-w-[1600px]">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#0a0a0a] pb-3" style={mono}>
            <span className="text-[10px] uppercase tracking-[0.3em]">Specification sheet — rev. 2.6</span>
            <span className="text-[10px] uppercase tracking-[0.3em]">Autumn / Winter 2026</span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: EASE_OUT }}
                className="text-[clamp(3.2rem,9.6vw,8.4rem)] font-extrabold uppercase leading-[0.84] tracking-[-0.03em]"
                style={display}
              >
                Built to
                <span className="mx-3 inline-block bg-[#0a0a0a] px-2 text-[#d4ff3f]">spec</span>
                <br />
                not hype.
              </motion.h1>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-[#0a0a0a]/70">
                Mentoos menswear is published like hardware: weight, shrinkage, stitch density and
                origin printed next to every garment.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/products" className="border-2 border-[#0a0a0a] bg-[#0a0a0a] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#f2f0eb] hover:bg-[#d4ff3f] hover:text-[#0a0a0a]">
                  Open catalogue
                </Link>
                <Link href="/about" className="border-2 border-[#0a0a0a] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.22em] hover:bg-[#0a0a0a] hover:text-[#f2f0eb]">
                  Read the method
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="border-2 border-[#0a0a0a]">
                <div className="flex items-center justify-between border-b-2 border-[#0a0a0a] px-3 py-2" style={mono}>
                  <span className="text-[10px] uppercase tracking-[0.22em]">Test report</span>
                  <span className="text-[10px]">MT-240</span>
                </div>
                <dl className="divide-y divide-[#0a0a0a]/15">
                  {SPECS.map((s) => (
                    <div key={s.k} className="flex items-center justify-between gap-4 px-3 py-2.5">
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-[#0a0a0a]/55" style={mono}>{s.k}</dt>
                      <dd className="text-[11px] font-semibold" style={mono}>{s.v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="relative aspect-[16/10] border-t-2 border-[#0a0a0a]">
                  <Image src={NEW_ARRIVALS[0].img} alt="Specification reference" fill priority sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
                  <span className="absolute bottom-2 left-2 bg-[#0a0a0a] px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-[#d4ff3f]" style={mono}>
                    Ref / tee-240
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SHOP BY CATEGORY ──────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <Label n="02">Shop by category</Label>
          <div data-reveal-group className="grid grid-cols-2 gap-0 lg:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <Link key={c.name} href="/products" className="group relative border-2 border-[#0a0a0a] p-3 transition-colors hover:bg-[#d4ff3f] [&:not(:first-child)]:-ml-0.5 [&:not(:first-child)]:-mt-0.5">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={c.img} alt={c.name} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0" />
                </div>
                <div className="mt-3 flex items-center justify-between" style={mono}>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.16em]">{c.name}</h3>
                  <span className="text-[9px] uppercase tracking-[0.16em]">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[#0a0a0a]/50" style={mono}>{c.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. NEW ARRIVALS ──────────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <Label n="03">New arrivals</Label>
          <div data-reveal-group className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {NEW_ARRIVALS.map((p, i) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group border-2 border-[#0a0a0a] bg-[#f2f0eb] shadow-[8px_8px_0_0_#0a0a0a] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0_0_#0a0a0a]">
                <div className="flex items-center justify-between border-b-2 border-[#0a0a0a] px-3 py-2" style={mono}>
                  <span className="text-[9px] uppercase tracking-[0.18em]">{p.tag}</span>
                  <span className="text-[9px]">0{i + 1}</span>
                </div>
                <div className="relative aspect-square overflow-hidden">
                  <Image src={p.img} alt={p.name} fill sizes="(max-width: 640px) 100vw, 24vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                </div>
                <div className="border-t-2 border-[#0a0a0a] px-3 py-3 transition-colors group-hover:bg-[#d4ff3f]">
                  <h3 className="text-[12px] font-extrabold uppercase leading-tight tracking-[0.05em]" style={display}>{p.name}</h3>
                  <div className="mt-1 flex items-center justify-between" style={mono}>
                    <span className="text-[11px]">{p.price}</span>
                    <span className="text-[9px] uppercase tracking-[0.16em]">{p.colour}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. TRENDING NOW (pinned) ─────────────────────────────── */}
      <section className="relative flex items-center overflow-x-auto border-b-2 border-[#0a0a0a] bg-[#e7e4dc] pb-12 pt-24 lg:h-[100svh] lg:overflow-hidden lg:py-0">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b-2 border-[#0a0a0a] bg-[#f2f0eb] px-4 py-3 sm:px-6" style={mono}>
          <span className="text-[10px] uppercase tracking-[0.24em]">04 / Trending now</span>
          <span className="text-[10px] uppercase tracking-[0.24em]">Scroll →</span>
        </div>
        <div data-hscroll className="mt-8 flex w-max snap-x snap-mandatory items-end gap-6 px-4 sm:gap-8 sm:px-6 lg:mt-0">
          {TRENDING.map((p, i) => (
            <article key={p.id} className="group w-[80vw] shrink-0 sm:w-[50vw] lg:w-[36vw]">
              <div className="flex items-center justify-between border-2 border-[#0a0a0a] bg-[#f2f0eb] px-3 py-2" style={mono}>
                <span className="text-[10px] uppercase tracking-[0.2em]">{String(i + 1).padStart(2, '0')} — {p.tag}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a]/50">{p.rating} ★</span>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden border-x-2 border-[#0a0a0a]">
                <Image src={p.img} alt={p.name} fill sizes="(max-width: 1024px) 80vw, 36vw" className="object-cover grayscale transition-all duration-700 group-hover:scale-[1.04] group-hover:grayscale-0" />
              </div>
              <div className="flex items-center justify-between border-2 border-[#0a0a0a] bg-[#d4ff3f] px-3 py-2">
                <h3 className="text-base font-extrabold uppercase" style={display}>{p.name}</h3>
                <span className="text-[11px]" style={mono}>{p.price}</span>
              </div>
            </article>
          ))}
          <div className="w-[8vw] shrink-0" />
        </div>
      </section>

      {/* ── 5. BEST SELLERS ──────────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <Label n="05">Best sellers</Label>
          <div className="border-t-2 border-[#0a0a0a]">
            {BEST_SELLERS.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="group grid grid-cols-12 items-center gap-3 border-b-2 border-[#0a0a0a] px-1 py-5 transition-colors hover:bg-[#0a0a0a] hover:text-[#f2f0eb]">
                <span className="col-span-2 text-xl font-extrabold sm:col-span-1" style={display}>{p.tag}</span>
                <div className="col-span-2 sm:col-span-1">
                  <div className="relative h-14 w-12 overflow-hidden">
                    <Image src={p.img} alt={p.name} fill sizes="60px" className="object-cover" />
                  </div>
                </div>
                <h3 className="col-span-5 text-sm font-bold uppercase tracking-[0.04em] sm:col-span-4">{p.name}</h3>
                <p className="col-span-12 text-[10px] uppercase tracking-[0.18em] opacity-60 sm:col-span-3" style={mono}>
                  {p.reviews} sold · {p.colour}
                </p>
                <span className="col-span-3 flex items-center justify-end gap-3 text-[11px] sm:col-span-3" style={mono}>
                  {p.price} <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. SHOP BY FIT ───────────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] bg-[#0a0a0a] px-4 py-16 text-[#f2f0eb] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 flex items-center justify-between border-b-2 border-[#f2f0eb] pb-2" style={mono}>
            <span className="text-[10px] uppercase tracking-[0.28em]">06 / Shop by fit</span>
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#d4ff3f]">Measured flat</span>
          </div>
          <div data-reveal-group className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FITS.map((f, i) => (
              <Link key={f.name} href="/products" className="group border-2 border-[#f2f0eb] p-3 transition-colors hover:bg-[#d4ff3f] hover:text-[#0a0a0a]">
                <div className="flex items-baseline justify-between" style={mono}>
                  <span className="text-[28px] font-bold leading-none">0{i + 1}</span>
                  <span className="text-[9px] uppercase tracking-[0.2em]">Fit</span>
                </div>
                <div className="relative mt-3 aspect-[4/3] overflow-hidden">
                  <Image src={f.img} alt={f.name} fill sizes="(max-width: 640px) 100vw, 24vw" className="object-cover" />
                </div>
                <h3 className="mt-3 text-sm font-extrabold uppercase tracking-[0.05em]" style={display}>{f.name}</h3>
                <p className="mt-1 text-[9px] uppercase tracking-[0.16em] opacity-60" style={mono}>{f.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. SHOP BY STYLE ─────────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <Label n="07">Shop by style</Label>
          <div data-reveal-group className="grid grid-cols-1 border-t-2 border-l-2 border-[#0a0a0a] sm:grid-cols-2">
            {STYLES.map((s, i) => (
              <Link key={s.name} href="/products" className="group grid grid-cols-5 border-b-2 border-r-2 border-[#0a0a0a]">
                <div className="col-span-2 relative aspect-square overflow-hidden">
                  <Image src={s.img} alt={s.name} fill sizes="20vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="col-span-3 flex flex-col justify-between p-4 transition-colors group-hover:bg-[#0a0a0a] group-hover:text-[#f2f0eb]">
                  <span className="text-[9px] uppercase tracking-[0.22em]" style={mono}>Style 0{i + 1}</span>
                  <div>
                    <h3 className="text-lg font-extrabold uppercase leading-tight" style={display}>{s.name}</h3>
                    <p className="mt-1 text-[11px] leading-snug opacity-60">{s.note}</p>
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.2em]" style={mono}>View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. SHOP THE LOOK ─────────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] bg-[#e7e4dc] px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <Label n="08">Shop the look</Label>
          <div className="grid gap-5 lg:grid-cols-3">
            {LOOKS.map((l, i) => (
              <article key={l.title} className="border-2 border-[#0a0a0a] bg-[#f2f0eb]">
                <div className="flex items-center justify-between border-b-2 border-[#0a0a0a] px-3 py-2" style={mono}>
                  <span className="text-[10px] uppercase tracking-[0.2em]">{l.note}</span>
                  <span className="text-[10px]">0{i + 1}</span>
                </div>
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image src={l.img} alt={l.title} fill sizes="(max-width: 1024px) 100vw, 32vw" className="object-cover" />
                </div>
                <div className="border-t-2 border-[#0a0a0a] p-3">
                  <h3 className="text-base font-extrabold uppercase" style={display}>{l.title}</h3>
                  <ul className="mt-2 space-y-1" style={mono}>
                    {l.pieces.map((piece) => (
                      <li key={piece} className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] opacity-60">
                        <span>{piece}</span>
                        <span>+</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8b. ANATOMY (sticky exploded layers) ─────────────────── */}
      <section data-parallax-scope className="relative h-[180svh] border-b-2 border-[#0a0a0a] bg-[#e7e4dc]">
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-4 sm:px-6 lg:px-10">
          <div className="mx-auto grid w-full max-w-[1400px] gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-4">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#0a0a0a]/55" style={mono}>08b / Anatomy</p>
              <h2 className="mt-3 text-[clamp(1.7rem,3.4vw,2.6rem)] font-extrabold uppercase leading-[0.95]" style={display}>Four layers, one tee</h2>
              <ul className="mt-6 divide-y divide-[#0a0a0a]/15 border-y border-[#0a0a0a]/15">
                {[['Shell', '240 GSM combed cotton'], ['Pattern', '14 CAD panels · 0.5 mm'], ['Seam', '12 SPI twin needle'], ['Trim', '2 cm ribbed collar']].map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between gap-3 py-2.5" style={mono}>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#0a0a0a]/55">{k}</span>
                    <span className="text-right text-[10px]">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative mx-auto aspect-square w-[62vw] max-w-[360px] lg:col-span-8 lg:w-full lg:max-w-[440px]">
              {[
                { img: NEW_ARRIVALS[0].img, depth: '0.5', scale: 1 },
                { img: TRENDING[1].img, depth: '0.3', scale: 0.86 },
                { img: BEST_SELLERS[0].img, depth: '0.14', scale: 0.72 },
              ].map((layer, i) => (
                <div key={i} className="absolute inset-0" style={{ scale: layer.scale }}>
                  <div data-parallax={layer.depth} className="absolute inset-0 border-2 border-[#0a0a0a] bg-[#f2f0eb]">
                    <Image src={layer.img} alt="Specification layer" fill sizes="(max-width: 1024px) 62vw, 30vw" className={i === 0 ? 'object-cover' : 'object-cover opacity-80 mix-blend-multiply'} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8c. 3D STACK ─────────────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] bg-[#0a0a0a] px-4 py-20 text-[#f2f0eb] sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#d4ff3f]" style={mono}>08c / Interactive</p>
            <h2 className="mt-3 text-[clamp(1.7rem,3.4vw,2.6rem)] font-extrabold uppercase leading-[0.95]" style={display}>The drop, stacked</h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#f2f0eb]/60">
              Four units from one fabric lot. Tilt the stack to read each piece at an angle.
            </p>
            <div className="mt-6 flex flex-wrap gap-3" style={mono}>
              {['240 GSM', 'FLAX', 'WOOL'].map((t) => (
                <span key={t} className="border border-[#f2f0eb]/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em]">{t}</span>
              ))}
            </div>
          </div>
          <TiltCard className="mx-auto w-full max-w-md" max={9}>
            <div className="grid grid-cols-2 gap-3 [transform:rotateX(6deg)_rotateZ(-2deg)]">
              {[...NEW_ARRIVALS.slice(0, 2), ...TRENDING.slice(0, 2)].map((p, i) => (
                <div key={p.id} className="relative border-2 border-[#f2f0eb]/25 bg-[#141416]">
                  <div className="relative aspect-square">
                    <Image src={p.img} alt={p.name} fill sizes="(max-width: 1024px) 40vw, 20vw" className="object-cover" />
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 bg-[#d4ff3f] px-1.5 py-0.5 text-[9px] text-[#0a0a0a]" style={mono}>
                    0{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ── 9. CUSTOMER REVIEWS ──────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <Label n="09">Customer reviews</Label>
          <div className="grid gap-0 border-t-2 border-l-2 border-[#0a0a0a] sm:grid-cols-2 lg:grid-cols-4">
            {REVIEWS.map((r) => (
              <div key={r.name} className="border-b-2 border-r-2 border-[#0a0a0a] p-5">
                <div className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <span key={i} className="grid h-4 w-4 place-items-center bg-[#d4ff3f] text-[9px]" style={mono}>★</span>
                  ))}
                </div>
                <p className="mt-4 text-[12px] leading-relaxed">“{r.text}”</p>
                <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-[#0a0a0a]/50" style={mono}>
                  {r.name} / {r.city}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. UGC / CUSTOMER VIDEOS ────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] bg-[#0a0a0a] px-4 py-16 text-[#f2f0eb] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 flex items-center justify-between border-b-2 border-[#f2f0eb] pb-2" style={mono}>
            <span className="text-[10px] uppercase tracking-[0.28em]">10 / UGC — customer videos</span>
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#d4ff3f]">@mentoos</span>
          </div>
          <div data-reveal-group className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {UGC.map((u) => (
              <div key={u.handle} className="group relative border-2 border-[#f2f0eb]">
                <div className="relative aspect-[9/13] overflow-hidden">
                  <Image src={u.img} alt={u.caption} fill sizes="(max-width: 640px) 50vw, 24vw" className="object-cover" />
                </div>
                <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center bg-[#d4ff3f] text-[#0a0a0a]">
                  <Play className="h-3 w-3 fill-current" />
                </span>
                <div className="border-t-2 border-[#f2f0eb] p-2" style={mono}>
                  <p className="text-[9px] uppercase tracking-[0.16em]">{u.handle}</p>
                  <p className="mt-0.5 text-[9px] text-[#f2f0eb]/50">{u.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 11. INSTAGRAM / SOCIAL ───────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <Label n="11">Instagram / social</Label>
          <div className="grid grid-cols-3 border-t-2 border-l-2 border-[#0a0a0a] sm:grid-cols-6">
            {SOCIAL.map((s) => (
              <a key={s.caption} href="https://instagram.com" target="_blank" rel="noreferrer" className="group relative border-b-2 border-r-2 border-[#0a0a0a]">
                <div className="relative aspect-square overflow-hidden">
                  <Image src={s.img} alt={s.caption} fill sizes="16vw" className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0" />
                </div>
                <span className="absolute inset-0 flex items-center justify-center bg-[#d4ff3f]/0 text-[10px] uppercase tracking-[0.2em] text-[#0a0a0a] opacity-0 transition-all duration-300 group-hover:bg-[#d4ff3f]/85 group-hover:opacity-100" style={mono}>
                  ♥ {s.likes}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 12. OFFERS ───────────────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] bg-[#d4ff3f] px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8 flex items-center justify-between border-b-2 border-[#0a0a0a] pb-2" style={mono}>
            <span className="text-[10px] uppercase tracking-[0.28em]">12 / Offers</span>
            <span className="text-[10px] uppercase tracking-[0.28em]">Apply at checkout</span>
          </div>
          <div className="space-y-0">
            {OFFERS.map((o) => (
              <div key={o.code} className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#0a0a0a] py-6 first:border-t-2">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.26em]" style={mono}>{o.rule}</p>
                  <h3 className="mt-1 text-[clamp(1.4rem,3vw,2.2rem)] font-extrabold uppercase leading-none" style={display}>{o.headline}</h3>
                  <p className="mt-2 text-[11px] text-[#0a0a0a]/70">{o.detail}</p>
                </div>
                <span className="border-2 border-[#0a0a0a] bg-[#f2f0eb] px-4 py-2 text-[11px] font-bold tracking-[0.2em]" style={mono}>{o.code}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 13. TRUST ────────────────────────────────────────────── */}
      <section className="border-b-2 border-[#0a0a0a] px-4 py-14 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1600px] gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t, i) => {
            const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
            return (
              <div key={t.title} className="border-2 border-[#0a0a0a] p-4 [&:not(:first-child)]:-ml-0.5 [&:not(:first-child)]:-mt-0.5">
                <Icon className="h-5 w-5" />
                <h3 className="mt-3 text-[11px] font-extrabold uppercase leading-tight tracking-[0.05em]" style={display}>{t.title}</h3>
                <p className="mt-2 text-[10px] leading-relaxed text-[#0a0a0a]/60" style={mono}>{t.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 14. FOOTER (brutalist) ───────────────────────────────── */}
      <footer className="bg-[#0a0a0a] px-4 pb-10 pt-14 text-[#f2f0eb] sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid gap-10 border-b-2 border-[#f2f0eb]/20 pb-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d4ff3f]" style={mono}>Mentoos industrial</p>
              <p className="mt-3 text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold uppercase leading-[0.95]" style={display}>
                Garments with
                <br />
                a datasheet.
              </p>
              <div className="mt-5 flex max-w-xs items-center gap-2 border-b-2 border-[#f2f0eb]/30 pb-2">
                <Boxes className="h-4 w-4 text-[#d4ff3f]" />
                <input type="email" placeholder="spec@email.com" aria-label="Email" className="w-full bg-transparent text-[11px] text-[#f2f0eb] placeholder:text-[#f2f0eb]/30 focus:outline-none" style={mono} />
                <button type="button" className="text-[9px] uppercase tracking-[0.2em] text-[#d4ff3f]" style={mono}>Join</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[10px] uppercase tracking-[0.2em] text-[#f2f0eb]/60 lg:col-span-4 lg:col-start-7" style={mono}>
              <Link href="/products" className="hover:text-[#d4ff3f]">Range</Link>
              <Link href="/about" className="hover:text-[#d4ff3f]">Method</Link>
              <Link href="/shipping" className="hover:text-[#d4ff3f]">Shipping</Link>
              <Link href="/returns" className="hover:text-[#d4ff3f]">Returns</Link>
              <Link href="/support" className="hover:text-[#d4ff3f]">Support</Link>
              <Link href="/contact" className="hover:text-[#d4ff3f]">Contact</Link>
            </div>
            <div className="lg:col-span-2 lg:col-start-11">
              <p className="text-[9px] uppercase tracking-[0.24em] text-[#f2f0eb]/35" style={mono}>Tested</p>
              <p className="mt-2 text-[10px] leading-relaxed text-[#f2f0eb]/55" style={mono}>
                12 SPI · 48 h rest
                <br />
                2.1 % max shrink
              </p>
            </div>
          </div>
          <div className="mt-10 overflow-hidden">
            <p className="text-[13vw] font-extrabold uppercase leading-[0.78] tracking-[-0.04em] text-[#f2f0eb]/10" style={display}>
              MENTOOS
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[9px] uppercase tracking-[0.24em] text-[#f2f0eb]/40" style={mono}>
            <span>© 2026 Mentoos Spec</span>
            <span>Demo 02 · Brutalist</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
