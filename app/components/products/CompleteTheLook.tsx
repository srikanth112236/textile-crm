'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { useCart } from '@/lib/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { LoginModal } from '@/components/auth/LoginModal';
import { formatPrice, cn } from '@/lib/utils';
import type { IProduct } from '@/lib/api/types';

// Complementary category map: viewing X → style it with Y (spec §12 outfit logic).
const COMPLEMENTS: Record<string, string[]> = {
  't-shirts': ['casual-trousers', 'joggers', 'shorts'],
  shirts: ['formal-trousers', 'casual-trousers'],
  'formal-trousers': ['shirts'],
  'casual-trousers': ['t-shirts', 'shirts'],
  trousers: ['shirts', 't-shirts'],
  joggers: ['t-shirts', 'gym-tshirts'],
  shorts: ['t-shirts', 'gym-tshirts'],
  'gym-tshirts': ['shorts', 'joggers'],
  'gym-vests': ['shorts', 'joggers'],
  activewear: ['shorts', 'joggers'],
  sweatshirts: ['joggers', 'casual-trousers'],
  jackets: ['t-shirts', 'shirts', 'casual-trousers'],
  kurta: ['kurta-pajama', 'nehru-jackets'],
  'kurta-pajama': ['nehru-jackets'],
  'nehru-jackets': ['kurta', 'kurta-pajama'],
  'ethnic-wear': ['kurta', 'nehru-jackets'],
  boxers: ['t-shirts', 'shorts'],
};

function mainColorOf(product: any): string {
  const attr = (product.variantAttributes || []).find((a: any) => String(a.name).toLowerCase() === 'color');
  const v = attr?.options?.[0]?.value || '';
  return String(v).toLowerCase();
}

function firstAvailableSize(product: any): string | undefined {
  const sizes: string[] =
    (product.variantAttributes || []).find((a: any) => String(a.name).toLowerCase() === 'size')?.options?.map((o: any) => o.value) || [];
  const soldOut = new Set<string>();
  for (const sku of (product.variantSKUs || []) as any[]) {
    const attrs = sku.attributes instanceof Map ? Object.fromEntries(sku.attributes) : sku.attributes || {};
    const sz = attrs.Size || attrs.size;
    if (sz && (sku.stock || 0) <= 0 && sku.isEnabled !== false) soldOut.add(String(sz).toUpperCase());
  }
  return sizes.find((s) => !soldOut.has(s.toUpperCase()));
}

function imgOf(p: any): string {
  const img = p.images?.[0];
  const url = typeof img === 'string' ? img : img?.url || '/placeholder-product.jpg';
  return url.includes('/uploads/') ? `/api/images${url}` : url;
}

// Complete the Look — outfit complements for the viewed product (§12):
// Black T-Shirt → Casual Trouser + more, with ADD ALL TO CART.
export function CompleteTheLook({ productId }: { productId: string }) {
  const { addItem, requiresAuth } = useCart();
  const { toast } = useToast();
  const [loginOpen, setLoginOpen] = useState(false);
  const [main, setMain] = useState<any>(null);
  const [picks, setPicks] = useState<any[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mine: any = await productsApi.getProduct(productId).then((r) => r.data).catch(() => null);
        if (!mine || cancelled) return;
        setMain(mine);
        const slug = typeof mine.category === 'object' ? mine.category?.slug : undefined;
        const cats = COMPLEMENTS[slug || ''] || ['t-shirts', 'shirts'];
        const batches = await Promise.all(
          cats.map((c) =>
            productsApi
              .getProducts({ category: c, status: 'active', limit: 6, sort: 'rating', order: 'desc' })
              .then((r) => r.data || [])
              .catch(() => [])
          )
        );
        const seen = new Set<string>([mine._id]);
        const pool: any[] = [];
        for (const list of batches) {
          for (const p of list) {
            if (!seen.has(p._id)) {
              seen.add(p._id);
              pool.push(p);
            }
          }
        }
        // Color affinity first (same color family as viewed item), then rating.
        const mc = mainColorOf(mine);
        pool.sort((a, b) => {
          const sa = mc && mainColorOf(a).includes(mc) ? 0 : 1;
          const sb = mc && mainColorOf(b).includes(mc) ? 0 : 1;
          if (sa !== sb) return sa - sb;
          return (b.averageRating || 0) - (a.averageRating || 0);
        });
        const top = pool.slice(0, 3);
        if (!cancelled) {
          setPicks(top);
          const init: Record<string, boolean> = { [mine._id]: true };
          top.forEach((p) => { init[p._id] = true; });
          setChecked(init);
        }
      } catch {
        // hide section on error
      }
    })();
    return () => { cancelled = true; };
  }, [productId]);

  if (!main || picks.length === 0) return null;

  const all = [main, ...picks];
  const selected = all.filter((p) => checked[p._id]);
  const total = selected.reduce((s, p) => s + (p.price || 0), 0);

  const handleAddAll = async () => {
    if (requiresAuth()) {
      setLoginOpen(true);
      return;
    }
    setAdding(true);
    try {
      for (const p of selected) {
        const size = firstAvailableSize(p);
        await addItem(p._id, 1, size ? [{ name: 'Size', value: size }] : undefined);
      }
      toast({ title: 'Look added to cart', description: `${selected.length} item(s) • ${formatPrice(total)}` });
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border bg-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Complete the Look</h3>
            <p className="text-[11px] text-muted-foreground">Styled to match — tick items, add the whole outfit at once.</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">
            {selected.length} items • {formatPrice(total)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {all.map((p, i) => {
            const on = !!checked[p._id];
            return (
              <button
                key={p._id}
                onClick={() => setChecked((c) => ({ ...c, [p._id]: !c[p._id] }))}
                className={cn(
                  'relative rounded-xl border overflow-hidden text-left transition-all',
                  on ? 'border-amber-500 shadow-md' : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                )}
              >
                <div className="relative aspect-square bg-muted">
                  <Image src={imgOf(p)} alt={p.name} fill className="object-cover" sizes="25vw" />
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">THIS ITEM</span>
                  )}
                  <span className={cn('absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center border', on ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-white/80 border-slate-300')}>
                    {on && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-semibold line-clamp-1">{p.name}</p>
                  <p className="text-xs font-extrabold">{formatPrice(p.price)}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleAddAll}
          disabled={adding || selected.length === 0}
          className="w-full bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-extrabold text-sm rounded-xl py-6"
        >
          <Plus className="mr-2 h-4 w-4" />
          {adding ? 'Adding…' : `ADD ALL TO CART (${selected.length})`}
        </Button>
      </div>
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} title="Login to Shop" description="Login or register to add the look to your cart." />
    </>
  );
}
