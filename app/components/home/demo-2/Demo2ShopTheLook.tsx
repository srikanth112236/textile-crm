'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/contexts/CartContext';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

interface Part {
  id: string;
  code: string;
  x: number;
  y: number;
  name: string;
  category: string;
  spec: string;
  price: number;
  image: string;
}

const PARTS: Part[] = [
  {
    id: 'part-1',
    code: 'MOD-01',
    x: 52,
    y: 35,
    name: 'Camp-Collar Belgian Flax Shirt',
    category: 'shirts',
    spec: '100% Normandy Flax · 165 GSM · Natural Oat',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'part-2',
    code: 'MOD-02',
    x: 48,
    y: 74,
    name: 'Double-Pleated Tailored Gurkha',
    category: 'pants',
    spec: 'Weighted Cotton Twill · Deep Rise · Bone Sand',
    price: 2899,
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
  },
];

export function Demo2ShopTheLook() {
  const { addItem } = useCart();
  const [selectedPart, setSelectedPart] = useState<Part>(PARTS[0]);
  const [added, setAdded] = useState(false);

  const handleAddPart = () => {
    addItem(selectedPart.id, 1, [{ name: 'Size', value: 'L' }]);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className={`relative bg-paper py-20 border-b-2 border-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Section Spec Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-brand tracking-widest uppercase mb-2">
              <span className="w-2 h-2 bg-brand" />
              SYSTEM // 08 · COMPONENT EXPLODED ASSEMBLY
            </div>
            <h2 className="font-syne text-3xl sm:text-5xl font-black uppercase text-ink tracking-tight">
              SHOP THE <span className="text-brand">LOADOUT ASSEMBLY</span>
            </h2>
          </div>
          <p className="font-mono text-xs text-ink/70 max-w-sm uppercase leading-relaxed">
            Deconstructed outfit system. Tap calibration points on the model matrix to examine individual garment specifications.
          </p>
        </div>

        {/* Blueprint Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10 items-stretch">
          {/* Main Visual with Coordinates */}
          <div className="lg:col-span-8 relative border-2 border-ink bg-sand/30 overflow-hidden aspect-[4/5] sm:aspect-[16/11]">
            <Image
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1600&q=85"
              alt="Mentoos Exploded Lookbook Specimen"
              fill
              className="object-cover object-center filter grayscale contrast-[1.05]"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            <div className="absolute inset-0 bg-ink/20 pointer-events-none" />

            {/* Target Reticles */}
            {PARTS.map((part) => {
              const isSelected = selectedPart.id === part.id;
              return (
                <div
                  key={part.id}
                  style={{ left: `${part.x}%`, top: `${part.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    onClick={() => setSelectedPart(part)}
                    className="group relative flex items-center gap-2 focus:outline-none"
                  >
                    <span className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold transition-all border-2 ${
                      isSelected
                        ? 'bg-brand text-paper border-brand scale-110 shadow-lg'
                        : 'bg-paper text-ink border-ink hover:scale-105'
                    }`}>
                      +
                    </span>
                    <span className="bg-ink text-paper font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider hidden sm:inline">
                      {part.code}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Part Telemetry Card */}
          <div className="lg:col-span-4 border-2 border-ink bg-paper p-6 sm:p-8 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPart.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="border-b-2 border-ink pb-4">
                  <div className="flex items-center justify-between font-mono text-[10px] text-ink/60 uppercase">
                    <span>PART CODE // {selectedPart.code}</span>
                    <span className="text-brand font-bold">SYSTEM ACTIVE</span>
                  </div>
                  <h3 className="font-syne text-2xl font-black uppercase text-ink tracking-tight mt-2">
                    {selectedPart.name}
                  </h3>
                </div>

                {/* Part Specimen Thumbnail */}
                <div className="relative aspect-[4/3] w-full bg-sand/30 border-2 border-ink overflow-hidden">
                  <Image
                    src={selectedPart.image}
                    alt={selectedPart.name}
                    fill
                    className="object-cover object-center filter grayscale contrast-[1.05]"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-ink/20">
                    <span className="text-ink/60">CATEGORY:</span>
                    <span className="font-bold text-ink uppercase">{selectedPart.category}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-ink/20">
                    <span className="text-ink/60">SPECIFICATION:</span>
                    <span className="font-bold text-ink uppercase text-[11px] text-right max-w-[200px]">
                      {selectedPart.spec}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-ink/20">
                    <span className="text-ink/60">ACQUISITION:</span>
                    <span className="font-bold text-brand text-base">
                      ₹{selectedPart.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="pt-6 border-t-2 border-ink space-y-3">
              <button
                onClick={handleAddPart}
                className="w-full py-3.5 bg-ink text-paper hover:bg-brand font-mono text-xs tracking-widest uppercase font-bold transition-all text-center block"
              >
                {added ? 'COMPONENT LOCKED ✓' : `ADD ${selectedPart.code} TO BAG`}
              </button>
              <Link
                href={`/products?category=${selectedPart.category}`}
                className="text-center block font-mono text-[11px] uppercase text-ink/70 hover:text-ink tracking-wider"
              >
                OPEN TECHNICAL SPEC SHEET →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
