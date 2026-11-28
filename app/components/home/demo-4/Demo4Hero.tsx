'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const FLIP_WORDS = ['Minimal', 'Essential', 'Pure', 'Simple'];

export function Demo4Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const { addItem } = useCart();
  const { toast } = useToast();
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % FLIP_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      if (containerRef.current) {
        gsap.from('.hero4-title', {
          opacity: 0, duration: 1, ease: 'power2.out',
          scrollTrigger: { trigger: containerRef.current, start: 'top 80%', end: 'bottom 20%', scrub: 0.3 },
        });
        gsap.from('.hero4-cta .btn', {
          y: 20, opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.2, stagger: 0.1,
          scrollTrigger: { trigger: containerRef.current, start: 'top 75%', end: 'bottom 25%', scrub: 0.3 },
        });
        gsap.from('.hero4-feature', {
          opacity: 0, x: -30, duration: 0.5, ease: 'power2.out', stagger: 0.1,
          scrollTrigger: { trigger: containerRef.current, start: 'top 85%', end: 'bottom 15%', scrub: 0.3 },
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleQuickAdd = (product: { id: string; name: string; price: number }) => {
    try {
      addItem(product.id, 1, [{ name: 'Size', value: 'L' }]);
      toast({ title: 'Added to Bag', description: `${product.name} (Size L) added.` });
    } catch {
      toast({ title: 'Added', description: `${product.name} added to cart.` });
    }
  };

  return (
    <section ref={containerRef} className="relative min-h-[92vh] w-full overflow-hidden bg-paper pt-8 pb-16 border-b border-line/40 flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-b from-paper via-slate-50 to-slate-100" />

      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 z-0 select-none text-center leading-none">
        <span className="font-serif text-[20vw] sm:text-[24vw] lg:text-[30vw] font-black tracking-tighter text-slate-950 uppercase block">
          {FLIP_WORDS[wordIndex]}.
        </span>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-600 block mb-1">Essential Lookbook • 2026</span>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.05]">
            The Architecture of{' '}
            <span className="inline-block relative min-w-[200px] sm:min-w-[280px] text-slate-950 italic">
              <AnimatePresence mode="wait">
                <motion.span
                  key={FLIP_WORDS[wordIndex]}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  {FLIP_WORDS[wordIndex]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </div>
        <div className="max-w-xs text-xs font-sans text-slate-500 leading-relaxed hidden sm:block border-l border-slate-200 pl-4">
          <p>Timeless pieces for the modern wardrobe.</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto my-6 w-full max-w-5xl px-4 sm:px-6">
        <motion.div className="relative aspect-[16/10] sm:aspect-[21/10] w-full overflow-hidden rounded-2xl border border-line/60 bg-slate-50 shadow-sm" whileHover={{ opacity: 0.9 }} whileTap={{ opacity: 0.8 }} transition={{ duration: 0.3 }}>
          <Image src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1800&q=85" alt="Mentoos Editorial Menswear Collection" fill sizes="100vw" priority className="object-cover object-top transition-opacity duration-500 ease-out hover:opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-slate-950">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Essential 01 • Spring/Summer</span>
              <p className="font-serif text-lg sm:text-2xl font-black italic">Pure Linen & Natural Textures</p>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center gap-1 text-xs font-mono tracking-wider uppercase text-slate-500 hover:text-slate-900 transition-colors">View Collection →</Link>
          </div>
        </motion.div>
      </div>

      <div className="hidden md:block absolute left-8 lg:left-16 bottom-16 z-20 w-64 rounded-xl border border-line bg-paper/95 p-3.5 shadow-2xl backdrop-blur-md">
        <motion.div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100" whileHover={{ y: -5, transition: { duration: 0.2 } }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 80 }}>
          <Image src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=80" alt="240 GSM Heavyweight Tee" fill className="object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-mono font-bold text-slate-300">240 GSM</span>
        </motion.div>
        <div className="mt-2.5 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-serif font-black text-slate-950">Boxy Heavyweight Tee</h3>
            <p className="font-serif text-xs italic text-brand font-bold">₹899</p>
          </div>
          <button onClick={() => handleQuickAdd({ id: 'prod-d4-1', name: 'Boxy Heavyweight Tee', price: 899 })} className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-paper hover:bg-brand transition-colors" aria-label="Add Boxy Heavyweight Tee to bag">
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="hidden md:block absolute right-8 lg:right-16 bottom-24 z-20 w-64 rounded-xl border border-line bg-paper/95 p-3.5 shadow-2xl backdrop-blur-md">
        <motion.div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100" whileHover={{ y: -5, transition: { duration: 0.2 } }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 80 }}>
          <Image src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80" alt="Relaxed Linen Shirt" fill className="object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-300">PURE FLAX</span>
        </motion.div>
        <div className="mt-2.5 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-serif font-black text-slate-950">Relaxed Cuban Linen</h3>
            <p className="font-serif text-xs italic text-brand font-bold">₹1,399</p>
          </div>
          <button onClick={() => handleQuickAdd({ id: 'prod-d4-b1', name: 'Relaxed Cuban Linen', price: 1399 })} className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-paper hover:bg-brand transition-colors" aria-label="Add Relaxed Cuban Linen to bag">
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-4 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-line/40">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AW26 ATELIER DROP LIVE</span>
        </div>
        <div className="flex items-center gap-4"><span className="hover:text-slate-900 cursor-pointer">SCROLL TO READ</span><span>↓</span></div>
      </div>
    </section>
  );
}