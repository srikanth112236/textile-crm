'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Check, Sparkles, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { shopLookApi, ShopLook } from '@/lib/api/shopLook';
import { formatPrice } from '@/lib/utils';

const FALLBACK = [
  {
    _id: 'fallback-1',
    title: 'THE URBAN STREETSET',
    description: 'Black Heavyweight Oversized Tee paired with Beige Relaxed Cargo Joggers.',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
    productIds: [],
  },
  {
    _id: 'fallback-2',
    title: 'THE FESTIVE ELEGANCE',
    description: 'White Textured Linen Short Kurta paired with Maroon Nehru Waistcoat.',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    productIds: [],
  },
];

export function ShopTheLook() {
  const { addItem, requiresAuth } = useCart();
  const router = useRouter();
  const [looks, setLooks] = useState<ShopLook[] | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    shopLookApi.list().then((data) => {
      if (data.length > 0) {
        setLooks(data);
        setSelectedId(data[0]._id);
      } else {
        setLooks([]);
      }
    }).catch(() => setLooks([]));
  }, []);

  const selectedLook = looks && looks.length > 0 ? looks.find((l) => l._id === selectedId) || looks[0] : null;

  const handleAddAll = async () => {
    if (!selectedLook || selectedLook.productIds.length === 0) return;
    if (requiresAuth()) {
      router.push('/login?callbackUrl=/');
      return;
    }
    setAdding(true);
    try {
      for (const p of selectedLook.productIds) {
        await addItem(p._id, 1);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } finally {
      setAdding(false);
    }
  };

  // Loading: render fallback static looks (never blank, never blocking)
  const showFallback = looks !== null && looks.length === 0;

  if (showFallback) {
    return (
      <section className="py-8 bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden my-6">
        <div className="relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Complete Outfit Styling
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1">SHOP THE COMPLETE LOOK</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {FALLBACK.map((look) => (
              <div key={look._id} className="relative h-64 rounded-2xl overflow-hidden border border-slate-700/60">
                <Image src={look.imageUrl} alt={look.title} fill className="object-cover" sizes="50vw" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-extrabold">{look.title}</h3>
                  <p className="text-xs text-slate-300">{look.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!selectedLook) return null;

  const total = selectedLook.productIds.reduce((s, p) => s + (p.price || 0), 0);
  const bundle = selectedLook.bundlePrice && selectedLook.bundlePrice < total ? selectedLook.bundlePrice : total;
  const savings = total - bundle;

  return (
    <section className="py-8 bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden my-6">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <div className="w-full lg:w-1/2 relative h-[420px] sm:h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 group">
          <Image
            src={selectedLook.imageUrl}
            alt={selectedLook.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          {savings > 0 && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-amber-500 text-slate-950 font-bold px-3 py-1 text-xs tracking-wider">
                SAVE {formatPrice(savings)} BUNDLE OFFER
              </Badge>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{selectedLook.title}</h3>
            {selectedLook.description && <p className="text-xs text-slate-300 mt-1">{selectedLook.description}</p>}
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Complete Outfit Styling
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">SHOP THE COMPLETE LOOK</h2>
          </div>

          <div className="flex gap-3 flex-wrap">
            {looks!.map((look) => (
              <button
                key={look._id}
                onClick={() => setSelectedId(look._id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedLook._id === look._id
                    ? 'border-amber-400 bg-amber-500/10 text-white font-semibold'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs block font-bold truncate max-w-[160px]">{look.title}</span>
                <span className="text-xs text-amber-400 font-extrabold">{look.productIds.length} items</span>
              </button>
            ))}
          </div>

          <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              Items Included in this Look:
            </h4>
            {selectedLook.productIds.map((item) => (
              <Link key={item._id} href={`/products/${item._id}`} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/80 last:border-none hover:text-amber-300">
                <span className="font-medium text-slate-200">{item.name}</span>
                <span className="font-bold text-white">{formatPrice(item.price)}</span>
              </Link>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400">{formatPrice(bundle)}</span>
                {savings > 0 && <span className="text-base text-slate-500 line-through">{formatPrice(total)}</span>}
              </div>
              {savings > 0 && <p className="text-xs text-emerald-400 font-semibold">Instant {formatPrice(savings)} Combo Discount Applied</p>}
            </div>

            <Button
              size="lg"
              onClick={handleAddAll}
              disabled={adding || selectedLook.productIds.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-6 rounded-2xl text-sm transition-all hover:scale-105"
            >
              {added ? (
                <><Check className="w-5 h-5 mr-2" /> ADDED TO CART</>
              ) : (
                <><ShoppingBag className="w-5 h-5 mr-2" /> {adding ? 'ADDING…' : 'ADD ALL TO CART'}</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
