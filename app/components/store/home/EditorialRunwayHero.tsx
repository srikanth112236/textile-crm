'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface RunwayModel {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  dropCode: string;
  headlineFirst: string;
  underlinedWord: string;
  headlineRest: string;
  storyTitle: string;
  storyDesc: string;
  modelImage: string;
  polaroidImage: string;
  sizes: string[];
}

const RUNWAY_MODELS: RunwayModel[] = [
  {
    id: 'runway-1',
    name: 'Heavyweight Boxy Tee',
    category: 'Streetwear',
    price: 899,
    originalPrice: 1299,
    dropCode: '#2252',
    headlineFirst: "Mentoos's Black Drop For",
    underlinedWord: 'Summers',
    headlineRest: 'Is Live Now!',
    storyTitle: 'Mentoos Black Capsule',
    storyDesc: '240 GSM combed cotton featuring dropped shoulder seams and relaxed boxy drape.',
    modelImage: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=85',
    polaroidImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=500&q=85',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'runway-2',
    name: 'Relaxed Linen Coordinate',
    category: 'The Linen Edit',
    price: 2499,
    originalPrice: 3499,
    dropCode: '#2253',
    headlineFirst: 'Pure French Flax In',
    underlinedWord: 'Earthy Tones',
    headlineRest: 'Breathe Easy.',
    storyTitle: 'The Resort & Linen Edit',
    storyDesc: 'Natural pre-washed linen with notched Cuban collar and pleated drawstring trousers.',
    modelImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=85',
    polaroidImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=85',
    sizes: ['38', '40', '42', '44'],
  },
  {
    id: 'runway-3',
    name: 'Tailored Charcoal Suit',
    category: 'Formal Classics',
    price: 3499,
    originalPrice: 4999,
    dropCode: '#2254',
    headlineFirst: 'Structured Precision For',
    underlinedWord: 'Evenings',
    headlineRest: 'Modern Formal.',
    storyTitle: 'Evening Sartorial Tailoring',
    storyDesc: 'Subtle stretch wool-blend tailored to Indian chest and shoulder proportions for a crisp profile.',
    modelImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=85',
    polaroidImage: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=500&q=85',
    sizes: ['38R', '40R', '42R', '44R'],
  },
  {
    id: 'runway-4',
    name: 'Textured Slub Kurta',
    category: 'Festive Luxury',
    price: 1299,
    originalPrice: 1799,
    dropCode: '#2255',
    headlineFirst: 'Artisanal Short Kurta In',
    underlinedWord: 'Ivory Slub',
    headlineRest: 'Crafted For You.',
    storyTitle: 'Handcrafted Indo-Western',
    storyDesc: 'Subtle woven slub texture with mandarin collar and mother-of-pearl buttons.',
    modelImage: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=85',
    polaroidImage: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=500&q=85',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'runway-5',
    name: 'Utility Cargo Bomber',
    category: 'Streetwear',
    price: 2199,
    originalPrice: 2999,
    dropCode: '#2256',
    headlineFirst: '6-Pocket Weatherproof',
    underlinedWord: 'Utility',
    headlineRest: 'Street Ready.',
    storyTitle: 'Urban Utility Outerwear',
    storyDesc: 'Heavy twill cotton shell with dual zip closures, articulated sleeves, and deep storm-flap pockets.',
    modelImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=85',
    polaroidImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=500&q=85',
    sizes: ['M', 'L', 'XL'],
  },
];

