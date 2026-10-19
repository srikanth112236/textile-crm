'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Sparkles, ShoppingBag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ugcApi, UgcItem } from '@/lib/api/ugc';
import { formatPrice } from '@/lib/utils';

const FALLBACK = [
  { id: 'reel-1', customerName: '@rohit_fit', productName: 'Heavyweight Oversized Tee - Black', price: 799, rating: '4.9', likes: '1.4k', thumbnail: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', link: '/products' },
  { id: 'reel-2', customerName: '@vikram_style', productName: 'Textured Linen Short Kurta - White', price: 1299, rating: '4.8', likes: '2.1k', thumbnail: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80', link: '/products' },
  { id: 'reel-3', customerName: '@arjun_k', productName: 'Multi-Pocket Cargo Joggers - Beige', price: 1199, rating: '5.0', likes: '980', thumbnail: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80', link: '/products' },
  { id: 'reel-4', customerName: '@sameer_v', productName: 'Mandarin Collar Printed Shirt - Navy', price: 999, rating: '4.7', likes: '1.8k', thumbnail: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80', link: '/products' },
];

function productOf(item: UgcItem) {
  const p = item.productId;
  if (p && typeof p === 'object') {
    const img = (p as any).images?.[0];
    return { name: (p as any).name, price: (p as any).price, id: (p as any)._id, image: typeof img === 'string' ? img : img?.url };
  }
  return null;
}

export function UgcReels() {
  const [reels, setReels] = useState<UgcItem[] | null>(null);

  useEffect(() => {
    ugcApi.featured().then((items) => setReels(items.length > 0 ? items : [])).catch(() => setReels([]));
  }, []);

  const list = reels === null || reels.length === 0 ? null : reels;

  return (
    <section className="py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Social Proof & Style Inspiration
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            WORN BY THE COMMUNITY
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 sm:mt-0">
          See how real Mentoos customers style our oversized tees, kurtas, and joggers.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {list ? list.map((reel) => {
          const prod = productOf(reel);
          const thumb = reel.thumbnailUrl || reel.mediaUrl;
          return (
            <div key={reel._id} className="group relative h-96 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col justify-between p-4">
              <Image src={thumb} alt={prod?.name || reel.caption || 'Customer style'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/20" />
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-xs font-bold text-white bg-slate-900/80 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md">
                  {reel.customerName || (reel.source === 'instagram' ? '@mentoos' : '@mentoos_family')}
                </span>
                {(reel.likes || 0) > 0 && (
                  <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md">
                    <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                    {reel.likes}
                  </span>
                )}
              </div>
              <div className="relative z-10 my-auto mx-auto w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-xl">
                <Play className="w-5 h-5 ml-0.5 fill-current" />
              </div>
              <div className="relative z-10 space-y-2 bg-slate-900/90 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                {prod ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Community pick</span>
                      <span className="text-xs font-extrabold text-white">{formatPrice(prod.price)}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-100 truncate">{prod.name}</p>
                    <Link href={`/products/${prod.id}`} className="block">
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-1.5 rounded-lg">
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                        SHOP THIS LOOK
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-100 line-clamp-2">{reel.caption || 'Styled by the community'}</p>
                    <Link href={reel.permalink || '/products'} className="block" target={reel.permalink ? '_blank' : undefined}>
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-1.5 rounded-lg">
                        <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                        SHOP THIS LOOK
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        }) : FALLBACK.map((reel) => (
          <div key={reel.id} className="group relative h-96 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col justify-between p-4">
            <Image src={reel.thumbnail} alt={reel.productName} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/20" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-bold text-white bg-slate-900/80 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md">{reel.customerName}</span>
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md">
                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />{reel.likes}
              </span>
            </div>
            <div className="relative z-10 my-auto mx-auto w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-xl">
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </div>
            <div className="relative z-10 space-y-2 bg-slate-900/90 p-3 rounded-xl border border-white/10 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{reel.rating} rating</span>
                <span className="text-xs font-extrabold text-white">₹{reel.price}</span>
              </div>
              <p className="text-xs font-semibold text-slate-100 truncate">{reel.productName}</p>
              <Link href={reel.link} className="block">
                <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-1.5 rounded-lg">
                  <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                  SHOP THIS LOOK
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
