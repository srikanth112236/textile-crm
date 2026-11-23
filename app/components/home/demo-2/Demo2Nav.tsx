'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/contexts/CartContext';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

export function Demo2Nav() {
  const { itemCount } = useCart();
  const [time, setTime] = useState<string>('00:00:00 UTC');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTime(
        d.toUTCString().split(' ')[4] + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b-2 border-ink text-ink ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      {/* Top Telemetry Strip */}
      <div className="bg-ink text-paper py-1.5 px-4 sm:px-8 border-b border-paper/20 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-none bg-brand animate-pulse" />
            SYS_ONLINE
          </span>
          <span className="hidden sm:inline text-paper/60">SPEC_SPECIFICATION // VOL_02</span>
          <span className="hidden md:inline text-paper/60">LOC: 28°32&apos;N 77°16&apos;E</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="font-mono text-brand font-bold">{time}</span>
          <span className="hidden sm:inline text-paper/80">COD DISPATCH ACTIVE</span>
        </div>
      </div>

      {/* Main Blueprint Navigation Bar */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        {/* Left: Brand Identity with Blueprint Mark */}
        <div className="flex items-center gap-6">
          <Link href="/demo-2" className="group flex items-center gap-3">
            <div className="w-8 h-8 bg-ink text-paper flex items-center justify-center font-mono text-sm font-black group-hover:bg-brand transition-colors">
              M
            </div>
            <div>
              <span className="font-syne text-2xl sm:text-3xl font-extrabold tracking-tighter uppercase block leading-none">
                MENTOOS
              </span>
              <span className="font-mono text-[9px] tracking-widest text-ink/60 uppercase block mt-0.5">
                ATELIER SPEC 2.0
              </span>
            </div>
          </Link>
        </div>

        {/* Center: System Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 font-mono text-xs tracking-wider">
          <Link
            href="/products?category=t-shirts"
            className="px-3.5 py-1.5 border border-transparent hover:border-ink hover:bg-sand/30 transition-all uppercase"
          >
            [01] Heavy Tees
          </Link>
          <Link
            href="/products?category=shirts"
            className="px-3.5 py-1.5 border border-transparent hover:border-ink hover:bg-sand/30 transition-all uppercase"
          >
            [02] Flax Shirts
          </Link>
          <Link
            href="/products?category=pants"
            className="px-3.5 py-1.5 border border-transparent hover:border-ink hover:bg-sand/30 transition-all uppercase"
          >
            [03] Trousers
          </Link>
          <Link
            href="/products?sort=newest"
            className="px-3.5 py-1.5 border border-transparent hover:border-ink hover:bg-sand/30 transition-all uppercase"
          >
            [04] Releases
          </Link>
          <Link
            href="/about"
            className="px-3.5 py-1.5 border border-transparent hover:border-ink hover:bg-sand/30 transition-all uppercase"
          >
            [05] Codex
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-mentoos-search'))}
            className="px-3 py-1.5 border border-ink hover:bg-ink hover:text-paper transition-all uppercase text-[11px] flex items-center gap-1.5"
          >
            <span>INDEX SEARCH</span>
            <span className="text-[9px] opacity-60">⌘K</span>
          </button>
          <Link
            href="/cart"
            className="px-3.5 py-1.5 bg-ink text-paper hover:bg-brand transition-colors uppercase font-bold flex items-center gap-2"
          >
            <span>BAG</span>
            <span className="px-1.5 py-0.2 bg-paper text-ink text-[10px]">
              {itemCount.toString().padStart(2, '0')}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
