'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Sparkles, ShoppingBag, Heart, Volume2, Share2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

const COMMUNITY_REELS = [
  {
    id: 'reel-1',
    creator: '@arjun_street',
    creatorCity: 'Mumbai',
    caption: 'How to style a 240 GSM oversized boxy tee for monsoon humidity 🌧️',
    views: '48.2K',
    likes: '4.2K',
    productName: 'Heavyweight Boxy Tee - Jet Black',
    productPrice: 899,
    compareAtPrice: 1299,
    fabric: '240 GSM Combed Cotton',
    thumbnail: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=80',
    link: '/products',
  },
  {
    id: 'reel-2',
    creator: '@rohit_tailored',
    creatorCity: 'Bengaluru',
    caption: 'Pure linen shirts vs cheap poly blends. The drape test! 🌿',
    views: '32.1K',
    likes: '3.1K',
    productName: 'Relaxed Cuban Linen Shirt - Sage',
    productPrice: 1399,
    compareAtPrice: 1999,
    fabric: '100% Normandy Flax Linen',
    thumbnail: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80',
    link: '/products',
  },
  {
    id: 'reel-3',
    creator: '@kabir_fits',
    creatorCity: 'Delhi',
    caption: '6-Pocket cargo joggers with sneakers rotation 🔥',
    views: '65.4K',
    likes: '5.8K',
    productName: 'Multi-Pocket Cargo Joggers - Olive',
    productPrice: 1299,
    compareAtPrice: 1799,
    fabric: '4-Way Stretch Cotton Twill',
    thumbnail: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80',
    link: '/products',
  },
  {
    id: 'reel-4',
    creator: '@aditya_festive',
    creatorCity: 'Jaipur',
    caption: 'Modern festive kurta styling that doesn’t feel traditionalist ✨',
    views: '29.7K',
    likes: '2.9K',
    productName: 'Textured Slub Short Kurta - Mustard',
    productPrice: 1199,
    compareAtPrice: 1599,
    fabric: 'Handloom Slub Cotton',
    thumbnail: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80',
    link: '/products',
  },
];

export function UgcReels({ compact = false }: { compact?: boolean }) {
  const [likedReels, setLikedReels] = useState<{ [key: string]: boolean }>({});

  const toggleLike = (id: string) => {
    setLikedReels((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section aria-labelledby="community-reels-title" className={compact ? 'py-2' : 'py-6'}>
      {/* Editorial Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Real Motion Proof
          </span>
          <h2
            id="community-reels-title"
            className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl dark:text-white"
          >
            STYLED BY THE COMMUNITY
          </h2>
          <p className="mt-1 max-w-xl text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Watch real customers wear, style, and wash test Mentoos garments across India.
          </p>
        </div>

        <span className="text-xs font-bold text-neutral-500">
          Tag #MentoosFit to get featured
        </span>
      </div>

      {/* 4 Vertical Reel Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
        {COMMUNITY_REELS.map((reel) => {
          const isLiked = likedReels[reel.id];
          return (
            <div
              key={reel.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] border border-neutral-800 bg-neutral-950 aspect-[9/16] p-3.5 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Background Model Image */}
              <Image
                src={reel.thumbnail}
                alt={reel.productName}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-black/30" />

              {/* Top Meta Bar */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="rounded-full bg-neutral-950/70 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-md border border-white/10">
                  {reel.creator}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium backdrop-blur-md">
                    <Eye className="h-3 w-3 text-neutral-300" />
                    {reel.views}
                  </span>
                </div>
              </div>

              {/* Center Play Button Overlay */}
              <div className="relative z-10 my-auto flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md border border-white/30 transition-all duration-300 group-hover:scale-115 group-hover:bg-amber-400 group-hover:text-neutral-950 shadow-lg">
                  <Play className="h-5 w-5 ml-0.5 fill-current" />
                </div>
              </div>

              {/* Bottom Garment Quick Tag */}
              <div className="relative z-10 space-y-2">
                {/* Reel Caption */}
                <p className="text-[11px] font-medium line-clamp-2 leading-snug text-neutral-200">
                  {reel.caption}
                </p>

                {/* Garment Tag Box */}
                <div className="rounded-xl border border-white/15 bg-neutral-950/90 p-2.5 backdrop-blur-md space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">
                      {reel.fabric}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleLike(reel.id)}
                      className="flex items-center gap-1 text-[10px] text-neutral-300 hover:text-rose-400"
                    >
                      <Heart
                        className={`h-3.5 w-3.5 transition-colors ${
                          isLiked ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'
                        }`}
                      />
                      <span>{reel.likes}</span>
                    </button>
                  </div>

                  <p className="text-xs font-black truncate text-white">
                    {reel.productName}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-black text-white">
                      ₹{reel.productPrice}
                    </span>
                    <Link
                      href={reel.link}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-400 hover:bg-amber-300 px-2.5 py-1 text-[10px] font-black uppercase text-neutral-950 transition-colors"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      Shop Fit
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
