'use client';

import { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Sparkles, Zap } from 'lucide-react';

const ANNOUNCEMENTS = [
  { icon: Sparkles, text: '🔥 FLAT 15% OFF ON YOUR FIRST ORDER | USE CODE: MENTOOS15' },
  { icon: Truck, text: '🚚 FREE EXPRESS SHIPPING ON ALL ORDERS OVER ₹999' },
  { icon: ShieldCheck, text: '💵 CASH ON DELIVERY AVAILABLE | EASY 7-DAY EXCHANGES' },
  { icon: Zap, text: '⚡ NEW ARRIVALS 2026 NOW LIVE — SHOP OVERSIZED TEES & KURTAS' },
];

export function TopAnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState(ANNOUNCEMENTS);

  useEffect(() => {
    import('@/lib/api/settings').then((m) =>
      m.settingsApi.getPublic().then((s) => {
        if (s.storefront?.announcement) {
          setItems([{ icon: Sparkles, text: s.storefront.announcement }, ...ANNOUNCEMENTS.slice(1)]);
        }
      }).catch(() => {})
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  const Current = items[index];
  const Icon = Current.icon;

  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-amber-400 text-xs font-semibold py-1.5 px-3 text-center border-b border-amber-500/20 overflow-hidden select-none">
      <div className="container mx-auto flex items-center justify-center gap-2 transition-all duration-500 transform animate-in fade-in slide-in-from-top-1">
        <Icon className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
        <span className="tracking-wider uppercase text-[11px] sm:text-xs">
          {Current.text}
        </span>
      </div>
    </div>
  );
}
