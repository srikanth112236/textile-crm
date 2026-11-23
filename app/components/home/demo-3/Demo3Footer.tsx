'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { plusJakarta, playfair } from './fonts';

export function Demo3Footer() {
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
    <footer className={`bg-[#18181B] text-[#FAF9F6] pt-24 pb-12 border-t border-[#27272A] ${plusJakarta.variable} ${playfair.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Top Newsletter Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 border-b border-white/10">
          <div className="lg:col-span-7 space-y-3">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#FBBF24] block">
              Studio Membership
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#FAF9F6]">
              Invitations to Private <span className="italic font-normal text-[#FBBF24]">Releases</span>
            </h3>
            <p className="text-xs text-[#A1A1AA] font-sans max-w-md leading-relaxed">
              Subscribers receive early access to seasonal fabric runs and private atelier appointments.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-end">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                required
                className="flex-1 bg-white/5 border border-white/15 px-4 py-3.5 text-xs text-[#FAF9F6] placeholder-neutral-500 focus:outline-none focus:border-[#FBBF24] font-sans rounded-full"
              />
              <button
                type="submit"
                className="px-8 py-3.5 rounded-full bg-[#FAF9F6] hover:bg-[#D97706] text-[#18181B] hover:text-[#FAF9F6] text-xs font-mono tracking-widest uppercase font-bold transition-all shadow-md"
              >
                {subscribed ? 'Invited ✓' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* 4 Index Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-white/10 text-xs font-sans">
          <div className="space-y-4">
            <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#FBBF24] font-bold">Silhouettes</h4>
            <ul className="space-y-2.5 text-[#A1A1AA]">
              <li><Link href="/products?category=t-shirts" className="hover:text-[#FAF9F6] transition-colors">280 GSM Heavy Tees</Link></li>
              <li><Link href="/products?category=shirts" className="hover:text-[#FAF9F6] transition-colors">Belgian Flax Shirts</Link></li>
              <li><Link href="/products?category=pants" className="hover:text-[#FAF9F6] transition-colors">Gurkha Trousers</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-[#FAF9F6] transition-colors">Studio Drops</Link></li>
              <li><Link href="/products?sort=best-selling" className="hover:text-[#FAF9F6] transition-colors">Signature Line</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#FBBF24] font-bold">The Studio</h4>
            <ul className="space-y-2.5 text-[#A1A1AA]">
              <li><Link href="/about" className="hover:text-[#FAF9F6] transition-colors">Yarn Weave Codex</Link></li>
              <li><Link href="/about" className="hover:text-[#FAF9F6] transition-colors">Pattern Grading</Link></li>
              <li><Link href="/about" className="hover:text-[#FAF9F6] transition-colors">Flax Sourcing</Link></li>
              <li><Link href="/about" className="hover:text-[#FAF9F6] transition-colors">Sustainability Index</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#FBBF24] font-bold">Concierge</h4>
            <ul className="space-y-2.5 text-[#A1A1AA]">
              <li><Link href="/shipping" className="hover:text-[#FAF9F6] transition-colors">Doorstep Size Exchange</Link></li>
              <li><Link href="/shipping" className="hover:text-[#FAF9F6] transition-colors">Insured COD Dispatch</Link></li>
              <li><Link href="/contact" className="hover:text-[#FAF9F6] transition-colors">Client Support</Link></li>
              <li><Link href="/track-order" className="hover:text-[#FAF9F6] transition-colors">Track Shipment</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-mono text-[10px] tracking-widest uppercase text-[#FBBF24] font-bold">Studio Headquarters</h4>
            <p className="text-[#A1A1AA] leading-relaxed text-xs">
              Mentoos Design Studio<br />
              Okhla Phase III, New Delhi 110020<br />
              <span className="text-[#FBBF24] block mt-2 font-mono text-[11px]">concierge@mentoos.in</span>
            </p>
          </div>
        </div>

        {/* Oversized Wordmark */}
        <div className="pt-16 pb-8 border-b border-white/5 text-center select-none overflow-hidden">
          <span className="font-serif font-normal text-[15vw] leading-none tracking-[0.1em] text-white/5 block hover:text-white/10 transition-colors uppercase">
            MENTOOS
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] tracking-widest uppercase text-neutral-500">
          <div>
            © {new Date().getFullYear()} Mentoos Fashion Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#FAF9F6] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#FAF9F6] transition-colors">Terms</Link>
            <Link href="/shipping" className="hover:text-[#FAF9F6] transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
