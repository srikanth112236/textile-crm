'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getRecentlyViewed } from '@/lib/recentlyViewed';
import { productsApi } from '@/lib/api/products';
import { ProductCard } from './ProductCard';

export function RecentlyViewed({ currentId }: { currentId: string }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const ids = getRecentlyViewed(currentId);
      if (ids.length === 0) return;
      try {
        const fetched = await Promise.all(
          ids.slice(0, 8).map((id) => productsApi.getProduct(id).then((r) => r.data).catch(() => null))
        );
        setProducts(fetched.filter(Boolean));
      } catch {
        // ignore — section hides when empty
      }
    })();
  }, [currentId]);

  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold tracking-tight">RECENTLY VIEWED</h2>
        <Link href="/products" className="text-xs font-bold text-amber-600 hover:underline">View all</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
