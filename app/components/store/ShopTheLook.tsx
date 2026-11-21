'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Check, ShoppingBag, Sparkles, Plus, X } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface HotspotProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice: number;
  image: string;
  xPercent: number; // Position on image (0-100)
  yPercent: number;
  sizes: string[];
}

interface LookItem {
  id: string;
  title: string;
  subtitle: string;
  tagline: string;
  modelImage: string;
  bundlePrice: number;
  bundleCompareAt: number;
  products: HotspotProduct[];
}

const LOOKS: LookItem[] = [
  {
    id: 'look-1',
    title: 'THE MONSOON STREETSET',
    subtitle: 'Urban Utility & Heavyweight Drape',
    tagline: 'Heavyweight Boxy Tee + Multi-Pocket Cargos + Chunky Low-Tops',
    modelImage: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=85',
    bundlePrice: 2198,
    bundleCompareAt: 3098,
    products: [
      {
        id: 'prod-look-1',
        name: 'Heavyweight Boxy Tee - Jet Black',
        category: '240 GSM Combed Cotton',
        price: 899,
        compareAtPrice: 1299,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
        xPercent: 50,
        yPercent: 32,
        sizes: ['S', 'M', 'L', 'XL'],
      },
      {
        id: 'prod-look-2',
        name: 'Multi-Pocket Cargo Joggers - Olive',
        category: '4-Way Stretch Twill',
        price: 1299,
        compareAtPrice: 1799,
        image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=400&q=80',
        xPercent: 48,
        yPercent: 68,
        sizes: ['30', '32', '34', '36'],
      },
    ],
  },
  {
    id: 'look-2',
    title: 'THE FRENCH RIVIERA EDIT',
    subtitle: 'Resort Relaxation & Sharp Taper',
    tagline: 'Pure Flax Linen Shirt + Tailored Pleated Trousers',
    modelImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=85',
    bundlePrice: 2898,
    bundleCompareAt: 4198,
    products: [
      {
        id: 'prod-look-3',
        name: 'Relaxed Cuban Linen Shirt - Sage',
        category: '100% Normandy Flax',
        price: 1399,
        compareAtPrice: 1999,
        image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80',
        xPercent: 48,
        yPercent: 34,
        sizes: ['M', 'L', 'XL'],
      },
      {
        id: 'prod-look-4',
        name: 'Tailored Pleated Trousers - Cream',
        category: 'Poly-Viscose Comfort Weave',
        price: 1499,
        compareAtPrice: 2199,
        image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=400&q=80',
        xPercent: 52,
        yPercent: 72,
        sizes: ['30', '32', '34', '36'],
      },
    ],
  },
  {
    id: 'look-3',
    title: 'THE MODERN FESTIVE SANGEET',
    subtitle: 'Contemporary Heritage & Subdued Luxury',
    tagline: 'Textured Slub Short Kurta + Straight Chinos',
    modelImage: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85',
    bundlePrice: 2398,
    bundleCompareAt: 3398,
    products: [
      {
        id: 'prod-look-5',
        name: 'Textured Slub Short Kurta - Mustard',
        category: 'Handcrafted Cotton Blend',
        price: 1199,
        compareAtPrice: 1599,
        image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=400&q=80',
        xPercent: 50,
        yPercent: 35,
        sizes: ['M', 'L', 'XL', 'XXL'],
      },
      {
        id: 'prod-look-6',
        name: 'Straight Fit Chinos - Off-White',
        category: 'Mid-Rise Stretch Twill',
        price: 1199,
        compareAtPrice: 1799,
        image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=400&q=80',
        xPercent: 50,
        yPercent: 75,
        sizes: ['30', '32', '34'],
      },
    ],
  },
];

