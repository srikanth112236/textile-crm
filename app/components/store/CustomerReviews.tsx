'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, BadgeCheck, Quote } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface FeaturedReview {
  rating: number;
  comment: string;
  userName?: string;
  verifiedPurchase: boolean;
  productId: string;
  productName: string;
  productPrice: number;
}

// Homepage social proof — REAL CUSTOMERS. REAL STYLE. (doc §4.9, §13)
export function CustomerReviews() {
  const [reviews, setReviews] = useState<FeaturedReview[] | null>(null);

  useEffect(() => {
    productsApi.getFeaturedReviews(6).then((r) => setReviews(r.data || [])).catch(() => setReviews([]));
  }, []);

  if (reviews === null) {
    return (
      <section className="py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className="py-8">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">Social Proof</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">REAL CUSTOMERS. REAL STYLE.</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <Card key={`${r.productId}-${i}`} className="rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <Quote className="w-5 h-5 text-amber-500" />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <p className="text-sm line-clamp-3">{r.comment}</p>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {r.userName || 'Verified Buyer'}
                {r.verifiedPurchase && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              <Link href={`/products/${r.productId}`} className="block text-xs text-muted-foreground hover:text-amber-600 truncate">
                on {r.productName} →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
