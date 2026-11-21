import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Heart, Award, Star } from 'lucide-react';
import { HeritageCraftsmanship } from '@/components/store/home/HeritageCraftsmanship';
import { ElevateEverydayStyle } from '@/components/store/home/ElevateEverydayStyle';

export const metadata: Metadata = {
  title: 'About Us | Heritage Meets Modern Craftsmanship | Mentoos',
  description: 'The story behind Mentoos — modern men’s fashion engineered for Indian physiques, heavyweight fabrics, and effortless daily confidence.',
  alternates: { canonical: '/about' },
};

const PILLARS = [
  {
    icon: '🧵',
    title: '240 GSM Heavyweight Cotton',
    description: 'We only source dense, combed yarns that drape naturally with zero clinging or premature fading.',
  },
  {
    icon: '🌿',
    title: '100% Pure French Flax',
    description: 'Pre-washed linen woven for maximum breathability under high heat and humid tropical climates.',
  },
  {
    icon: '📐',
    title: 'Calibrated For Indian Men',
    description: 'Shoulder drops, chest taper, and sleeve lengths designed around real Indian proportions.',
  },
  {
    icon: '💎',
    title: 'Direct-to-Customer Value',
    description: 'Fair pricing with no middlemen markups — just honest premium clothing built to last seasons.',
  },
];

const STEPS = [
  { step: '01', title: 'Yarn Sourcing & Dyeing', desc: 'Ring-spun organic fibers treated with reactive dyes for rich, fade-resistant color.' },
  { step: '02', title: 'Pre-Shrunk Testing', desc: 'Every fabric batch undergoes hot wash cycling to ensure zero shrinkage after your first laundry day.' },
  { step: '03', title: 'Artisanal Assembly', desc: 'Reinforced collar ribs, bar-tacked stress points, and dual-needle edge stitching.' },
  { step: '04', title: 'Doorstep Delivery', desc: 'Fast express dispatch with 7-day hassle-free doorstep exchange across India.' },
];

export default function AboutPage() {
  return (
    <div className="space-y-12 sm:space-y-16 py-6 sm:py-10">
      {/* 1. Hero Brand Statement */}
      <section className="relative overflow-hidden rounded-[36px] bg-[#fbf9f5] border border-line p-8 sm:p-14 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sand/70 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#64aa34]">
            <Sparkles className="h-3 w-3" /> The Mentoos Story
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink leading-[1.05]">
            Redefining Everyday Menswear for Modern India.
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-ink-muted">
            Mentoos was founded on a simple realization: Indian men were forced to choose between flimsy fast-fashion tees that shrink after two washes, or overpriced luxury brands that fail to fit Indian physiques. We set out to build heavyweight, enduring pieces tailored specifically for how you live and move.
          </p>
        </div>

        {/* Stats Row */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-line">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-ink">230k+</p>
            <p className="text-xs text-ink-muted mt-0.5">Men Styled Nationwide</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-ink">9 / 10</p>
            <p className="text-xs text-ink-muted mt-0.5">Clients Recommend Us</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-ink">4.9 ★</p>
            <p className="text-xs text-ink-muted mt-0.5">Verified Customer Rating</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-ink">100%</p>
            <p className="text-xs text-ink-muted mt-0.5">Pre-Shrunk Natural Yarns</p>
          </div>
        </div>
      </section>

      {/* 2. "Heritage Meets Modern Craftsmanship" Component (Ref: Image 1) */}
      <HeritageCraftsmanship />

      {/* 3. The 4 Fabric & Design Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-800">
            Uncompromising Standards
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Our Four Craftsmanship Pillars
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted">
            The guiding rules behind every pattern, sample, and garment we release.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[24px] border border-line bg-white/80 p-6 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <span className="text-2xl">{pillar.icon}</span>
              <h3 className="text-base font-extrabold text-ink">{pillar.title}</h3>
              <p className="text-xs leading-relaxed text-ink-muted">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. "Elevate Your Everyday Style" Dark Showcase (Ref: Image 2) */}
      <ElevateEverydayStyle />

      {/* 5. Production Journey / Behind The Seams */}
      <section className="rounded-[32px] border border-line bg-sand/60 p-8 sm:p-12 space-y-8">
        <div className="max-w-xl space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-800">
            Behind The Seams
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            How We Build Every Piece
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted">
            From raw spinning mills to your wardrobe, transparency is our promise.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s) => (
            <div key={s.step} className="rounded-2xl bg-white/90 p-5 border border-line/70 shadow-sm space-y-2">
              <span className="text-xs font-black text-[#64aa34] tracking-widest">{s.step}</span>
              <h3 className="text-sm font-extrabold text-ink">{s.title}</h3>
              <p className="text-xs text-ink-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Call to Action */}
      <section className="rounded-[30px] bg-ink p-8 sm:p-12 text-white text-center space-y-5 shadow-xl">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Ready to Upgrade Your Daily Wardrobe?
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto">
          Explore our latest drops of heavyweight oversized tees, breathable linen shirts, and modern Indian ethnic wear.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/products?sort=createdAt&order=desc"
            className="inline-flex items-center gap-2 rounded-xl bg-[#c6f03d] px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-slate-950 transition-all hover:bg-[#b8e232] hover:scale-105"
          >
            Shop New Arrivals <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white transition-all hover:bg-white/20"
          >
            Browse All Styles
          </Link>
        </div>
      </section>
    </div>
  );
}