export function ShopTheLook() {
  const [activeLook, setActiveLook] = useState<LookItem>(LOOKS[0]);
  const [activeHotspot, setActiveHotspot] = useState<HotspotProduct | null>(LOOKS[0].products[0]);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddProduct = (product: HotspotProduct) => {
    try {
      addItem(product.id, 1, [{ name: 'Size', value: product.sizes[0] }]);
      setAddedItems((prev) => ({ ...prev, [product.id]: true }));
      toast({
        title: 'Added to Bag',
        description: `${product.name} (Size ${product.sizes[0]}) added.`,
      });
      setTimeout(() => {
        setAddedItems((prev) => ({ ...prev, [product.id]: false }));
      }, 2500);
    } catch {
      toast({ title: 'Added', description: `${product.name} added to cart.` });
    }
  };

  const handleAddBundle = () => {
    activeLook.products.forEach((prod) => handleAddProduct(prod));
    toast({
      title: 'Complete Look Added',
      description: `All ${activeLook.products.length} garments from ${activeLook.title} added to bag!`,
    });
  };

  return (
    <section aria-labelledby="shop-the-look-title" className="py-4">
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Curated Runway Combos
          </span>
          <h2
            id="shop-the-look-title"
            className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white"
          >
            SHOP THE COMPLETE LOOK
          </h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Interactive outfit breakdowns. Tap the pulsing pins on the model to view garments or buy the full curated ensemble.
          </p>
        </div>

        {/* Look Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {LOOKS.map((look) => {
            const isActive = activeLook.id === look.id;
            return (
              <button
                key={look.id}
                type="button"
                onClick={() => {
                  setActiveLook(look);
                  setActiveHotspot(look.products[0]);
                }}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-neutral-950 text-amber-300 shadow-md dark:bg-white dark:text-neutral-950'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-400'
                )}
              >
                {look.title.replace('THE ', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch rounded-[28px] border border-neutral-200/80 bg-sand/30 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8 overflow-hidden shadow-xl">
        {/* Left Interactive Model with Pulsing Hotspots */}
        <div className="lg:col-span-7 relative aspect-[3/4] sm:aspect-[4/5] w-full rounded-2xl overflow-hidden border border-neutral-200/80 bg-neutral-900 shadow-lg dark:border-neutral-800">
          <Image
            src={activeLook.modelImage}
            alt={activeLook.title}
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover object-top transition-transform duration-700 hover:scale-103"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Interactive Hotspot Pins */}
          {activeLook.products.map((prod) => {
            const isSelected = activeHotspot?.id === prod.id;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => setActiveHotspot(prod)}
                style={{
                  top: `${prod.yPercent}%`,
                  left: `${prod.xPercent}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/pin focus:outline-none"
                aria-label={`Inspect ${prod.name}`}
              >
                <span className="relative flex h-8 w-8 items-center justify-center">
                  {/* Ping Animation Ring */}
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  {/* Core Icon Button */}
                  <span
                    className={cn(
                      'relative inline-flex h-7 w-7 rounded-full items-center justify-center border-2 border-white text-xs font-black shadow-xl transition-transform duration-200 group-hover/pin:scale-125',
                      isSelected
                        ? 'bg-amber-400 text-neutral-950 scale-110 ring-4 ring-amber-400/30'
                        : 'bg-neutral-950/90 text-white'
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </span>
              </button>
            );
          })}

          {/* Bottom Model Info Chip */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-neutral-950/80 p-3.5 backdrop-blur-md border border-white/10 text-white">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {activeLook.subtitle}
              </span>
              <h4 className="text-sm font-black tracking-tight">{activeLook.title}</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400">Bundle Price</span>
              <p className="text-sm font-black text-amber-300">
                ₹{activeLook.bundlePrice}{' '}
                <span className="text-[10px] text-neutral-400 line-through">
                  ₹{activeLook.bundleCompareAt}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Active Garment Breakdown & Quick Buy */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          {/* Active Hotspot Garment Card */}
          {activeHotspot ? (
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-md dark:border-neutral-800 dark:bg-neutral-900 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full">
                  Selected Garment
                </span>
                <span className="text-xs text-neutral-400">Tap pin to switch</span>
              </div>

              <div className="mt-4 flex gap-4">
                <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50">
                  <Image
                    src={activeHotspot.image}
                    alt={activeHotspot.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      {activeHotspot.category}
                    </p>
                    <h4 className="text-sm font-black text-neutral-900 dark:text-white leading-snug">
                      {activeHotspot.name}
                    </h4>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-base font-black text-neutral-900 dark:text-white">
                      ₹{activeHotspot.price}
                    </span>
                    <span className="text-xs text-neutral-400 line-through">
                      ₹{activeHotspot.compareAtPrice}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      SAVE {Math.round(((activeHotspot.compareAtPrice - activeHotspot.price) / activeHotspot.compareAtPrice) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Size Selector */}
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Available Sizes
                </p>
                <div className="flex items-center gap-1.5">
                  {activeHotspot.sizes.map((sz, i) => (
                    <span
                      key={sz}
                      className={cn(
                        'flex h-7 w-8 items-center justify-center rounded-md border text-xs font-bold',
                        i === 0
                          ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950'
                          : 'border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300'
                      )}
                    >
                      {sz}
                    </span>
                  ))}
                </div>
              </div>

              {/* Add Single Item Button */}
              <button
                type="button"
                onClick={() => handleAddProduct(activeHotspot)}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white py-2.5 text-xs font-black uppercase tracking-wider transition-all dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                {addedItems[activeHotspot.id] ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 text-amber-400" />
                    Add This Piece • ₹{activeHotspot.price}
                  </>
                )}
              </button>
            </div>
          ) : null}

          {/* List of other pieces in this look */}
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Complete Look Pieces ({activeLook.products.length})
            </p>
            <div className="grid grid-cols-1 gap-2">
              {activeLook.products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setActiveHotspot(p)}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer',
                    activeHotspot?.id === p.id
                      ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-neutral-200/60 bg-white/60 dark:bg-neutral-900/60 hover:bg-white'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0 border">
                      <Image src={p.image} alt={p.name} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-neutral-500">{p.category}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-neutral-900 dark:text-white">
                    ₹{p.price}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Bundle CTA Button */}
          <button
            type="button"
            onClick={handleAddBundle}
            className="w-full flex items-center justify-between rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 p-4 transition-all shadow-lg hover:shadow-amber-400/20 group"
          >
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-800">
                Buy All {activeLook.products.length} Garments
              </span>
              <p className="text-xs font-black">
                Add Complete Look to Bag
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black">₹{activeLook.bundlePrice}</span>
              <div className="h-7 w-7 rounded-full bg-neutral-950 text-white flex items-center justify-center transition-transform group-hover:scale-110">
                <ShoppingBag className="h-3.5 w-3.5 text-amber-300" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
