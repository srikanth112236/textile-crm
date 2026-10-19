'use client';

import { Truck, ShieldCheck, RefreshCw, Award } from 'lucide-react';

const BADGES = [
  {
    icon: Truck,
    title: 'FREE EXPRESS SHIPPING',
    description: 'On all orders above ₹999 across India with real-time tracking.',
  },
  {
    icon: ShieldCheck,
    title: 'COD & ONLINE PAYMENTS',
    description: 'Pay via UPI, Cards, NetBanking, or COD with ₹99 confirmation deposit.',
  },
  {
    icon: RefreshCw,
    title: 'EASY 7-DAY EXCHANGES',
    description: 'Hassle-free size exchange and door-step doorstep pickup.',
  },
  {
    icon: Award,
    title: 'PREMIUM QUALITY FABRIC',
    description: '100% combed cotton, shrink-tested, & bio-washed for lasting comfort.',
  },
];

export function TrustBadges() {
  return (
    <section className="py-8 my-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {BADGES.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  {badge.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
