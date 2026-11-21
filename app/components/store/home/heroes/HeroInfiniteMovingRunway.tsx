'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

const TRACK_1 = [
  { title: 'Heavyweight Boxy Tee', price: '₹899', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=400&q=80' },
  { title: 'French Linen Shirt', price: '₹1,399', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80' },
  { title: 'Pleated Wool Trousers', price: '₹1,599', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=400&q=80' },
  { title: 'Designer Slub Kurta', price: '₹1,299', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=400&q=80' },
  { title: 'Cargo Joggers 6-Pocket', price: '₹1,499', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=400&q=80' },
  { title: 'Heavyweight Boxy Tee', price: '₹899', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=400&q=80' },
];

const TRACK_2 = [
  { title: 'Structured Charcoal Blazer', price: '₹3,499', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80' },
  { title: 'Waffle Knit Polo', price: '₹999', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=400&q=80' },
  { title: 'Relaxed Chino Pants', price: '₹1,299', image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=400&q=80' },
  { title: 'Slub Ivory Kurta', price: '₹1,199', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80' },
  { title: 'Pro-Dry Athletic Tee', price: '₹699', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80' },
  { title: 'Structured Charcoal Blazer', price: '₹3,499', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80' },
];

export function HeroInfiniteMovingRunway() {
  return (
    <section className="relative overflow-hidden rounded-[36px] bg-[#1a1816] py-12 text-white shadow-2xl border border-[#2e2a25]">
      {/* Lateral Blur Vignettes */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#1a1816] to-transparent z-20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#1a1816] to-transparent z-20" />

      {/* Center Floating Glass Statement Card */}
      <div className="relative z-30 mx-auto max-w-xl text-center px-4 mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e59b7b] backdrop-blur-md">
          <Sparkles className="h-3 w-3" /> Aceternity 04 · Infinite Velocity Scroller
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 text-white">
          DESIGNED FOR THOSE WHO COMMAND ATTENTION
        </h2>
        <div className="pt-4">
          <Link
            href="/products?sort=best-selling&order=desc"
            className="inline-flex items-center gap-2 rounded-xl bg-[#e59b7b] px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition-all hover:bg-[#d88a68] shadow-lg active:scale-95"
          >
            <span>Explore All 2026 Drops</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Top Track (Moving Left) */}
      <div className="flex gap-4 overflow-hidden mb-4">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
          className="flex gap-4 shrink-0"
        >
          {TRACK_1.map((item, idx) => (
            <div
              key={idx}
              className="relative w-52 shrink-0 overflow-hidden rounded-2xl bg-[#25211d] border border-white/10 p-2.5 shadow-md flex items-center gap-3"
            >
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{item.title}</p>
                <p className="text-xs font-extrabold text-[#e59b7b] mt-0.5">{item.price}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Track (Moving Right) */}
      <div className="flex gap-4 overflow-hidden">
        <motion.div
          animate={{ x: [-1000, 0] }}
          transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
          className="flex gap-4 shrink-0"
        >
          {TRACK_2.map((item, idx) => (
            <div
              key={idx}
              className="relative w-52 shrink-0 overflow-hidden rounded-2xl bg-[#25211d] border border-white/10 p-2.5 shadow-md flex items-center gap-3"
            >
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                <Image src={item.image} alt={item.title} fill className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">{item.title}</p>
                <p className="text-xs font-extrabold text-[#e59b7b] mt-0.5">{item.price}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
