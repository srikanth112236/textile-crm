'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { shopLookApi, ShopLook } from '@/lib/api/shopLook';
import { ShopLookShowcase } from './ShopLookShowcase';

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
      <section id="shop-the-look" className="py-8 bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden my-6">
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

  return (
    <ShopLookShowcase
      id="shop-the-look"
      className="my-6"
      look={selectedLook}
      looks={looks || []}
      onSelect={setSelectedId}
      onAddAll={handleAddAll}
      adding={adding}
      added={added}
    />
  );
}
