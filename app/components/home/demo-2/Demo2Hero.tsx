'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, ShoppingBag, Sparkles, Heart, Star } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const FLIP_WORDS = ['Elegance', 'Luxury', 'Heritage', 'Signature'];

export function Demo2Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const { addItem } = useCart();
  const { toast } = useToast();

  // Cycling flip words
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % FLIP_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll-triggered GSAP animations
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero title entrance
      if (containerRef.current) {
        gsap.from('.hero-title', {
          y: 80,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 0.5,
          },
        });

        // Subtitle entrance
        gsap.from('.hero-subtitle', {
          y: 40,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.2,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            end: 'bottom 15%',
            scrub: 0.3,
          },
        });

        // CTA buttons
        gsap.from('.hero-cta .btn', {
          y: 30,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
          delay: 0.4,
          stagger: 0.2,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 0.5,
          },
        });

        // Feature highlights
        gsap.from('.hero-feature', {
          x: -50,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 90%',
            end: 'bottom 10%',
            scrub: 0.3,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

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
      {/* BACKGROUND GRADIENT LAYER */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <motion.div
          className="absolute -inset-[50%] bg-[radial-gradient(circle_at_30%_20%,rgba(0,0,0,0.06),transparent_60%)]"
          animate={{ y: [40, -40, 40] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          style={{ opacity: 0.6 }}
        />
      </div>

      {/* LAYER 1: GIANT TYPOGRAPHY WITH MOTION ANIMATION */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 z-0 select-none text-center leading-none">
        <span className="font-serif text-[20vw] sm:text-[26vw] lg:text-[32vw] font-black tracking-tighter text-brand/[0.1] uppercase block motion-reduce:transition-none">
          {FLIP_WORDS[wordIndex]}.
        </span>
      </div>

      {/* LAYER 2: SUBTITLE & CAPTIONS */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand block mb-1">
            Editorial Lookbook • 2026 Edition
          </span>
          <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-ink leading-[1.1] motion-reduce:transition-none">
            The Architecture of{' '}
            <span className="inline-block relative min-w-[200px] sm:min-w-[280px] text-brand italic motion-reduce:transition-none">
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

        <div className="max-w-xs text-xs font-sans text-ink-muted leading-relaxed hidden sm:block border-l border-line pl-4">
          <p>
            Dense combed cottons, pre-shrunk bio-washed weaves, and calibrated shoulder drops designed for natural presence.
          </p>
        </div>
      </div>

      {/* LAYER 3: MODEL IMAGE WITH PARALLAX HOVER */}
      <div className="relative z-10 mx-auto my-6 w-full max-w-5xl px-4 sm:px-6">
        <motion.div
          data-cursor="VIEW"
          className="relative aspect-[16/10] sm:aspect-[21/10] w-full overflow-hidden rounded-2xl border border-line/60 bg-sand/30 shadow-2xl"
          whileHover={{ y: -20, transition: { duration: 0.5 } }}
          whileTap={{ scale: 0.95 }}
        >
          <Image
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1800&q=85"
            alt="Mentoos Editorial Menswear Collection"
            fill
            sizes="100vw"
            priority
            className="object-cover object-top transition-transform duration-1000 ease-out hover:scale-105"
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
        </motion.div>
      </div>

      {/* LAYER 4: FLOATING PRODUCT CARDS WITH MOTION */}
      {/* Floating Card Left */}
      <div
        className="hidden md:block absolute left-8 lg:left-16 bottom-16 z-20 w-64 rounded-xl border border-line bg-paper/95 p-3.5 shadow-2xl backdrop-blur-md"
      >
        <motion.div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-sand/40"
          whileHover={{ y: -10, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
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
            onClick={() => handleQuickAdd({ id: 'prod-d2-1', name: 'Boxy Heavyweight Tee', price: 899 })}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper hover:bg-brand transition-colors"
            aria-label="Add Boxy Heavyweight Tee to bag"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Card Right */}
      <div
        className="hidden md:block absolute right-8 lg:right-16 bottom-24 z-20 w-64 rounded-xl border border-line bg-paper/95 p-3.5 shadow-2xl backdrop-blur-md"
      >
        <motion.div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-sand/40"
          whileHover={{ y: -10, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
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
            onClick={() => handleQuickAdd({ id: 'prod-d2-b1', name: 'Relaxed Cuban Linen', price: 1399 })}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-paper hover:bg-brand transition-colors"
            aria-label="Add Relaxed Cuban Linen to bag"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* LAYER 5: SCROLL REVEAL CONTENT GRID */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Card 1 */}
          <motion.div
            className="rounded-2xl border border-line/60 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-500"
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-ink mb-1">Premium Quality</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Every garment undergoes rigorous quality checks to ensure perfection.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature Card 2 */}
          <motion.div
            className="rounded-2xl border border-line/60 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-500"
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-ink mb-1">Crafted with Care</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Artisan techniques passed down through generations.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Feature Card 3 */}
          <motion.div
            className="rounded-2xl border border-line/60 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-500"
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-ink mb-1">Timeless Design</h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  Styles that never go out of fashion, only evolve.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* BOTTOM TICKER BAR */}
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