'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { bebasNeue, dmSans } from './fonts';

export function Demo4Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className={`bg-ink text-paper pt-20 pb-12 border-t-4 border-brand ${bebasNeue.variable} ${dmSans.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Top Newsletter Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 border-b border-paper/20">
          <div className="lg:col-span-7 space-y-3">
            <span className="font-mono text-xs uppercase font-bold text-brand block">
              RUNWAY BROADCAST NETWORK
            </span>
            <h3 className="font-bebas text-4xl sm:text-5xl uppercase tracking-wide text-paper">
              SUBSCRIBE TO RUNWAY BATCH DROPS
            </h3>
            <p className="font-sans text-xs text-paper/70 max-w-md leading-relaxed uppercase">
              Immediate notifications when limited production runs and seasonal lookbooks enter fulfillment.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-end">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ENTER EMAIL ADDRESS..."
                required
                className="flex-1 bg-paper/10 border-2 border-paper/30 px-4 py-3 font-mono text-xs text-paper placeholder-paper/40 focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-brand text-paper hover:bg-paper hover:text-ink font-sans text-xs uppercase font-black tracking-widest transition-colors border-2 border-brand"
              >
                {subscribed ? 'JOINED ✓' : 'ENGAGE →'}
              </button>
            </form>
          </div>
        </div>

        {/* 4 Index Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-paper/20 font-mono text-xs uppercase">
          <div className="space-y-4">
            <h4 className="text-brand font-bold">// RUNWAY INDEX</h4>
            <ul className="space-y-2 text-paper/70">
              <li><Link href="/products?category=t-shirts" className="hover:text-paper transition-colors">Heavyweight Tees</Link></li>
              <li><Link href="/products?category=shirts" className="hover:text-paper transition-colors">Pure Flax Shirts</Link></li>
              <li><Link href="/products?category=pants" className="hover:text-paper transition-colors">Gurkha Trousers</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-paper transition-colors">Latest Production</Link></li>
              <li><Link href="/products?sort=best-selling" className="hover:text-paper transition-colors">Core Archives</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-brand font-bold">// RUNWAY CODEX</h4>
            <ul className="space-y-2 text-paper/70">
              <li><Link href="/about" className="hover:text-paper transition-colors">GSM Specs</Link></li>
              <li><Link href="/about" className="hover:text-paper transition-colors">Drop Shoulder CAD</Link></li>
              <li><Link href="/about" className="hover:text-paper transition-colors">Wash Records</Link></li>
              <li><Link href="/about" className="hover:text-paper transition-colors">Atelier Standards</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-brand font-bold">// CLIENT CARE</h4>
            <ul className="space-y-2 text-paper/70">
              <li><Link href="/shipping" className="hover:text-paper transition-colors">Doorstep Size Exchange</Link></li>
              <li><Link href="/shipping" className="hover:text-paper transition-colors">Insured COD Protocol</Link></li>
              <li><Link href="/contact" className="hover:text-paper transition-colors">Helpdesk Direct</Link></li>
              <li><Link href="/track-order" className="hover:text-paper transition-colors">Track Shipment</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-brand font-bold">// ATELIER STUDIO</h4>
            <p className="text-paper/60 leading-relaxed text-[11px]">
              MENTOOS RUNWAY ATELIER<br />
              OKHLA INDUSTRIAL AREA III<br />
              NEW DELHI 110020, INDIA<br />
              <span className="text-brand font-bold mt-2 block">DISPATCH: ACTIVE 24/7</span>
            </p>
          </div>
        </div>

        {/* Giant Bebas Wordmark */}
        <div className="pt-12 pb-6 border-b border-paper/10 text-center select-none overflow-hidden">
          <span className="font-bebas text-[18vw] leading-none tracking-tight text-paper/10 block hover:text-paper/20 transition-colors uppercase">
            MENTOOS.RUNWAY
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase text-paper/40 tracking-wider">
          <div>
            © {new Date().getFullYear()} MENTOOS FASHION LTD. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-paper transition-colors">PRIVACY</Link>
            <Link href="/terms" className="hover:text-paper transition-colors">TERMS</Link>
            <Link href="/shipping" className="hover:text-paper transition-colors">SHIPPING</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
