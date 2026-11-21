'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, BadgeCheck, Quote, Sparkles, CheckCircle2, ShieldCheck, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const VERIFIED_REVIEWS = [
  {
    id: 'rev-1',
    author: 'Vikramaditya S.',
    city: 'Bengaluru',
    rating: 5,
    date: '3 days ago',
    verified: true,
    title: 'Zero collar curl after 14 machine washes',
    comment:
      'Most oversized tees in India lose their neckline ribbing after 3 washes and balloon out at the belly. Mentoos 240 GSM combed cotton actually holds its heavy boxy drape. Worth every rupee.',
    productName: 'Heavyweight Boxy Tee - Jet Black',
    productPrice: '₹899',
    productLink: '/products',
    helpfulCount: 42,
  },
  {
    id: 'rev-2',
    author: 'Kunal Deshmukh',
    city: 'Mumbai',
    rating: 5,
    date: '1 week ago',
    verified: true,
    title: 'Breathes in 38°C coastal heat without itchiness',
    comment:
      'Pure French flax linen is hard to find at this price point. Wore this to a coastal wedding weekend — extremely breathable, zero sweat rings, and the relaxed camp collar looks effortless.',
    productName: 'Relaxed Cuban Linen Shirt - Sage',
    productPrice: '₹1,399',
    productLink: '/products',
    helpfulCount: 38,
  },
  {
    id: 'rev-3',
    author: 'Arjun Nambiar',
    city: 'New Delhi',
    rating: 5,
    date: '2 weeks ago',
    verified: true,
    title: 'Calibrated for broad Indian shoulders',
    comment:
      'Finding shirts that fit wide shoulders without turning into a sack around the waist was impossible until now. The shoulder drop and chest taper are calibrated to perfection.',
    productName: 'Tailored Pleated Trousers - Cream',
    productPrice: '₹1,499',
    productLink: '/products',
    helpfulCount: 56,
  },
];

const METRICS = [
  { value: '4.9 / 5.0', label: 'Average Customer Rating', note: 'Based on 4,800+ reviews' },
  { value: '42,000+', label: 'Verified Indian Men Styled', note: 'Pan-India deliveries' },
  { value: '96.4%', label: 'Repeat Customer Rate', note: 'Reordered within 60 days' },
  { value: '0% Shrink', label: 'Pre-Shrunk Bio-Washed', note: 'Zero neckline sag guarantee' },
];

export function CustomerReviews({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby="customer-reviews-title" className={compact ? 'py-2' : 'py-6'}>
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Verified Customer Proof
          </span>
          <h2
            id="customer-reviews-title"
            className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white"
          >
            REAL MEN. REAL EXPERIENCES.
          </h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Hear from men who switched to Mentoos for dense fabrics, clean shoulder drapes, and long-lasting garments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex text-amber-400">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs font-black text-neutral-900 dark:text-white">
            4.9 / 5.0 (4,800+ Reviews)
          </span>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 rounded-2xl border border-neutral-200/80 bg-sand/40 p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
        {METRICS.map((m, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              {m.value}
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-0.5">
              {m.label}
            </span>
            <span className="text-[10px] text-neutral-500 mt-0.5">{m.note}</span>
          </div>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {VERIFIED_REVIEWS.map((r) => (
          <div
            key={r.id}
            className="relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div>
              {/* Star Rating & Quote Icon */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-0.5 text-amber-400">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="h-4 w-4 text-amber-500/40" />
              </div>

              {/* Review Headline & Body */}
              <h4 className="text-sm font-black text-neutral-900 dark:text-white">
                "{r.title}"
              </h4>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {r.comment}
              </p>
            </div>

            {/* Author Footer & Linked Product */}
            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                  <span>{r.author}</span>
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-[10px] text-neutral-400">{r.city} • {r.date}</span>
              </div>

              <Link
                href={r.productLink}
                className="flex items-center justify-between text-[11px] font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400"
              >
                <span className="truncate">Purchased: {r.productName}</span>
                <span className="font-bold shrink-0">{r.productPrice}</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
