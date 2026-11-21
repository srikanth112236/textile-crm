'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star, Award, ShieldCheck } from 'lucide-react';

const LOOKBOOK_WORDS = ['MODERN MEN', 'EFFORTLESS MOVEMENT', 'TROPICAL DAYS', 'TIMELESS EVENINGS'];

const LOOKS = [
  {
    title: 'THE BOXY 240 GSM DROP',
    caption: 'Heavyweight organic combed yarns',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=85',
    link: '/products?search=oversized',
  },
  {
    title: 'RESORT CUBAN LINEN',
    caption: 'Pure French flax in earth tones',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=85',
    link: '/products?search=linen',
  },
  {
    title: 'ARTISANAL INDO-WESTERN',
    caption: 'Handcrafted slub & jacquard sets',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=85',
    link: '/products?category=ethnic-wear',
  },
];

export function HeroEditorialLookbookParallax() {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % LOOKBOOK_WORDS.length);
    }, 2700);
    return () => clearInterval(timer);
  }, []);

  const currentWord = LOOKBOOK_WORDS[wordIdx];

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-line bg-[#fcfbf8] p-6 sm:p-12 shadow-sm">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-sand/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ink">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            <span>Masterpiece 15 · Lookbook Magazine Parallax</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono font-bold tracking-widest text-ink-muted uppercase">
              MENTOOS // EDITORIAL LOOKBOOK
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-ink uppercase leading-none">
              BUILT FOR
            </h2>

            {/* Flip Word */}
            <div className="h-14 sm:h-20 flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWord}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif italic text-3xl sm:text-5xl font-bold text-amber-800 leading-none"
                >
                  {currentWord}.
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-ink-muted">
            Explore curated lookbook spreads pairing dropped-shoulder heavyweight tees, breathable Cuban collar linens, and artisanal Indian ethnic coordinates.
          </p>

          {/* Social Proof Badges */}
          <div className="space-y-2 pt-1 border-t border-line/60">
            <div className="flex items-center gap-2 text-xs font-bold text-ink">
              <div className="flex text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>Rated 4.9/5 by 10,000+ Men Across India</span>
            </div>
            <p className="text-[11px] text-ink-muted">
              🚚 Express 48-Hour Dispatch · 🔄 7-Day Easy Doorstep Pickup
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/products?sort=createdAt&order=desc"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white transition-all hover:bg-slate-800 shadow-md active:scale-95"
            >
              <span>Explore Magazine Edit</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right 3-Card Parallax Lookbook Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {LOOKS.map((item, idx) => (
            <Link
              key={item.title}
              href={item.link}
              className={`group relative overflow-hidden rounded-[26px] border border-line bg-sand/50 p-2.5 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 ${
                idx === 1 ? 'sm:translate-y-6' : idx === 2 ? 'sm:-translate-y-4' : ''
              }`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#ebe7df]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-xs font-extrabold leading-tight">{item.title}</h3>
                  <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-1">{item.caption}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
