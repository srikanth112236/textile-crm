'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { fraunces, manrope } from './fonts';

export function Demo1Footer() {
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
    <footer className={`relative bg-ink text-paper pt-24 pb-12 ${manrope.variable} ${fraunces.variable} font-sans overflow-hidden`}>
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12">
        {/* Top Newsletter & Atelier Dispatch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-20 border-b border-paper/15">
          <div className="lg:col-span-6 space-y-4">
            <span className="font-mono text-[10px] tracking-widest text-brand uppercase">
              The Gazette · Vol. XXIV
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-light text-paper tracking-tight">
              Subscribe to Private <span className="italic font-normal">Dispatches</span>
            </h3>
            <p className="text-xs text-paper/60 font-sans max-w-md leading-relaxed tracking-tight">
              Invitations to limited fabric roll releases, seasonal lookbooks, and private studio previews. No spam, only editorial substance.
            </p>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-end">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your private email..."
                required
                className="flex-1 bg-paper/5 border border-paper/20 px-4 py-3.5 text-xs text-paper placeholder-paper/40 focus:outline-none focus:border-brand font-mono"
              />
              <button
                type="submit"
                className="px-8 py-3.5 bg-paper text-ink hover:bg-brand hover:text-paper transition-all duration-300 text-xs font-mono tracking-widest uppercase"
              >
                {subscribed ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* 4-Column Editorial Colophon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-paper/15 text-xs">
          <div className="space-y-4">
            <h4 className="font-mono text-[10px] tracking-widest uppercase text-paper/40">Collections</h4>
            <ul className="space-y-2.5">
              <li><Link href="/products?category=shirts" className="text-paper/70 hover:text-paper transition-colors">Pure Linen Shirts</Link></li>
              <li><Link href="/products?category=t-shirts" className="text-paper/70 hover:text-paper transition-colors">240 GSM Heavy Tees</Link></li>
              <li><Link href="/products?category=pants" className="text-paper/70 hover:text-paper transition-colors">Gurkha & Pleated Trousers</Link></li>
              <li><Link href="/products?sort=newest" className="text-paper/70 hover:text-paper transition-colors">New Arrivals</Link></li>
              <li><Link href="/products?sort=best-selling" className="text-paper/70 hover:text-paper transition-colors">Signature Essentials</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-mono text-[10px] tracking-widest uppercase text-paper/40">Atelier Ethos</h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-paper/70 hover:text-paper transition-colors">Fabric Sourcing Index</Link></li>
              <li><Link href="/about" className="text-paper/70 hover:text-paper transition-colors">GSM & Weave Philosophy</Link></li>
              <li><Link href="/about" className="text-paper/70 hover:text-paper transition-colors">The Bespoke Silhouette</Link></li>
              <li><Link href="/about" className="text-paper/70 hover:text-paper transition-colors">Sustainability Code</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-mono text-[10px] tracking-widest uppercase text-paper/40">Patron Care</h4>
            <ul className="space-y-2.5">
              <li><Link href="/shipping" className="text-paper/70 hover:text-paper transition-colors">Doorstep Size Exchange</Link></li>
              <li><Link href="/shipping" className="text-paper/70 hover:text-paper transition-colors">Direct COD & Delivery</Link></li>
              <li><Link href="/contact" className="text-paper/70 hover:text-paper transition-colors">Concierge Desk</Link></li>
              <li><Link href="/size-guide" className="text-paper/70 hover:text-paper transition-colors">Garment Sizing Matrix</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-mono text-[10px] tracking-widest uppercase text-paper/40">Atelier Studio</h4>
            <p className="text-paper/60 leading-relaxed font-sans text-xs">
              Mentoos Men’s Fashion Studio<br />
              Industrial Estate, Okhla Phase III<br />
              New Delhi 110020, India<br />
              <span className="font-mono text-[10px] text-paper/40">concierge@mentoos.in</span>
            </p>
          </div>
        </div>

        {/* Oversized Full-Width Typographic Wordmark */}
        <div className="pt-16 pb-8 border-b border-paper/10 overflow-hidden text-center select-none">
          <span className="font-serif font-light text-[15vw] leading-none tracking-tighter text-paper/10 block hover:text-paper/20 transition-colors duration-700">
            MENTOOS
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-paper/40 uppercase tracking-widest">
          <div>
            © {new Date().getFullYear()} Mentoos Fashion Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-paper transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-paper transition-colors">Terms of Atelier</Link>
            <Link href="/shipping" className="hover:text-paper transition-colors">Shipping Codex</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
