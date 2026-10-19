'use client';

import { ProductCard } from '@/components/products/ProductCard';
import type { IProduct } from '@/lib/api/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface FeaturedProductsProps {
  products: IProduct[];
  title?: string;
  showViewAll?: boolean;
}

export function FeaturedProducts({ products, title = 'Featured Products', showViewAll = true }: FeaturedProductsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
        {showViewAll && (
          <Link href="/products">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

