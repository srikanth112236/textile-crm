'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, Star } from 'lucide-react';

const FLIP_WORDS = ['DRAPE', 'SILHOUETTE', 'PRESENCE', 'CRAFTSMANSHIP'];

const CATEGORY_TABS = [
  { id: 'cat-1', label: '🔥 Oversized 240 GSM', href: '/products?search=oversized' },
  { id: 'cat-2', label: '🌿 French Flax Linen', href: '/products?search=linen' },
  { id: 'cat-3', label: '👑 Indo-Western Kurtas', href: '/products?category=ethnic-wear' },
  { id: 'cat-4', label: '👖 Utility Cargo Pants', href: '/products?category=joggers' },
];

const COL_LEFT = [
  { title: 'Heavyweight Boxy Tee', price: '₹899', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=500&q=85' },
  { title: 'Waffle Knit Polo', price: '₹999', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=500&q=85' },
  { title: 'Cargo Joggers 6-Pocket', price: '₹1,499', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=500&q=85' },
];

const COL_CENTER = [
  { title: 'Relaxed Cuban Linen', price: '₹1,399', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=85' },
  { title: 'Tailored Linen Set', price: '₹2,499', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=85' },
  { title: 'Ivory Slub Short Kurta', price: '₹1,299', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=85' },
];

const COL_RIGHT = [
  { title: 'Charcoal Evening Suit', price: '₹3,499', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=85' },
  { title: 'Pleated Wool Trousers', price: '₹1,599', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=500&q=85' },
  { title: 'Denim Overshirt Jacket', price: '₹2,199', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=85' },
];

export function HeroParallaxFlipSplit() {
  const [wordIdx, setWordIdx] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % FLIP_WORDS.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const currentWord = FLIP_WORDS[wordIdx];
  const currentCategory = CATEGORY_TABS[activeTab];

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-line bg-[#fbf9f5] p-6 sm:p-12 shadow-sm">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Left Content Column */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-sand/60 px-3.5 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-ink">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            <span>Masterpiece Hybrid · Parallax Columns + Flip Words</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-ink uppercase leading-none">
              REDEFINING MENSWEAR
            </h2>

            {/* Flip Word Element */}
            <div className="h-11 sm:h-16 flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWord}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="font-serif italic text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-700 leading-none"
                >
                  {currentWord}.
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-ink-muted max-w-lg">
            Heavyweight combed cotton yarns, French flax weaves, and relaxed tailoring engineered for everyday confidence across tropical Indian temperatures.
          </p>

          {/* Interactive Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {CATEGORY_TABS.map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 ${
                  activeTab === idx
                    ? 'bg-[#c6f03d] text-slate-950 font-black shadow-sm scale-105'
                    : 'border border-line bg-white/70 text-ink hover:bg-sand'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions & Rating */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Link
              href={currentCategory.href}
              className="inline-flex items-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-xs font-extrabold uppercase tracking-wide text-white transition-all hover:bg-slate-800 shadow-md active:scale-95"
            >
              <span>Shop {currentCategory.label.split(' ')[1]}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <div className="flex text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-black">4.9/5</span>
              <span className="text-ink-muted">(10k+ verified orders)</span>
            </div>
          </div>
        </div>

        {/* Right 3 Parallax Floating Columns */}
        <div className="lg:col-span-6 relative h-[440px] sm:h-[500px] overflow-hidden rounded-[30px] bg-sand/35 border border-line p-3">
          {/* Top & Bottom Vignettes */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#fbf9f5] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fbf9f5] to-transparent z-10" />

          <div className="grid grid-cols-3 gap-3 h-full">
            {/* Column 1 - Floating Up */}
            <motion.div
              animate={{ y: [0, -80, 0] }}
              transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
              className="flex flex-col gap-3"
            >
              {COL_LEFT.map((item, i) => (
                <div
                  key={i}
                  className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-sand shadow-sm border border-line"
                >
                  <Image src={item.image} alt={item.title} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="160px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-bold truncate">{item.title}</p>
                    <p className="text-xs font-black text-[#c6f03d]">{item.price}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Column 2 - Floating Down (Counter-Parallax) */}
            <motion.div
              animate={{ y: [-70, 15, -70] }}
              transition={{ repeat: Infinity, duration: 16, ease: 'easeInOut' }}
              className="flex flex-col gap-3 pt-6"
            >
              {COL_CENTER.map((item, i) => (
                <div
                  key={i}
                  className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-sand shadow-sm border border-line"
                >
                  <Image src={item.image} alt={item.title} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="160px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-bold truncate">{item.title}</p>
                    <p className="text-xs font-black text-[#c6f03d]">{item.price}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Column 3 - Floating Up */}
            <motion.div
              animate={{ y: [-20, -95, -20] }}
              transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
              className="flex flex-col gap-3"
            >
              {COL_RIGHT.map((item, i) => (
                <div
                  key={i}
                  className="group relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-sand shadow-sm border border-line"
                >
                  <Image src={item.image} alt={item.title} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" sizes="160px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-2 left-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] font-bold truncate">{item.title}</p>
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
