'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { useCart } from '@/lib/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { LoginModal } from '@/components/auth/LoginModal';
import { formatPrice } from '@/lib/utils';

interface FBTProps {
  productId: string;
  mainPrice: number;
  mainName: string;
  mainImage?: string;
}

// Frequently Bought Together — uses relatedProducts.frequentlyBoughtTogether,
// falls back to same-category recommendations when empty.
export function FrequentlyBoughtTogether({ productId, mainPrice, mainName, mainImage }: FBTProps) {
  const { addItem, requiresAuth } = useCart();
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const mine = await productsApi.getProduct(productId).then((r) => r.data).catch(() => null);
        let ids: string[] = ((mine as any)?.relatedProducts?.frequentlyBoughtTogether || []).map((x: any) => (typeof x === 'string' ? x : x?._id)).filter(Boolean);
        let list: any[] = [];
        if (ids.length > 0) {
          const fetched = await Promise.all(ids.slice(0, 3).map((id) => productsApi.getProduct(id).then((r) => r.data).catch(() => null)));
          list = fetched.filter(Boolean);
        } else {
          const rec = await productsApi.getRecommendations(productId, 3).catch(() => ({ data: [] as any[] }));
          list = (rec as any).data || [];
        }
        setItems(list);
        const init: Record<string, boolean> = {};
        list.forEach((p) => { init[p._id] = true; });
        setChecked(init);
      } catch {
        // hide section on error
      }
    })();
  }, [productId]);

  if (items.length === 0) return null;

  const selected = items.filter((p) => checked[p._id]);
  const total = mainPrice + selected.reduce((s, p) => s + (p.price || 0), 0);

  const handleAddAll = async () => {
    if (requiresAuth()) {
      setLoginOpen(true);
      return;
    }
    setAdding(true);
    try {
      for (const p of selected) {
        await addItem(p._id, 1);
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Frequently Bought Together</h3>
          <p className="text-[11px] text-muted-foreground">Complete the look — tick items, add once.</p>
        </div>
        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">
          Bundle & save vs MRP
        </span>
      </div>

      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        <div className="relative shrink-0 w-32 rounded-xl border bg-muted/40 p-2 text-center">
          {mainImage && <span className="relative block w-full h-24 rounded-lg overflow-hidden bg-muted"><Image src={mainImage} alt={mainName} fill className="object-cover" sizes="128px" /></span>}
          <p className="text-[11px] font-semibold line-clamp-2 mt-1.5 leading-tight">{mainName}</p>
          <p className="text-xs font-black mt-0.5">{formatPrice(mainPrice)}</p>
          <span className="absolute top-1.5 left-1.5 text-[10px] font-black bg-slate-900 text-white rounded-md px-1.5 py-0.5">THIS ITEM</span>
        </div>
        {items.map((p) => {
          const img = p.images?.[0];
          const url = typeof img === 'string' ? img : img?.url || '/placeholder-product.jpg';
          const on = !!checked[p._id];
          const mrp = p.compareAtPrice || p.mrp;
          return (
            <div key={p._id} className="flex items-stretch shrink-0">
              <div className="flex items-center px-0.5"><Plus className="w-4 h-4 text-muted-foreground" /></div>
              <button
                type="button"
                onClick={() => setChecked((c) => ({ ...c, [p._id]: !c[p._id] }))}
                aria-pressed={on}
                className={`relative w-32 rounded-xl border p-2 text-center transition-all ${on ? 'border-amber-500 bg-amber-500/5 shadow-sm' : 'bg-muted/40 opacity-75 hover:opacity-100'}`}
              >
                <span className="relative block w-full h-24 rounded-lg overflow-hidden bg-muted">
                  <Image src={url} alt={p.name} fill className="object-cover" sizes="128px" />
                </span>
                <span className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-md border flex items-center justify-center text-[11px] font-black ${on ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-white dark:bg-slate-900 text-transparent'}`}>✓</span>
                <p className="text-[11px] font-semibold line-clamp-2 mt-1.5 leading-tight">{p.name}</p>
                <p className="text-xs font-black mt-0.5">{formatPrice(p.price)} {mrp && mrp > p.price && <span className="font-medium text-muted-foreground line-through">{formatPrice(mrp)}</span>}</p>
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl bg-muted/50 px-3.5 py-2.5">
        <div className="text-sm">
          <span className="text-muted-foreground text-xs">Bundle total ({selected.length + 1} items): </span>
          <span className="font-black">{formatPrice(total)}</span>
        </div>
        <Button onClick={handleAddAll} disabled={adding || selected.length === 0} className="bg-slate-900 text-white font-bold rounded-xl text-xs">
          {adding ? 'Adding…' : `Add ${selected.length} to Cart`}
        </Button>
      </div>
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} title="Login to Shop" description="Login or register to add items. Only pincode check is available without login." />
    </div>
  );
}
