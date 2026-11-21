'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star } from 'lucide-react';

const VERBS = ['COMMAND', 'ELEVATE', 'ENDURE', 'DISTINGUISH'];

const TRIPLE_CARDS = [
  {
    tag: 'STREETWEAR // 240 GSM',
    title: 'Boxy Dropped Shoulder Tee',
    price: '₹899',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=85',
    link: '/products?search=oversized',
    offset: 'translate-y-0',
  },
  {
    tag: 'RESORT // PURE FLAX',
    title: 'Textured Cuban Collar Shirt',
    price: '₹1,399',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=85',
    link: '/products?search=linen',
    offset: 'sm:translate-y-6',
  },
  {
    tag: 'FESTIVE // ARTISANAL',
    title: 'Ivory Slub Short Kurta',
    price: '₹1,299',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=85',
    link: '/products?category=ethnic-wear',
    offset: 'sm:-translate-y-4',
  },
];

export function HeroKineticTypographyParallax() {
  const [verbIdx, setVerbIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVerbIdx((prev) => (prev + 1) % VERBS.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const currentVerb = VERBS[verbIdx];

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-line bg-[#fcfbf8] p-6 sm:p-12 shadow-sm">
      {/* Background Kinetic Marquee Watermark */}
      <div className="pointer-events-none absolute -top-8 inset-x-0 overflow-hidden opacity-5 select-none whitespace-nowrap">
        <span className="text-[120px] font-black uppercase tracking-tighter text-ink animate-marquee">
          MENTOOS LUXURY MENSWEAR · OVERSIZED DROPS · FRENCH LINEN · MENTOOS LUXURY MENSWEAR ·
        </span>
      </div>

      <div className="relative z-10 space-y-8">
        {/* Header Block with Flip Verb */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-sand/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ink">
              <Sparkles className="h-3.5 w-3.5 text-amber-700" />
              <span>Masterpiece 13 · Kinetic Verb Parallax</span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-mono font-bold tracking-widest text-ink-muted uppercase">
                TAILORED FOR THE MODERN PHYSIQUE
              </p>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink uppercase leading-none">
                ENGINEERED TO
              </h2>

              <div className="h-14 sm:h-20 flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={currentVerb}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="font-serif italic text-4xl sm:text-6xl lg:text-7xl font-bold text-amber-800 leading-none"
                  >
                    {currentVerb}.
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/products?sort=createdAt&order=desc"
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white transition-all hover:bg-slate-800 shadow-md active:scale-95"
            >
              <span>Explore Collection</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Over 10,000+ Verified Buyers</span>
            </div>
          </div>
        </div>

        {/* 3 Floating Staggered Parallax Look Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
          {TRIPLE_CARDS.map((card, idx) => (
            <Link
              key={card.title}
              href={card.link}
              className={`group relative overflow-hidden rounded-[28px] border border-line bg-sand/40 p-3 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 ${card.offset}`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#ebe7df]">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink backdrop-blur-md shadow-xs">
                  {card.tag}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 px-1">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-ink group-hover:text-amber-800 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm font-extrabold text-ink mt-0.5">{card.price}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-ink group-hover:bg-[#c6f03d] group-hover:text-slate-950 transition-colors shadow-xs">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
