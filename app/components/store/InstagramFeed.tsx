'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Instagram, ExternalLink } from 'lucide-react';
import { ugcApi, UgcItem } from '@/lib/api/ugc';

// Instagram / social commerce strip. Loads lazily AFTER main content so the
// social API can never slow the page (doc §14). Static fallback tiles keep
// the section visible when the UGC feed is still empty.
const FALLBACK_TILES = [
  { href: '/products?category=t-shirts', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80', label: 'Oversized Tees' },
  { href: '/products?category=shirts', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80', label: 'Linen Shirts' },
  { href: '/products?category=joggers', img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=400&q=80', label: 'Cargo Joggers' },
  { href: '/products?category=ethnic-wear', img: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=400&q=80', label: 'Festive Kurtas' },
  { href: '/products?category=trousers', img: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=400&q=80', label: 'Tailored Trousers' },
  { href: '/products?category=activewear', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80', label: 'Gym Performance' },
];

export function InstagramFeed() {
  const [items, setItems] = useState<UgcItem[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      ugcApi.feed().then((feed) => setItems(feed)).catch(() => setItems([]));
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // While loading (SSR + first 1.5s) render nothing to protect LCP; after
  // that, real posts or static fallback — the section never stays blank.
  if (items === null) return null;
  const tiles = items.length > 0 ? null : FALLBACK_TILES;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-pink-500 flex items-center gap-1.5">
            <Instagram className="w-3.5 h-3.5" /> @mentoos on Instagram
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">SHOP THE FEED</h2>
        </div>
        <Link href="https://instagram.com" target="_blank" className="text-xs font-bold text-pink-500 hover:underline flex items-center gap-1">
          Follow <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {tiles
          ? tiles.map((tile) => (
              <Link key={tile.label} href={tile.href}>
                <div className="group relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <Image src={tile.img} alt={tile.label} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="20vw" loading="lazy" />
                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/50 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-[11px] font-bold text-center px-2 transition-opacity">
                      {tile.label} — Shop now
                    </span>
                  </div>
                </div>
              </Link>
            ))
          : items!.slice(0, 6).map((item) => {
          const prod = typeof item.productId === 'object' ? (item.productId as any) : null;
          const inner = (
            <div className="group relative aspect-square rounded-xl overflow-hidden bg-muted">
              <Image src={item.thumbnailUrl || item.mediaUrl} alt={item.caption || 'Instagram post'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="20vw" loading="lazy" />
              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/50 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-[11px] font-bold text-center px-2 transition-opacity">
                  {prod ? `${prod.name} — Shop now` : 'View post'}
                </span>
              </div>
            </div>
          );
          return prod ? <Link key={item._id} href={`/products/${prod._id}`}>{inner}</Link>
            : item.permalink ? <Link key={item._id} href={item.permalink} target="_blank">{inner}</Link>
            : <div key={item._id}>{inner}</div>;
        })}
      </div>
    </section>
  );
}
