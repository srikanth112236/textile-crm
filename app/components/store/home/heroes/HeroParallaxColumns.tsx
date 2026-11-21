'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

const COLUMN_1 = [
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=500&q=80',
];

const COLUMN_2 = [
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=500&q=80',
];

const COLUMN_3 = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=80',
];

export function HeroParallaxColumns() {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-line bg-white/80 p-6 sm:p-12 shadow-sm backdrop-blur-md">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left Narrative Block */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sand/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-ink">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Aceternity 02 · Staggered Parallax Grid</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ink leading-[1.05]">
            SHARP PROFILES.<br />
            <span className="italic font-serif text-amber-700">UNRESTRICTED</span> DRAPE.
          </h2>

          <p className="text-xs sm:text-sm leading-relaxed text-ink-muted max-w-lg">
            Experience our dynamic spring-staggered collection grid. Built for high-motion lifestyles, whether you are stepping into a formal boardroom or an effortless weekend lounge.
          </p>

          {/* Feature List */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Heavyweight 240 GSM</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>100% French Linen</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Pre-Shrunk Luxury Yarns</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Artisanal Tailoring</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/products?sort=createdAt&order=desc"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white transition-all hover:bg-slate-800 shadow-md active:scale-95"
            >
              <span>Explore Parallax Drops</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right 3-Column Floating Parallax Cards */}
        <div className="lg:col-span-6 relative h-[440px] sm:h-[500px] overflow-hidden rounded-3xl bg-sand/40 border border-line p-3">
          {/* Top and Bottom Fading Gradients */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/90 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent z-10" />

          <div className="grid grid-cols-3 gap-3 h-full">
            {/* Column 1 - Moving Up */}
            <motion.div
              animate={{ y: [0, -70, 0] }}
              transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
              className="flex flex-col gap-3"
            >
              {COLUMN_1.map((src, i) => (
                <div key={i} className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-sand shadow-sm border border-line">
                  <Image src={src} alt="Outfit" fill className="object-cover" sizes="150px" />
                </div>
              ))}
            </motion.div>

            {/* Column 2 - Moving Down (Counter Stagger) */}
            <motion.div
              animate={{ y: [-50, 20, -50] }}
              transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
              className="flex flex-col gap-3 pt-4"
            >
              {COLUMN_2.map((src, i) => (
                <div key={i} className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-sand shadow-sm border border-line">
                  <Image src={src} alt="Outfit" fill className="object-cover" sizes="150px" />
                </div>
              ))}
            </motion.div>

            {/* Column 3 - Moving Up */}
            <motion.div
              animate={{ y: [-20, -90, -20] }}
              transition={{ repeat: Infinity, duration: 13, ease: 'easeInOut' }}
              className="flex flex-col gap-3"
            >
              {COLUMN_3.map((src, i) => (
                <div key={i} className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-sand shadow-sm border border-line">
                  <Image src={src} alt="Outfit" fill className="object-cover" sizes="150px" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
