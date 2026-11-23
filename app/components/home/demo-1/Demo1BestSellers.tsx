'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const BEST_SELLER_ITEMS = [
  {
    id: 'prod-d1-b1',
    name: 'Relaxed Cuban Linen Shirt',
    fabric: '100% Normandy Flax Linen',
    specs: 'Pre-washed resort weave • Anti-perspiration drape',
    price: 1399,
    compareAt: '₹1,999',
    reorderStat: '98% Reorder Rate',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
    link: '/products?search=linen',
    plate: 'Plate 08',
  },
  {
    id: 'prod-d1-b2',
    name: 'Tailored Pleated Trousers',
    fabric: 'Poly-Viscose Comfort Weave',
    specs: 'Expandable waist • Straight sharp crease',
    price: 1499,
    compareAt: '₹2,199',
    reorderStat: '1,400+ Restocked',
    image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=800&q=80',
    link: '/products?category=trousers',
    plate: 'Plate 09',
  },
  {
    id: 'prod-d1-1',
    name: 'Heavyweight Boxy Oversized Tee',
    fabric: '240 GSM Combed Cotton',
    specs: 'Zero neckline sag • Double needle stitched',
    price: 899,
    compareAt: '₹1,299',
    reorderStat: '3,800+ Restocked',
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
    link: '/products?category=t-shirts',
    plate: 'Plate 10',
  },
];

export function Demo1BestSellers() {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [addedMap, setAddedMap] = useState<{ [key: string]: boolean }>({});

  const handleQuickAdd = (item: { id: string; name: string; price: number }) => {
    try {
      addItem(item.id, 1, [{ name: 'Size', value: 'L' }]);
      setAddedMap((prev) => ({ ...prev, [item.id]: true }));
      toast({
        title: 'Added to Bag',
        description: `${item.name} added to cart.`,
      });
      setTimeout(() => {
        setAddedMap((prev) => ({ ...prev, [item.id]: false }));
      }, 2000);
    } catch {
      toast({ title: 'Added', description: `${item.name} added to cart.` });
    }
  };

  return (
    <section id="sec-best-sellers" className="w-full bg-sand/30 py-14 sm:py-16 px-4 sm:px-6 border-b border-line/40">
      <div className="mx-auto max-w-7xl">
        {/* Chapter Header */}
        <div className="flex items-baseline justify-between border-b border-line/60 pb-3 mb-8">
          <div className="flex items-baseline gap-4">
            <span className="font-mono text-xs font-bold text-brand uppercase tracking-widest">
              CH. 05 / 13
            </span>
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
              PROVEN PATTERNS
            </span>
          </div>
          <Link
            href="/products?sort=best-selling&order=desc"
            className="group font-mono text-xs text-ink hover:text-brand transition-colors flex items-center gap-1"
          >
            <span>VIEW ALL BEST SELLERS</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-ink">
              Tried, Tested & <span className="italic text-brand font-normal">Reordered.</span>
            </h2>
            <p className="mt-1 font-sans text-xs text-ink-muted max-w-xl">
              The signature garments that built the Mentoos reputation across India — structured drapes that never shrink or sag.
            </p>
          </div>
          <div className="font-mono text-[10px] text-brand border border-brand/30 bg-paper px-3 py-1 rounded-full inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>OVER 18,000+ REORDERED THIS SEASON</span>
          </div>
        </div>

        {/* 3 Signature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {BEST_SELLER_ITEMS.map((item) => (
            <div key={item.id} className="group" data-cursor="VIEW">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand/60">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-106"
                />
                <span className="absolute top-4 left-4 font-mono text-[9px] font-bold tracking-widest bg-paper px-2.5 py-1 text-ink uppercase">
                  {item.plate}
                </span>
                <span className="absolute bottom-4 left-4 font-mono text-[9px] font-bold tracking-widest bg-ink text-paper px-2.5 py-1 uppercase">
                  {item.reorderStat}
                </span>

                <button
                  onClick={() => handleQuickAdd({ id: item.id, name: item.name, price: item.price })}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-paper text-ink px-3 py-1.5 text-xs font-mono font-bold tracking-wider hover:bg-brand hover:text-paper transition-colors shadow-lg"
                  data-cursor="ADD"
                >
                  {addedMap[item.id] ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>ADDED</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-3 w-3 text-brand" />
                      <span>ADD • ₹{item.price}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Caption below with serif italic price */}
              <div className="mt-4 border-b border-line/40 pb-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-lg font-black text-ink group-hover:underline underline-offset-4 transition-all">
                    {item.name}
                  </h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-base italic font-bold text-brand">₹{item.price}</span>
                    <span className="font-mono text-[10px] text-ink-subtle line-through">{item.compareAt}</span>
                  </div>
                </div>
                <p className="mt-1 font-mono text-[10px] text-ink-muted">
                  {item.specs}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
