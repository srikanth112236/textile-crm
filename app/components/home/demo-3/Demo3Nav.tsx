'use client';

import React from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { plusJakarta, playfair } from './fonts';

export function Demo3Nav() {
  const { itemCount } = useCart();

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-mentoos-search'));
  };

  return (
    <header className={`sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E7E5E0] text-[#121214] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      {/* Top Value Strip */}
      <div className="bg-[#18181B] text-[#FAF9F6] py-1.5 px-6 text-center text-[10px] tracking-[0.2em] uppercase font-mono font-medium">
        <span>Complimentary Doorstep Size Replacement Across India · Insured COD Dispatch</span>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 py-4 flex items-center justify-between gap-6">
        {/* Brand */}
        <Link href="/demo-3" className="group flex items-baseline gap-2">
          <span className="font-serif text-2xl sm:text-3xl tracking-[0.1em] font-normal uppercase text-[#121214] block leading-none">
            MENTOOS
          </span>
          <span className="text-[9px] tracking-[0.3em] uppercase text-[#D97706] font-mono font-bold">
            STUDIO
          </span>
        </Link>

        {/* Center Smart Search Interactive Bar */}
        <button
          type="button"
          onClick={handleOpenSearch}
          className="hidden md:flex items-center justify-between w-full max-w-md px-4 py-2 rounded-full bg-[#F0EEE9] hover:bg-[#EAE6DF] border border-[#E0DCD4] transition-all duration-200 text-left group"
        >
          <div className="flex items-center gap-2.5 text-[#78716C] text-xs">
            <Search className="w-3.5 h-3.5 text-[#D97706] group-hover:scale-110 transition-transform" />
            <span className="font-sans text-xs text-[#57534E]">
              Search for &lsquo;Shirts&rsquo;, &lsquo;Black Tee&rsquo;, &lsquo;Joggers&rsquo;...
            </span>
          </div>
          <kbd className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#D6D3D1] text-[#78716C] shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Right Navigation & Bag */}
        <div className="flex items-center gap-6 text-xs">
          <nav className="hidden lg:flex items-center gap-6 font-medium text-[#44403C] tracking-wider uppercase text-[11px]">
            <Link href="/products?category=t-shirts" className="hover:text-[#121214] transition-colors">
              Jersey Tees
            </Link>
            <Link href="/products?category=shirts" className="hover:text-[#121214] transition-colors">
              Flax Linen
            </Link>
            <Link href="/products?category=pants" className="hover:text-[#121214] transition-colors">
              Trousers
            </Link>
            <Link href="/products?sort=newest" className="hover:text-[#121214] transition-colors">
              Studio Drop
            </Link>
          </nav>

          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={handleOpenSearch}
            className="md:hidden p-2 text-[#44403C] hover:text-[#121214]"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-[#D97706]" />
          </button>

          {/* Bag */}
          <Link
            href="/cart"
            className="px-4 py-2 rounded-full bg-[#18181B] hover:bg-[#D97706] text-[#FAF9F6] transition-all flex items-center gap-2 font-mono text-xs font-bold shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>BAG</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {itemCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
