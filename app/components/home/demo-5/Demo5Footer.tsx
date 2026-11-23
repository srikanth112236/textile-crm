'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cinzel, outfit } from './fonts';

export function Demo5Footer() {
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
    <footer className={`bg-[#2C241E] text-[#F4EFEA] pt-24 pb-12 border-t-4 border-[#B85D3B] ${cinzel.variable} ${outfit.variable} font-sans`}>
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10">
        {/* Top Newsletter Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16 border-b border-[#F4EFEA]/15">
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#E08F6E] font-serif block">
              The Harvest Gazette
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl font-normal text-[#F4EFEA]">
              Subscribe to Private <span className="italic font-normal text-[#E08F6E]">Dispatches</span>
            </h3>
            <p className="text-xs text-[#F4EFEA]/70 font-sans max-w-md leading-relaxed">
              Early notifications for limited Normandy linen harvests, private studio appointments, and seasonal lookbooks.
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
                className="flex-1 bg-[#F4EFEA]/10 border border-[#F4EFEA]/20 px-4 py-3.5 text-xs text-[#F4EFEA] placeholder-[#F4EFEA]/40 focus:outline-none focus:border-[#E08F6E] font-sans rounded-none"
              />
              <button
                type="submit"
                className="px-8 py-3.5 bg-[#B85D3B] hover:bg-[#9F4B2D] text-[#F4EFEA] text-xs tracking-widest uppercase font-semibold transition-all font-sans"
              >
                {subscribed ? 'Subscribed ✓' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* 4 Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-[#F4EFEA]/15 text-xs font-sans">
          <div className="space-y-4">
            <h4 className="text-[10px] tracking-widest uppercase text-[#E08F6E] font-serif font-bold">Materials</h4>
            <ul className="space-y-2.5 text-[#F4EFEA]/70">
              <li><Link href="/products?category=t-shirts" className="hover:text-[#F4EFEA] transition-colors">280 GSM Cotton</Link></li>
              <li><Link href="/products?category=shirts" className="hover:text-[#F4EFEA] transition-colors">Normandy Flax Linen</Link></li>
              <li><Link href="/products?category=pants" className="hover:text-[#F4EFEA] transition-colors">Gurkha Trousers</Link></li>
              <li><Link href="/products?sort=newest" className="hover:text-[#F4EFEA] transition-colors">New Harvest</Link></li>
              <li><Link href="/products?sort=best-selling" className="hover:text-[#F4EFEA] transition-colors">Signature Line</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] tracking-widest uppercase text-[#E08F6E] font-serif font-bold">Atelier Code</h4>
            <ul className="space-y-2.5 text-[#F4EFEA]/70">
              <li><Link href="/about" className="hover:text-[#F4EFEA] transition-colors">Fabric Sourcing Index</Link></li>
              <li><Link href="/about" className="hover:text-[#F4EFEA] transition-colors">Weave Philosophy</Link></li>
              <li><Link href="/about" className="hover:text-[#F4EFEA] transition-colors">Pattern Grading</Link></li>
              <li><Link href="/about" className="hover:text-[#F4EFEA] transition-colors">Eco Sourcing</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] tracking-widest uppercase text-[#E08F6E] font-serif font-bold">Patron Care</h4>
            <ul className="space-y-2.5 text-[#F4EFEA]/70">
              <li><Link href="/shipping" className="hover:text-[#F4EFEA] transition-colors">Doorstep Size Exchange</Link></li>
              <li><Link href="/shipping" className="hover:text-[#F4EFEA] transition-colors">Direct COD & Delivery</Link></li>
              <li><Link href="/contact" className="hover:text-[#F4EFEA] transition-colors">Concierge Desk</Link></li>
              <li><Link href="/track-order" className="hover:text-[#F4EFEA] transition-colors">Track Shipment</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] tracking-widest uppercase text-[#E08F6E] font-serif font-bold">Atelier Studio</h4>
            <p className="text-[#F4EFEA]/70 leading-relaxed text-xs">
              Mentoos Earth & Craft Studio<br />
              Industrial Area Phase III<br />
              New Delhi 110020, India<br />
              <span className="text-[#E08F6E] block mt-2">concierge@mentoos.in</span>
            </p>
          </div>
        </div>

        {/* Giant Cinzel Wordmark */}
        <div className="pt-16 pb-8 border-b border-[#F4EFEA]/10 text-center select-none overflow-hidden">
          <span className="font-serif font-normal text-[15vw] leading-none tracking-[0.1em] text-[#F4EFEA]/10 block hover:text-[#F4EFEA]/20 transition-colors">
            MENTOOS
          </span>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] tracking-widest uppercase text-[#F4EFEA]/50 font-sans">
          <div>
            © {new Date().getFullYear()} Mentoos Fashion Ltd. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#F4EFEA] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#F4EFEA] transition-colors">Terms</Link>
            <Link href="/shipping" className="hover:text-[#F4EFEA] transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
