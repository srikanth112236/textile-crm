'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const FLIP_WORDS = ['Oversized', 'Linen', 'Kurta', 'Cargo'];

export function Demo1Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const backTypeRef = useRef<HTMLDivElement>(null);
  const middleModelRef = useRef<HTMLDivElement>(null);
  const frontCardLeftRef = useRef<HTMLDivElement>(null);
  const frontCardRightRef = useRef<HTMLDivElement>(null);

  const [wordIndex, setWordIndex] = useState(0);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Cycling flip words timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % FLIP_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Multi-layer depth parallax with GSAP ScrollTrigger
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // 1. Back Layer: Giant typography slowly drifts down and fades
      if (backTypeRef.current) {
        gsap.to(backTypeRef.current, {
          yPercent: 35,
          opacity: 0.15,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      // 2. Middle Layer: Model image scales slightly and moves at normal parallax speed
      if (middleModelRef.current) {
        gsap.to(middleModelRef.current, {
          yPercent: 12,
          scale: 1.05,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      // 3. Front Layer: Left card moves faster upwards
      if (frontCardLeftRef.current) {
        gsap.to(frontCardLeftRef.current, {
          y: -120,
          rotation: -2,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      // 4. Front Layer: Right card moves at counter speed
      if (frontCardRightRef.current) {
        gsap.to(frontCardRightRef.current, {
          y: -160,
          rotation: 3,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Reduced motion support
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleQuickAdd = (product: { id: string; name: string; price: number }) => {
    try {
      addItem(product.id, 1, [{ name: 'Size', value: 'L' }]);
      toast({
        title: 'Added to Bag',
        description: `${product.name} (Size L) added.`,
      });
    } catch {
      toast({ title: 'Added', description: `${product.name} added to cart.` });
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-[92vh] w-full overflow-hidden bg-paper pt-8 pb-16 border-b border-line/40 flex flex-col justify-between"
    >
      {/* LAYER 1 (BACK): GIANT TYPOGRAPHY "DRAPE." */}
      <div
        ref={backTypeRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 z-0 select-none text-center leading-none"
      >
        <span className="font-serif text-[18vw] sm:text-[22vw] font-black tracking-tighter text-ink/[0.07] uppercase block">
          DRAPE.
        </span>
      </div>

      {/* Magazine Issue Sub-Header Info */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand block mb-1">
            Editorial Lookbook • 2026 Edition
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-ink leading-[1.05]">
            The Architecture of{' '}
            <span className="inline-block relative min-w-[200px] sm:min-w-[280px] text-brand italic">
              <AnimatePresence mode="wait">
                <motion.span
                  key={FLIP_WORDS[wordIndex]}
                  initial={{ y: reduceMotion ? 0 : 24, opacity: reduceMotion ? 1 : 0, rotateX: reduceMotion ? 0 : 45 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  exit={{ y: reduceMotion ? 0 : -24, opacity: reduceMotion ? 1 : 0, rotateX: reduceMotion ? 0 : -45 }}
                  transition={{ duration: reduceMotion ? 0 : 0.45, ease: reduceMotion ? 'linear' : [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  {FLIP_WORDS[wordIndex]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </div>

        <div className="max-w-xs text-xs font-sans text-ink-muted leading-relaxed hidden sm:block border-l border-line pl-4">
          <p>
            Dense combed cottons, pre-shrunk bio-washed weaves, and calibrated shoulder drops designed for natural presence.
          </p>
        </div>
      </div>

      {/* LAYER 2 (MIDDLE): MODEL IMAGE PLATE WITH PARALLAX */}
      <div className="relative z-10 mx-auto my-6 w-full max-w-5xl px-4 sm:px-6">
        <div
          ref={middleModelRef}
          data-cursor="VIEW"
          className="relative aspect-[16/10] sm:aspect-[21/10] w-full overflow-hidden rounded-2xl border border-line/60 bg-sand/30 shadow-2xl"
        >
          <Image
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1800&q=85"
            alt="Mentoos Editorial Menswear Collection"
            fill
            sizes="100vw"
            priority
            className="object-cover object-top transition-transform duration-1000 ease-out hover:scale-103"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />

          {/* Model Image Caption */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-brand-soft">
                Plate 01 • Autumn/Winter Drape
              </span>
              <p className="font-serif text-lg sm:text-2xl font-black italic">
                French Flax Linen & Tailored Pleats
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-mono tracking-wider uppercase text-white hover:text-brand-strong transition-colors"
            >
              Explore Full Editorial →
            </Link>
          </div>
        </div>
      </div>

      {/* LAYER 3 (FRONT): FLOATING PRODUCT CARDS WITH FRAMER MOTION */}
      {/* Floating Card Left: 240 GSM Oversized Tee */}
      <div
        ref={frontCardLeftRef}
        className="hidden md:block absolute left-8 lg:left-16 bottom-16 z-20 w-64 rounded-xl border border-line bg-paper/95 p-3.5 shadow-2xl backdrop-blur-md"
        data-cursor="ADD"
      >
        <motion.div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-sand/40"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Image
            src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=80"
            alt="240 GSM Heavyweight Tee"
            fill
            className="object-cover"
          />
          <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300">
            240 GSM
          </span>
        </motion.div>
        <div className="mt-2.5 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-serif font-black text-ink">Boxy Heavyweight Tee</h3>
            <p className="font-serif text-xs italic text-brand font-bold">₹899</p>
          </div>
          <button
            onClick={() => handleQuickAdd({ id: 'prod-d1-1', name: 'Boxy Heavyweight Tee', price: 899 })}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper hover:bg-brand transition-colors"
            aria-label="Add Boxy Heavyweight Tee to bag"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Card Right: Resort Linen Shirt */}
      <div
        ref={frontCardRightRef}
        className="hidden md:block absolute right-8 lg:right-16 bottom-24 z-20 w-64 rounded-xl border border-line bg-paper/95 p-3.5 shadow-2xl backdrop-blur-md"
        data-cursor="ADD"
      >
        <motion.div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-sand/40"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Image
            src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80"
            alt="Relaxed Linen Shirt"
            fill
            className="object-cover"
          />
          <span className="absolute left-2 top-2 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-300">
            PURE FLAX
          </span>
        </motion.div>
        <div className="mt-2.5 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-serif font-black text-ink">Relaxed Cuban Linen</h3>
            <p className="font-serif text-xs italic text-brand font-bold">₹1,399</p>
          </div>
          <button
            onClick={() => handleQuickAdd({ id: 'prod-d1-b1', name: 'Relaxed Cuban Linen', price: 1399 })}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper hover:bg-brand transition-colors"
            aria-label="Add Relaxed Cuban Linen to bag"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Ticker Bar */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-4 flex items-center justify-between text-[11px] font-mono text-ink-muted border-t border-line/40">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AW26 ATELIER DROP LIVE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-ink cursor-pointer">SCROLL TO READ</span>
          <span>↓</span>
        </div>
      </div>
    </section>
  );
}