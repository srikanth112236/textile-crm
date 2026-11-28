'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShoppingBag, Heart, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const FLIP_WORDS = ['Noir', 'Midnight', 'Eclipse', 'Vertex'];

export function Demo5Hero() {
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
    }, 3100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      if (containerRef.current) {
        gsap.from('.hero5-title', {
          y: 60, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: containerRef.current, start: 'top 90%', end: 'bottom 10%', scrub: 1 },
        });
        gsap.from('.hero5-subtitle', {
          y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.3,
          scrollTrigger: { trigger: containerRef.current, start: 'top 95%', end: 'bottom 5%', scrub: 0.5 },
        });
        gsap.from('.hero5-feature', {
          y: 40, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.15,
          scrollTrigger: { trigger: containerRef.current, start: 'top 80%', end: 'bottom 20%', scrub: 0.3 },
        });
        const handleScroll = () => {
          const el = containerRef.current;
          if (!el) return;
          const scrollTop = el.scrollTop || window.scrollY;
          const maxScroll = el.scrollHeight - window.innerHeight;
          const progress = Math.max(0, Math.min(1, scrollTop / maxScroll));
          gsap.to('.hero5-bg-layer', {
            y: progress * 50, opacity: 1 - progress * 0.5,
            duration: 0.5, ease: 'power1.out',
          });
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
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
    <section ref={containerRef} className="relative min-h-[92vh] w-full overflow-hidden bg-paper dark:bg-slate-900 pt-8 pb-16 border-b border-line/40 flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <motion.div className="hero5-bg-layer absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,66,0.15),transparent),radial-gradient(circle_at_70%_80%,rgba(34,197,94,0.1),transparent)]" animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} />
        <div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/20" style={{ animationDuration: '8s', animation: 'pulse 8s ease-in-out infinite' }} />
        </div>
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 z-0 select-none text-center leading-none">
        <span className="font-serif text-[24vw] sm:text-[30vw] lg:text-[36vw] font-black tracking-tighter text-amber-400 uppercase block">
          {FLIP_WORDS[wordIndex]}.
        </span>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-300 block mb-1">Noir Collection • 2026</span>
          <h1 className="hero5-title font-serif text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-amber-100 leading-[1.05]">
            The Architecture of{' '}
            <span className="inline-block relative min-w-[200px] sm:min-w-[280px] text-amber-100 italic">
              <AnimatePresence mode="wait">
                <motion.span
                  key={FLIP_WORDS[wordIndex]}
                  initial={{ y: 24, opacity: 0, rotateX: 45 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  exit={{ y: -24, opacity: 0, rotateX: -45 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  {FLIP_WORDS[wordIndex]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </div>
        <div className="max-w-xs text-xs font-sans text-slate-400 leading-relaxed hidden sm:block border-l border-amber-500 pl-4">
          <p className="hero5-subtitle">Dark sophistication for the modern connoisseur.</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto my-6 w-full max-w-5xl px-4 sm:px-6">
        <motion.div className="relative aspect-[16/10] sm:aspect-[21/10] w-full overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-950 shadow-2xl" whileHover={{ y: -20, transition: { duration: 0.5 } }} whileTap={{ scale: 0.95 }}>
          <Image src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1800&q=85" alt="Mentoos Editorial Menswear Collection" fill sizes="100vw" priority className="object-cover object-top transition-transform duration-1000 ease-out hover:scale-103" />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-amber-100">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">Eclipse 01 • Autumn/Winter Noir</span>
              <p className="font-serif text-lg sm:text-2xl font-black italic">Shadow & Substance</p>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center gap-1 text-xs font-mono tracking-wider uppercase text-amber-200 hover:text-amber-100 transition-colors">Enter the Dark →</Link>
          </div>
        </motion.div>
      </div>

      <div className="hidden md:block absolute left-8 lg:left-16 bottom-16 z-20 w-64 rounded-xl border border-amber-500/20 bg-slate-950 p-3.5 shadow-xl backdrop-blur-md">
        <motion.div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900" whileHover={{ y: -10, transition: { duration: 0.3 } }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 130 }}>
          <Image src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=80" alt="240 GSM Heavyweight Tee" fill className="object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-amber-600 px-2 py-0.5 text-[9px] font-mono font-bold text-slate-950">240 GSM</span>
        </motion.div>
        <div className="mt-2.5 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-serif font-black text-amber-100">Boxy Heavyweight Tee</h3>
            <p className="font-serif text-xs italic text-amber-100 font-bold">₹899</p>
          </div>
          <button onClick={() => handleQuickAdd({ id: 'prod-d5-1', name: 'Boxy Heavyweight Tee', price: 899 })} className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-slate-950 hover:bg-slate-900 transition-colors" aria-label="Add Boxy Heavyweight Tee to bag">
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="hidden md:block absolute right-8 lg:right-16 bottom-24 z-20 w-64 rounded-xl border border-amber-500/20 bg-slate-950 p-3.5 shadow-xl backdrop-blur-md">
        <motion.div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-900" whileHover={{ y: -10, transition: { duration: 0.3 } }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 130 }}>
          <Image src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80" alt="Relaxed Linen Shirt" fill className="object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-amber-600/80 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300">PURE FLAX</span>
        </motion.div>
        <div className="mt-2.5 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-serif font-black text-amber-100">Relaxed Cuban Linen</h3>
            <p className="font-serif text-xs italic text-amber-100 font-bold">₹1,399</p>
          </div>
          <button onClick={() => handleQuickAdd({ id: 'prod-d5-b1', name: 'Relaxed Cuban Linen', price: 1399 })} className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-slate-950 hover:bg-slate-900 transition-colors" aria-label="Add Relaxed Cuban Linen to bag">
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div className="hero5-feature rounded-2xl bg-slate-900 p-6 border border-slate-700/30 hover:border-amber-500/30 transition-all duration-500" whileHover={{ y: -5, borderColor: 'amber-500/50' }} transition={{ type: "spring", stiffness: 100 }}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><Heart className="h-5 w-5 text-amber-400" /></div>
              <div className="flex-1"><h3 className="font-medium text-amber-300 mb-1">Luxurious Texture</h3><p className="text-sm text-slate-400 leading-relaxed">Velvet touch and premium hand feel.</p></div>
            </div>
          </motion.div>
          <motion.div className="hero5-feature rounded-2xl bg-slate-900 p-6 border border-slate-700/30 hover:border-amber-500/30 transition-all duration-500" whileHover={{ y: -5, borderColor: 'amber-500/50' }} transition={{ type: "spring", stiffness: 100, delay: 0.1 }}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><Sparkles className="h-5 w-5 text-amber-400" /></div>
              <div className="flex-1"><h3 className="font-medium text-amber-300 mb-1">Limited Edition</h3><p className="text-sm text-slate-400 leading-relaxed">Only 50 pieces produced worldwide.</p></div>
            </div>
          </motion.div>
          <motion.div className="hero5-feature rounded-2xl bg-slate-900 p-6 border border-slate-700/30 hover:border-amber-500/30 transition-all duration-500" whileHover={{ y: -5, borderColor: 'amber-500/50' }} transition={{ type: "spring", stiffness: 100, delay: 0.2 }}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><Heart className="h-5 w-5 text-amber-400" /></div>
              <div className="flex-1"><h3 className="font-medium text-amber-300 mb-1">Midnight Blue</h3><p className="text-sm text-slate-400 leading-relaxed">Deep indigo dye, artisan crafted.</p></div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-4 flex items-center justify-between text-[11px] font-mono text-amber-300 border-t border-amber-500/20">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /><span>AW26 ATELIER DROP LIVE</span></div>
        <div className="flex items-center gap-4"><span className="hover:text-amber-100 cursor-pointer">SCROLL TO READ</span><span>↓</span></div>
      </div>
    </section>
  );
}