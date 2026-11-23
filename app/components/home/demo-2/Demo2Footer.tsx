'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { syne, spaceGrotesk, jetbrainsMono } from './fonts';

export function Demo2Footer() {
  const [inputVal, setInputVal] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal) {
      setSubscribed(true);
      setInputVal('');
    }
  };

  return (
    <footer className={`bg-ink text-paper pt-20 pb-12 border-t-4 border-brand ${spaceGrotesk.variable} ${syne.variable} ${jetbrainsMono.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8">
        {/* Top Terminal Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 border-b border-paper/20">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center gap-2 font-mono text-[10px] text-brand tracking-widest uppercase">
              <span className="w-2 h-2 bg-brand animate-pulse" />
              TERMINAL // PROTOCOL DISPATCH LIST
            </div>
            <h3 className="font-syne text-3xl sm:text-4xl font-extrabold uppercase text-paper tracking-tight">
              CONNECT TO RAW BATCH TELEMETRY
            </h3>
            <p className="font-mono text-xs text-paper/60 uppercase max-w-lg leading-relaxed">
              Receive raw batch release notifications, fabric index documentation, and immediate inventory access before public drop.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-end">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="INPUT TERMINAL EMAIL..."
                required
                className="flex-1 bg-paper/10 border-2 border-paper/30 px-4 py-3 font-mono text-xs text-paper placeholder-paper/40 focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand text-paper hover:bg-paper hover:text-ink font-mono text-xs uppercase font-bold tracking-widest transition-colors border-2 border-brand"
              >
                {subscribed ? 'INITIALIZED ✓' : 'ENGAGE →'}
              </button>
            </form>
          </div>
        </div>

        {/* 4 Index Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-paper/20 font-mono text-xs">
          <div className="space-y-4">
            <h4 className="text-brand font-bold uppercase text-[11px] tracking-wider">// SYSTEM INDEX</h4>
            <ul className="space-y-2 uppercase text-paper/70">
              <li><Link href="/products?category=t-shirts" className="hover:text-paper transition-colors">[01] Heavyweight Tees</Link></li>
              <li><Link href="/products?category=shirts" className="hover:text-paper transition-colors">[02] Pure Flax Shirts</Link></li>
              <li><Link href="/products?category=pants" className="hover:text-paper transition-colors">[03] Gurkha Trousers</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-paper transition-colors">[04] Latest Production</Link></li>
              <li><Link href="/products?sort=best-selling" className="hover:text-paper transition-colors">[05] Core Catalog</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-brand font-bold uppercase text-[11px] tracking-wider">// SPEC CODEX</h4>
            <ul className="space-y-2 uppercase text-paper/70">
              <li><Link href="/about" className="hover:text-paper transition-colors">Yarn Weight Matrix</Link></li>
              <li><Link href="/about" className="hover:text-paper transition-colors">Drop Shoulder CAD</Link></li>
              <li><Link href="/about" className="hover:text-paper transition-colors">Tensile Wash Records</Link></li>
              <li><Link href="/about" className="hover:text-paper transition-colors">Factory Compliance</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-brand font-bold uppercase text-[11px] tracking-wider">// LOGISTICS HUB</h4>
            <ul className="space-y-2 uppercase text-paper/70">
              <li><Link href="/shipping" className="hover:text-paper transition-colors">Direct Doorstep Exchange</Link></li>
              <li><Link href="/shipping" className="hover:text-paper transition-colors">Insured COD Protocol</Link></li>
              <li><Link href="/contact" className="hover:text-paper transition-colors">Terminal Helpdesk</Link></li>
              <li><Link href="/track-order" className="hover:text-paper transition-colors">Order Tracking API</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-brand font-bold uppercase text-[11px] tracking-wider">// ATELIER COORDINATES</h4>
            <p className="text-paper/60 uppercase leading-relaxed text-[11px]">
              MENTOOS ATELIER PRODUCTION UNIT<br />
              PLOT 48, OKHLA INDUSTRIAL AREA III<br />
              NEW DELHI 110020, INDIA<br />
              <span className="text-brand font-bold mt-2 block">DISPATCH: ACTIVE 24/7</span>
            </p>
          </div>
        </div>

        {/* Giant Monospace / Syne Wordmark */}
        <div className="pt-12 pb-6 border-b border-paper/10 text-center select-none overflow-hidden">
          <span className="font-syne font-black text-[13vw] leading-none tracking-tighter text-paper/10 block hover:text-paper/20 transition-colors uppercase">
            MENTOOS.SYS
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase text-paper/40 tracking-wider">
          <div>
            SYSTEM_ID: 88192-DELHI // ALL RIGHTS RESERVED © {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-paper transition-colors">PRIVACY_POLICY</Link>
            <Link href="/terms" className="hover:text-paper transition-colors">TERMS_OF_SERVICE</Link>
            <Link href="/shipping" className="hover:text-paper transition-colors">DISPATCH_CODE</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
