'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import type { IProduct } from '@/lib/api/types';

interface Demo1NewArrivalsProps {
  products?: IProduct[];
}

export function Demo1NewArrivals({ products = [] }: Demo1NewArrivalsProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [addedMap, setAddedMap] = useState<{ [key: string]: boolean }>({});

  const handleQuickAdd = (product: { id: string; name: string; price: number }) => {
    try {
      addItem(product.id, 1, [{ name: 'Size', value: 'L' }]);
      setAddedMap((prev) => ({ ...prev, [product.id]: true }));
      toast({
        title: 'Added to Bag',
        description: `${product.name} (Size L) added to bag.`,
      });
      setTimeout(() => {
        setAddedMap((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    } catch {
      toast({ title: 'Added', description: `${product.name} added to cart.` });
    }
  };

  return (
    <section id="sec-new-arrivals" className="w-full bg-paper py-14 sm:py-16 px-4 sm:px-6 border-b border-line/40">
      <div className="mx-auto max-w-7xl">
        {/* Editorial Section Header */}
        <div className="flex items-baseline justify-between border-b border-line/60 pb-3 mb-8">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs font-bold text-brand uppercase tracking-widest">
              CH. 03 / 13
            </span>
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
              NEW SEASON RELEASES
            </span>
          </div>
          <Link
            href="/products?sort=createdAt&order=desc"
            className="group font-mono text-xs text-ink hover:text-brand transition-colors flex items-center gap-1"
          >
            <span>FULL EDITORIAL</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* 12-Column Asymmetric Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Big Hero Plate (7 Cols) */}
          <div className="lg:col-span-7 group" data-cursor="VIEW">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand/30">
              <Image
                src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=1200&q=85"
                alt="Heavyweight Boxy Oversized Tee"
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              <span className="absolute top-4 left-4 font-mono text-[10px] font-bold tracking-widest bg-paper px-3 py-1 text-ink uppercase">
                Plate 01 • 240 GSM
              </span>

              {/* Quick Add Floating Button on Image */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleQuickAdd({ id: 'prod-d1-1', name: 'Heavyweight Boxy Oversized Tee', price: 899 });
                }}
                className="absolute bottom-6 right-6 flex items-center gap-2 bg-ink text-paper px-4 py-2 text-xs font-mono font-bold tracking-wider hover:bg-brand transition-colors shadow-xl"
                data-cursor="ADD"
              >
                {addedMap['prod-d1-1'] ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>ADDED</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5 text-brand" />
                    <span>QUICK ADD</span>
                  </>
                )}
              </button>
            </div>

            {/* Caption below with serif italic price */}
            <div className="mt-5 border-b border-line/40 pb-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-2xl font-black text-ink group-hover:underline underline-offset-8 transition-all">
                  Heavyweight Boxy Oversized Tee
                </h3>
                <span className="font-serif text-xl italic font-bold text-brand">₹899</span>
              </div>
              <p className="mt-1 font-sans text-xs text-ink-muted leading-relaxed max-w-lg">
                240 GSM dense combed cotton with an engineered dropped shoulder seam. Eliminates belly cling while draping straight down.
              </p>
              <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-ink-subtle">
                <span>FABRIC: 100% COMBED COTTON</span>
                <span>•</span>
                <span>SHRINKAGE: 0% BIO-WASH</span>
              </div>
            </div>
          </div>

          {/* 2 Stacked Asymmetric Cards on Right (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Multi-Pocket Cargo */}
            <div className="group" data-cursor="VIEW">
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-sand/30">
                <Image
                  src="https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80"
                  alt="Multi-Pocket Cargo Joggers"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-105"
                />
                <span className="absolute top-4 left-4 font-mono text-[10px] font-bold tracking-widest bg-paper px-3 py-1 text-ink uppercase">
                  Plate 02 • UTILITY
                </span>
                <button
                  onClick={() => handleQuickAdd({ id: 'prod-d1-2', name: 'Multi-Pocket Cargo Joggers', price: 1299 })}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-ink text-paper px-3 py-1.5 text-xs font-mono font-bold tracking-wider hover:bg-brand transition-colors shadow-lg"
                  data-cursor="ADD"
                >
                  <ShoppingBag className="h-3 w-3 text-brand" />
                  <span>ADD • ₹1,299</span>
                </button>
              </div>

              <div className="mt-4 border-b border-line/40 pb-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-serif text-lg font-black text-ink group-hover:underline underline-offset-4 transition-all">
                    Multi-Pocket Cargo Joggers
                  </h4>
                  <span className="font-serif text-base italic font-bold text-brand">₹1,299</span>
                </div>
                <p className="mt-0.5 font-sans text-xs text-ink-muted">
                  4-way stretch twill with ergonomic knee mobility and ribbed ankle cinches.
                </p>
              </div>
            </div>

            {/* Card 2: Distressed Wash Denim Jacket */}
            <div className="group" data-cursor="VIEW">
              <div className="relative aspect-[16/11] w-full overflow-hidden bg-sand/30">
                <Image
                  src="https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=900&q=80"
                  alt="Distressed Wash Denim Jacket"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-105"
                />
                <span className="absolute top-4 left-4 font-mono text-[10px] font-bold tracking-widest bg-paper px-3 py-1 text-ink uppercase">
                  Plate 03 • HEIRLOOM
                </span>
                <button
                  onClick={() => handleQuickAdd({ id: 'prod-d1-3', name: 'Distressed Wash Denim Jacket', price: 2199 })}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-ink text-paper px-3 py-1.5 text-xs font-mono font-bold tracking-wider hover:bg-brand transition-colors shadow-lg"
                  data-cursor="ADD"
                >
                  <ShoppingBag className="h-3 w-3 text-brand" />
                  <span>ADD • ₹2,199</span>
                </button>
              </div>

              <div className="mt-4 border-b border-line/40 pb-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-serif text-lg font-black text-ink group-hover:underline underline-offset-4 transition-all">
                    Distressed Wash Denim Jacket
                  </h4>
                  <span className="font-serif text-base italic font-bold text-brand">₹2,199</span>
                </div>
                <p className="mt-0.5 font-sans text-xs text-ink-muted">
                  Hand-abraded indigo wash with custom metallic hardware and relaxed chest drop.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
