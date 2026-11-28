'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Flame, ShieldCheck } from 'lucide-react';

const WORDS = ['THE SILHOUETTE', 'THE ATTITUDE', 'THE ARCHITECTURE', 'THE CONFIDENCE'];

const DIAGONAL_ITEMS_1 = [
  { title: 'Heavyweight Drop Tee', price: '₹899', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=85' },
  { title: 'Pure Flax Linen Shirt', price: '₹1,399', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=500&q=85' },
  { title: 'Tailored Wool Trousers', price: '₹1,599', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=500&q=85' },
];

const DIAGONAL_ITEMS_2 = [
  { title: 'Indo-Western Slub Kurta', price: '₹1,299', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=85' },
  { title: 'Utility Cargo Joggers', price: '₹1,499', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=500&q=85' },
  { title: 'Structured Evening Blazer', price: '₹3,499', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=85' },
];

export function HeroInfiniteDiagonalParallax() {
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % WORDS.length);
    }, 2700);
    return () => clearInterval(timer);
  }, []);

  const currentWord = WORDS[wordIdx];

  return (
    <section className="relative overflow-hidden rounded-[36px] bg-[#121316] p-6 sm:p-12 text-white shadow-2xl border border-white/10">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Flip Word Narrative */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-[#c6f03d] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#c6f03d]" />
            <span>Masterpiece 12 · Diagonal Runway Parallax</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
              NEW SEASON 2026 // CAPSULE 02
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white uppercase leading-none">
              WEAR
            </h2>

            {/* Flip Word */}
            <div className="h-14 sm:h-20 flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWord}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif italic text-2xl sm:text-3xl lg:text-4xl font-bold text-[#c6f03d] leading-none"
                >
                  {currentWord}.
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-slate-300 max-w-lg">
            A continuous diagonal runway track highlighting dropped shoulders, 240 GSM organic cotton, and effortless tailored drape.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/products?sort=createdAt&order=desc"
              className="inline-flex items-center gap-2 rounded-xl bg-[#c6f03d] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:bg-[#b8e232] shadow-lg shadow-lime-400/20 active:scale-95"
            >
              <span>Explore Diagonal Runway</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <span className="text-xs font-mono font-bold text-slate-400">
              ⚡ Limited Drop // 100% Pre-Shrunk
            </span>
          </div>
        </div>

        {/* Right Column: Skewed Diagonal Parallax Runway (2 Counter-Moving Tracks) */}
        <div className="lg:col-span-6 relative h-[440px] sm:h-[480px] overflow-hidden rounded-[28px] bg-black/40 border border-white/10 p-2 [transform:rotate(-4deg)_scale(1.04)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#121316] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#121316] to-transparent z-10" />

          <div className="grid grid-cols-2 gap-3 h-full">
            {/* Track 1 - Moving Up */}
            <motion.div
              animate={{ y: [0, -90, 0] }}
              transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
              className="flex flex-col gap-3"
            >
              {DIAGONAL_ITEMS_1.map((item, i) => (
                <div key={i} className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#1d1f24] border border-white/15 shadow-md">
                  <Image src={item.image} alt={item.title} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="180px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <p className="text-xs font-bold truncate">{item.title}</p>
                    <p className="text-xs font-black text-[#c6f03d]">{item.price}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Track 2 - Counter Moving Down */}
            <motion.div
              animate={{ y: [-70, 20, -70] }}
              transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
              className="flex flex-col gap-3 pt-6"
            >
              {DIAGONAL_ITEMS_2.map((item, i) => (
                <div key={i} className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#1d1f24] border border-white/15 shadow-md">
                  <Image src={item.image} alt={item.title} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="180px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <p className="text-xs font-bold truncate">{item.title}</p>
                    <p className="text-xs font-black text-[#c6f03d]">{item.price}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
