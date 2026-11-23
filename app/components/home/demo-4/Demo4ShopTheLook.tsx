'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { bebasNeue, dmSans } from './fonts';

interface Hotspot {
  id: string;
  x: number;
  y: number;
  title: string;
  category: string;
  spec: string;
  price: number;
  image: string;
}

const HOTSPOTS: Hotspot[] = [
  {
    id: 'hs-1',
    x: 48,
    y: 35,
    title: 'Camp-Collar Belgian Linen Shirt',
    category: 'shirts',
    spec: '100% Pure Flax · 165 GSM · Natural Oat',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'hs-2',
    x: 52,
    y: 72,
    title: 'Double-Pleated Gurkha Trouser',
    category: 'pants',
    spec: 'Weighted Cotton Twill · Deep Rise · Bone Sand',
    price: 2899,
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
  },
];

export function Demo4ShopTheLook() {
  const { addItem } = useCart();
  const [activeSpot, setActiveSpot] = useState<Hotspot>(HOTSPOTS[0]);
  const [added, setAdded] = useState(false);

  const handleQuickAdd = () => {
    addItem(activeSpot.id, 1, [{ name: 'Size', value: 'L' }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
              RUNWAY COMBINATION
            </span>
            <h2 className="font-bebas text-5xl sm:text-7xl text-ink uppercase tracking-tight">
              SHOP THE <span className="text-brand">RUNWAY LOOK</span>
            </h2>
          </div>
          <p className="font-sans text-xs text-ink/70 max-w-sm font-medium leading-relaxed uppercase">
            Click the runway beacons on the model to select and acquire individual pieces.
          </p>
        </div>

        {/* Hotspot Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10 items-stretch">
          {/* Main Visual */}
          <div className="lg:col-span-8 relative border-2 border-ink bg-sand/30 overflow-hidden aspect-[4/5] sm:aspect-[16/11]">
            <Image
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85"
              alt="Mentoos Runway Look"
              fill
              className="object-cover object-center filter grayscale contrast-[1.05]"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            <div className="absolute inset-0 bg-ink/20 pointer-events-none" />

            {/* Hotspots */}
            {HOTSPOTS.map((spot, i) => {
              const isSelected = activeSpot.id === spot.id;
              return (
                <div
                  key={spot.id}
                  style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    onClick={() => setActiveSpot(spot)}
                    className="relative group p-2 focus:outline-none"
                    aria-label={`Inspect ${spot.title}`}
                  >
                    <span className={`w-8 h-8 flex items-center justify-center font-bebas text-lg font-bold transition-all border-2 ${
                      isSelected
                        ? 'bg-brand border-brand text-paper scale-110 shadow-lg'
                        : 'bg-paper border-ink text-ink hover:scale-105'
                    }`}>
                      0{i + 1}
                    </span>
                    <span className="absolute inset-0 bg-brand/40 animate-ping -z-10" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Garment Detail */}
          <div className="lg:col-span-4 border-2 border-ink bg-paper p-8 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSpot.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <span className="font-mono text-xs uppercase font-bold text-brand block mb-1">
                    RUNWAY COMPONENT // {activeSpot.category}
                  </span>
                  <h3 className="font-bebas text-3xl uppercase tracking-wide text-ink">
                    {activeSpot.title}
                  </h3>
                </div>

                <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand/30 border-2 border-ink">
                  <Image
                    src={activeSpot.image}
                    alt={activeSpot.title}
                    fill
                    className="object-cover object-center filter grayscale"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <p className="text-ink/80 uppercase leading-relaxed">
                    {activeSpot.spec}
                  </p>
                  <div className="font-bebas text-3xl text-ink">
                    ₹{activeSpot.price.toLocaleString('en-IN')}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-6 border-t-2 border-ink space-y-3 mt-6">
              <button
                onClick={handleQuickAdd}
                className="w-full py-3.5 bg-brand hover:bg-ink text-paper font-sans text-xs font-black tracking-widest uppercase transition-all shadow-md"
              >
                {added ? 'LOCKED TO BAG ✓' : 'ADD PIECE TO BAG'}
              </button>
              <Link
                href={`/products?category=${activeSpot.category}`}
                className="text-center block font-sans text-xs uppercase font-extrabold text-ink/70 hover:text-ink tracking-wider"
              >
                VIEW FULL SPECIFICATION →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
