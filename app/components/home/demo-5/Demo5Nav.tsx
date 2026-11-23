'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { cinzel, outfit } from './fonts';

export function Demo5Nav() {
  const { itemCount } = useCart();

  return (
    <header className={`sticky top-0 z-40 bg-[#F4EFEA]/95 backdrop-blur-md border-b border-[#E3DACD] text-[#2C241E] ${cinzel.variable} ${outfit.variable} font-sans`}>
      {/* Top Artisanal Ribbon */}
      <div className="bg-[#B85D3B] text-[#F4EFEA] py-1.5 px-6 text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase font-serif">
          Crafted from 100% Normandy Flax & Long-Staple Cotton · Complimentary Doorstep Exchange
        </p>
      </div>

      {/* Main Bar */}
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 py-5 flex items-center justify-between">
        {/* Brand */}
        <Link href="/demo-5" className="group">
          <span className="font-serif text-2xl sm:text-3xl tracking-[0.15em] font-bold uppercase text-[#2C241E] block leading-none">
            MENTOOS
          </span>
          <span className="text-[9px] tracking-[0.3em] uppercase text-[#B85D3B] block font-sans mt-0.5">
            CRAFT & BOTANICAL
          </span>
        </Link>

        {/* Links */}
        <nav className="hidden lg:flex items-center gap-8 text-xs tracking-widest uppercase font-medium text-[#4A3E36]">
          <Link href="/products?category=t-shirts" className="hover:text-[#B85D3B] transition-colors">
            Cotton Jersey
          </Link>
          <Link href="/products?category=shirts" className="hover:text-[#B85D3B] transition-colors">
            Normandy Flax
          </Link>
          <Link href="/products?category=pants" className="hover:text-[#B85D3B] transition-colors">
            Gurkha Trousers
          </Link>
          <Link href="/products?sort=newest" className="hover:text-[#B85D3B] transition-colors">
            Artisanal Drops
          </Link>
          <Link href="/about" className="hover:text-[#B85D3B] transition-colors">
            The Sourcing
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-5 text-xs">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-mentoos-search'))}
            className="text-[#6B5C52] hover:text-[#2C241E] transition-colors text-xs tracking-widest uppercase hidden sm:inline"
          >
            Search [⌘K]
          </button>
          <Link
            href="/cart"
            className="px-5 py-2.5 rounded-full bg-[#B85D3B] hover:bg-[#9F4B2D] text-[#F4EFEA] transition-all flex items-center gap-2.5 text-xs tracking-widest uppercase font-medium shadow-sm"
          >
            <span>Cart</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F4EFEA]" />
            <span className="font-mono">{itemCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
