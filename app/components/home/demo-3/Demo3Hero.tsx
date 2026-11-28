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

const FLIP_WORDS = ['Innovation', 'Pioneer', 'Avant-Garde', 'Visionary'];

export function Demo3Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const middleModelRef = useRef<HTMLDivElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const { addItem } = useCart();
  const { toast } = useToast();
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (reduceMotion) return;
      const { clientX, clientY } = e;
      const maxMove = 20;
      setParallaxY((clientY / window.innerHeight - 0.5) * maxMove);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reduceMotion]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % FLIP_WORDS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      if (containerRef.current) {
        gsap.from('.hero3-title', {
          y: 60, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: containerRef.current, start: 'top 85%', end: 'bottom 15%', scrub: 1 },
        });
        gsap.from('.hero3-subtitle', {
          y: 40, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.3,
          scrollTrigger: { trigger: containerRef.current, start: 'top 90%', end: 'bottom 10%', scrub: 0.5 },
        });
        const handleMouseLeave = () => gsap.to('.hero3-model', { y: 0, duration: 1, ease: 'power2.out' });
        const handleMouseMove2 = (e: MouseEvent) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
          const centerX = rect.width / 2, centerY = rect.height / 2;
          const dist = Math.max(0, Math.min(1, Math.sqrt(Math.pow(cx - centerX, 2) + Math.pow(cy - centerY, 2)) / Math.max(rect.width, rect.height) / 2)) * 15;
          const angle = Math.atan2(cy - centerY, cx - centerX);
          gsap.to('.hero3-model', { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, rotate: dist * 0.3, duration: 0.5, ease: 'power2.out' });
        };
        const sectionEl = containerRef.current;
        if (!sectionEl) return;
        sectionEl.addEventListener('mousemove', handleMouseMove2);
        sectionEl.addEventListener('mouseleave', handleMouseLeave);
        return () => {
          sectionEl.removeEventListener('mousemove', handleMouseMove2);
          sectionEl.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    }, containerRef);
    return () => ctx.revert();
  }, [reduceMotion]);

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
      <div className="absolute inset-0 overflow-hidden">
        <motion.div className="hero3-bg absolute inset-0 bg-gradient-to-br from-brand/5 to-paper/50" animate={{ y: [20, -20] }} transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <motion.div className="w-8 h-8 rounded-full bg-brand/20" style={{ animationDuration: '6s', animation: 'pulse 6s ease-in-out infinite' }} />
        </div>
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 z-0 select-none text-center leading-none">
        <span className="font-serif text-[22vw] sm:text-[28vw] lg:text-[36vw] font-black tracking-tighter text-brand/[0.08] uppercase block">
          {FLIP_WORDS[wordIndex]}.
        </span>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand block mb-1">Innovation Collection • 2026</span>
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-ink leading-[1.05]">
            The Architecture of{' '}
            <span className="inline-block relative min-w-[200px] sm:min-w-[280px] text-brand italic">
              <AnimatePresence mode="wait">
                <motion.span key={FLIP_WORDS[wordIndex]} initial={{ y: 24, opacity: 0, rotateX: 45 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} exit={{ y: -24, opacity: 0, rotateX: -45 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="inline-block">
                  {FLIP_WORDS[wordIndex]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </div>
        <div className="max-w-xs text-xs font-sans text-ink-muted leading-relaxed hidden sm:block border-l border-line pl-4">
          <p>Cutting-edge designs, revolutionary fabrics, and forward-thinking style.</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto my-6 w-full max-w-5xl px-4 sm:px-6">
        <motion.div ref={middleModelRef} data-cursor="VIEW" className="relative aspect-[16/10] sm:aspect-[21/10] w-full overflow-hidden rounded-2xl border border-line/60 bg-sand/30 shadow-2xl" whileHover={{ y: -30, transition: { duration: 0.5 } }} whileTap={{ scale: 0.95 }}>
          <Image src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1800&q=85" alt="Mentoos Editorial Menswear Collection" fill sizes="100vw" priority className="object-cover object-top transition-transform duration-1000 ease-out hover:scale-103" style={{ y: parallaxY }} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-brand-soft">Vision 01 • Spring/Summer Innovations</span>
              <p className="font-serif text-lg sm:text-2xl font-black italic">Tech-Infused Fabrics & Smart Textiles</p>
            </div>
            <Link href="/products" className="hidden sm:inline-flex items-center gap-1 text-xs font-mono tracking-wider uppercase text-white hover:text-brand-strong transition-colors">Explore Collection →</Link>
          </div>
        </motion.div>
      </div>

      <div className="hidden md:block absolute left-8 lg:left-16 bottom-16 z-20 w-64 rounded-xl border border-line bg-paper/95 p-3.5 shadow-2xl backdrop-blur-md">
        <motion.div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-sand/40" whileHover={{ y: -15, transition: { duration: 0.3 } }} whileTap={{ scale: 0.95, rotate: -2 }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
          <Image src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=80" alt="240 GSM Heavyweight Tee" fill className="object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300">240 GSM</span>
        </motion.div>
        <div className="mt-2.5 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-serif font-black text-ink">Boxy Heavyweight Tee</h3>
            <p className="font-serif text-xs italic text-brand font-bold">₹899</p>
          </div>
          <button onClick={() => handleQuickAdd({ id: 'prod-d3-1', name: 'Boxy Heavyweight Tee', price: 899 })} className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper hover:bg-brand transition-colors" aria-label="Add Boxy Heavyweight Tee to bag">
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="hidden md:block absolute right-8 lg:right-16 bottom-24 z-20 w-64 rounded-xl border border-line bg-paper/95 p-3.5 shadow-2xl backdrop-blur-md">
        <motion.div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-sand/40" whileHover={{ y: -15, transition: { duration: 0.3 } }} whileTap={{ scale: 0.95, rotate: 2 }} transition={{ type: "spring", stiffness: 120, damping: 20 }}>
          <Image src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80" alt="Relaxed Linen Shirt" fill className="object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-300">PURE FLAX</span>
        </motion.div>
        <div className="mt-2.5 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-serif font-black text-ink">Relaxed Cuban Linen</h3>
            <p className="font-serif text-xs italic text-brand font-bold">₹1,399</p>
          </div>
          <button onClick={() => handleQuickAdd({ id: 'prod-d3-b1', name: 'Relaxed Cuban Linen', price: 1399 })} className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper hover:bg-brand transition-colors" aria-label="Add Relaxed Cuban Linen to bag">
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-4 flex items-center justify-between text-[11px] font-mono text-ink-muted border-t border-line/40">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span>AW26 ATELIER DROP LIVE</span></div>
        <div className="flex items-center gap-4"><span className="hover:text-ink cursor-pointer">SCROLL TO READ</span><span>↓</span></div>
      </div>
    </section>
  );
}