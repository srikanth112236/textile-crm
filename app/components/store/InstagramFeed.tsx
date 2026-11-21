'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Instagram, ArrowUpRight, Sparkles, Heart } from 'lucide-react';

const INSTAGRAM_TILES = [
  {
    href: '/products?category=t-shirts',
    img: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=80',
    handle: '@mentoos.official',
    likes: '1.8K',
    label: 'Heavyweight Boxy Tee',
  },
  {
    href: '/products?category=shirts',
    img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80',
    handle: '@mentoos.official',
    likes: '2.4K',
    label: 'Resort Linen Shirt',
  },
  {
    href: '/products?category=joggers',
    img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80',
    handle: '@mentoos.official',
    likes: '3.1K',
    label: 'Utility Cargo Pants',
  },
  {
    href: '/products?category=ethnic-wear',
    img: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80',
    handle: '@mentoos.official',
    likes: '2.9K',
    label: 'Slub Short Kurta',
  },
  {
    href: '/products?category=trousers',
    img: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=600&q=80',
    handle: '@mentoos.official',
    likes: '1.5K',
    label: 'Pleated Trousers',
  },
  {
    href: '/products?category=activewear',
    img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    handle: '@mentoos.official',
    likes: '2.1K',
    label: 'Honeycomb Active Polo',
  },
];

export function InstagramFeed() {
  return (
    <section aria-labelledby="instagram-feed-title" className="py-4">
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-rose-600">
            <Instagram className="h-3.5 w-3.5" />
            Live Lookbook Feed
          </span>
          <h2
            id="instagram-feed-title"
            className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white"
          >
            JOIN OUR COMMUNITY ON INSTAGRAM
          </h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Daily styling drops, behind-the-scenes fabric tests, and lookbook edits. Follow @mentoos.official.
          </p>
        </div>

        <Link
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 transition-colors"
        >
          Follow @mentoos.official
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* 6 Seamless Compact Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {INSTAGRAM_TILES.map((tile, i) => (
          <Link
            key={i}
            href={tile.href}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800 shadow-sm"
          >
            <Image
              src={tile.img}
              alt={tile.label}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
            />
            {/* Scrim overlay */}
            <div className="absolute inset-0 bg-neutral-950/0 transition-colors duration-300 group-hover:bg-neutral-950/60 flex flex-col justify-between p-3" />

            {/* Top Instagram icon */}
            <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
                <Instagram className="h-3.5 w-3.5" />
              </span>
            </div>

            {/* Bottom Card Copy on Hover */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity space-y-0.5 text-white">
              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-bold">
                <Heart className="h-3 w-3 fill-amber-300" />
                <span>{tile.likes}</span>
              </div>
              <p className="text-xs font-black truncate">{tile.label}</p>
              <span className="text-[10px] text-white/70 block">Shop Product →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