export function EditorialRunwayHero() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isStaff } = useAuth();
  const { toast } = useToast();

  const active = RUNWAY_MODELS[selectedIndex];

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % RUNWAY_MODELS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + RUNWAY_MODELS.length) % RUNWAY_MODELS.length);
  }, []);

  // Smooth Auto-Cycling Carousel (pauses on hover)
  useEffect(() => {
    if (isPaused || quickAddOpen) return;
    const interval = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, quickAddOpen, handleNext]);

  // Center active model inside the scroll container automatically
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedIndex]);

  const handleSelectModel = (index: number) => {
    setSelectedIndex(index);
    setSelectedSize(RUNWAY_MODELS[index].sizes[0] || 'M');
    setQuickAddOpen(true);
  };

  const handleAddToCart = () => {
    if (isStaff) {
      toast({
        title: 'Customer account required',
        description: 'Staff accounts cannot place orders.',
      });
      return;
    }
    setAdded(true);
    toast({
      title: 'Added to bag',
      description: `${active.name} (${selectedSize}) is ready in your cart.`,
    });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-[28px] border border-line bg-[#fcfbf8] px-4 py-4 sm:px-8 sm:py-5 shadow-xs"
    >
      <div className="mx-auto max-w-[1240px]">
        {/* Top Header Row (Compact Headline + Drop Tag + Mini Moodboard + Controls) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line/60">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-ink-muted uppercase tracking-widest">
              <span>PREMIUM NEW DROP</span>
              <span className="text-ink font-black">{active.dropCode}</span>
              <span className="text-amber-500">✦</span>
              <span className="text-[#64aa34]">RUNWAY LIVE</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.h1
                key={active.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="font-serif text-2xl sm:text-3xl lg:text-[34px] leading-tight text-ink font-bold tracking-tight"
              >
                {active.headlineFirst}{' '}
                <span className="underline decoration-ink/40 decoration-2 underline-offset-4 italic">
                  {active.underlinedWord}
                </span>{' '}
                <span className="font-sans font-extrabold not-italic text-ink text-xl sm:text-2xl">
                  {active.headlineRest}
                </span>
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* Right Controls Bar & Mini Moodboard */}
          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            {/* 3 Micro Polaroid Collage */}
            <div className="hidden md:flex items-center gap-1.5 pr-2">
              <div className="relative h-12 w-10 overflow-hidden rounded-md border-2 border-white shadow-xs -rotate-6 bg-[#ebe7df]">
                <Image src={active.polaroidImage} alt="" fill className="object-cover object-top" />
              </div>
              <div className="relative h-14 w-11 overflow-hidden rounded-md border-2 border-white shadow-sm z-10 bg-[#ebe7df]">
                <Image src={active.modelImage} alt="" fill className="object-cover object-top" />
              </div>
            </div>

            <Link
              href="/products?sort=createdAt&order=desc"
              className="rounded-lg border border-line bg-white px-3 py-1 text-[11px] font-bold text-ink hover:bg-sand transition-colors shadow-2xs"
            >
              View All
            </Link>

            <span className="h-1.5 w-1.5 rounded-full bg-ink" />

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous model"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white text-ink hover:bg-ink hover:text-white transition-all shadow-2xs active:scale-95"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next model"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white text-ink hover:bg-ink hover:text-white transition-all shadow-2xs active:scale-95"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Compact Runway: Left Story + Right Parallel Auto-Scrolled Models */}
        <div className="grid gap-4 lg:grid-cols-12 lg:items-center pt-3">
          {/* Left Mini Story Card */}
          <div className="lg:col-span-3 pr-2 lg:border-r lg:border-line/60">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.25 }}
                className="flex lg:flex-col items-center lg:items-start gap-3"
              >
                <div className="relative h-20 w-24 lg:h-28 lg:w-full shrink-0 overflow-hidden rounded-xl border-2 border-white bg-sand shadow-xs">
                  <Image
                    src={active.polaroidImage}
                    alt={active.storyTitle}
                    fill
                    sizes="200px"
                    className="object-cover object-top"
                  />
                </div>

                <div className="min-w-0">
                  <h4 className="font-serif italic text-sm sm:text-base font-bold text-ink truncate">
                    {active.storyTitle}
                  </h4>
                  <p className="mt-0.5 text-[11px] leading-snug text-ink-muted line-clamp-2">
                    {active.storyDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuickAddOpen((v) => !v)}
                    className="mt-1 text-[10px] font-extrabold uppercase text-[#64aa34] hover:underline"
                  >
                    {quickAddOpen ? 'Hide Quick Buy' : 'Quick Buy This Look →'}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Runway Model Lineup (Compact, perfectly framed, heads never cut off) */}
          <div
            ref={scrollRef}
            className="lg:col-span-9 flex items-end gap-3 sm:gap-4 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth"
          >
            {RUNWAY_MODELS.map((model, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <motion.div
                  key={model.id}
                  onClick={() => handleSelectModel(idx)}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="group relative flex w-[125px] sm:w-[145px] shrink-0 cursor-pointer flex-col items-center select-none"
                >
                  {/* Model Frame with Proportional Height */}
                  <div className="relative h-[200px] sm:h-[225px] w-full flex items-end justify-center">
                    {/* Elliptical Ground Shadow */}
                    <div
                      className={`absolute bottom-0 h-2.5 w-4/5 rounded-full bg-black/25 blur-xs transition-all duration-300 ${
                        isSelected ? 'scale-115 opacity-80' : 'opacity-30 group-hover:opacity-60'
                      }`}
                    />

                    {/* Spotlight Glow on Active Selection */}
                    {isSelected && (
                      <motion.div
                        layoutId="compactRunwayGlow"
                        className="pointer-events-none absolute -inset-1 rounded-2xl bg-amber-400/25 blur-md"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}

                    {/* Image Container */}
                    <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#ebe7df]/60 shadow-xs border border-line/40">
                      <Image
                        src={model.modelImage}
                        alt={model.name}
                        fill
                        sizes="150px"
                        className={`object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isSelected ? 'scale-105' : 'group-hover:scale-105'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Name and Price */}
                  <div className="mt-2 w-full text-center space-y-0.5">
                    <p
                      className={`text-[11px] font-bold transition-colors truncate px-1 ${
                        isSelected ? 'text-ink font-black' : 'text-ink/80 group-hover:text-ink'
                      }`}
                    >
                      {model.name}
                    </p>

                    <div className="flex items-center justify-center gap-1.5 text-[11px]">
                      {isSelected ? (
                        <span className="flex h-3 w-3 items-center justify-center rounded-full bg-ink text-[#c6f03d] text-[8px] font-black">
                          ●
                        </span>
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-line group-hover:bg-ink transition-colors" />
                      )}
                      <span className="font-extrabold text-ink">₹{model.price}</span>
                      <span className="text-[9px] text-ink-muted line-through">₹{model.originalPrice}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Compact Quick-Buy Bar */}
        <AnimatePresence>
          {quickAddOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 pt-3 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-2 overflow-hidden"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64aa34]">
                  Ready to Bag:
                </span>
                <span className="text-xs font-black text-ink">{active.name}</span>
                <span className="text-xs font-extrabold text-ink">₹{active.price}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-ink-muted uppercase mr-0.5">Size:</span>
                  {active.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`rounded px-2 py-0.5 text-[10px] font-bold transition-all ${
                        selectedSize === s
                          ? 'bg-ink text-white scale-105'
                          : 'border border-line bg-sand/60 text-ink hover:bg-sand'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition-all shadow-xs active:scale-95 ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#c6f03d] text-slate-950 hover:bg-[#b8e232]'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="h-3 w-3" /> Added
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-3 w-3" /> Add To Bag
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setQuickAddOpen(false)}
                  className="rounded-full p-1 text-ink-muted hover:text-ink hover:bg-sand"
                  aria-label="Close"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
