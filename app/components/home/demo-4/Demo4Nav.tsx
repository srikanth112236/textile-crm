'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { bebasNeue, dmSans } from './fonts';

export function Demo4Nav() {
  const { itemCount } = useCart();

  return (
    <header className={`sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b-2 border-ink ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      {/* High-Velocity Marquee Ticker Tape */}
      <div className="bg-brand text-paper overflow-hidden py-1 border-b border-ink/20">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-8 font-mono text-[10px] tracking-widest uppercase font-bold">
          <span>MENTOOS RUNWAY 2026</span>
          <span>•</span>
          <span>280 GSM HEAVYWEIGHT COTTON DROP</span>
          <span>•</span>
          <span>DOORSTEP SIZE REPLACEMENT ACROSS INDIA</span>
          <span>•</span>
          <span>PURE BELGIAN FLAX LINEN AIRFLOW</span>
          <span>•</span>
          <span>INSURED CASH ON DELIVERY</span>
          <span>•</span>
          <span>MENTOOS RUNWAY 2026</span>
          <span>•</span>
          <span>280 GSM HEAVYWEIGHT COTTON DROP</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 py-4 flex items-center justify-between">
        {/* Brand */}
        <Link href="/demo-4" className="flex items-baseline gap-2 group">
          <span className="font-bebas text-3xl sm:text-4xl tracking-wider text-ink block leading-none">
            MENTOOS
          </span>
          <span className="text-[10px] font-mono tracking-widest text-brand font-black uppercase">
            [RUNWAY]
          </span>
        </Link>

        {/* Center Links */}
        <nav className="hidden lg:flex items-center gap-8 font-sans text-xs font-bold uppercase tracking-wider text-ink/80">
          <Link href="/products?category=t-shirts" className="hover:text-brand transition-colors">
            Heavy Tees
          </Link>
          <Link href="/products?category=shirts" className="hover:text-brand transition-colors">
            Flax Shirts
          </Link>
          <Link href="/products?category=pants" className="hover:text-brand transition-colors">
            Gurkha Trousers
          </Link>
          <Link href="/products?sort=newest" className="hover:text-brand transition-colors">
            Runway Drops
          </Link>
          <Link href="/about" className="hover:text-brand transition-colors">
            Manifesto
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-mentoos-search'))}
            className="font-mono text-xs uppercase tracking-wider text-ink/70 hover:text-ink hidden sm:inline"
          >
            Search [⌘K]
          </button>
          <Link
            href="/cart"
            className="px-5 py-2.5 bg-ink hover:bg-brand text-paper font-sans text-xs uppercase font-extrabold tracking-wider transition-all flex items-center gap-2"
          >
            <span>BAG</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            <span className="font-mono">{itemCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
