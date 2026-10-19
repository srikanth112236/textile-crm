'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { productsApi } from '@/lib/api/products';
import type { IProduct as Product } from '@/lib/api/types';
import { formatPrice } from '@/lib/utils';
import { AddToCartButton } from './AddToCartButton';
import { WishlistButton } from './WishlistButton';
import { useAuth } from '@/lib/hooks/useAuth';
import { TrendingUp, Clock, Sparkles } from 'lucide-react';

interface RecommendationsProps {
  productId: string;
  limit?: number;
  showTabs?: boolean; // Phase 8: Show personalized/trending tabs
}

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  limit: number;
}

// Reusable product grid component
const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, limit }) => {
  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].slice(0, limit).map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recommendations available at this time.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow group">
          <div className="relative">
            <Link href={`/products/${product._id}`}>
              <div className="relative h-48 w-full bg-muted">
                {product.images && product.images.length > 0 && (
                  <Image
                    src={getImageUrl(product.images[0])}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                )}
              </div>
            </Link>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <WishlistButton productId={product._id} />
            </div>
            {/* Phase 8: Show tags if available */}
            {product.tags && product.tags.length > 0 && (
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {(product.tags as any[]).slice(0, 2).map((tag: any) => (
                  <span
                    key={tag._id || tag}
                    className="text-xs px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm"
                  >
                    {typeof tag === 'object' ? tag.name : tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <Link href={`/products/${product._id}`}>
              <h3 className="font-semibold mb-2 line-clamp-2 hover:underline">{product.name}</h3>
            </Link>
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold">{formatPrice(product.price)}</span>
              {product.averageRating && product.averageRating > 0 && (
                <span className="text-sm text-muted-foreground">
                  ⭐ {product.averageRating.toFixed(1)}
                </span>
              )}
            </div>
            <AddToCartButton
              productId={product._id}
              className="w-full"
              size="sm"
              disabled={product.stock === 0 || product.status !== 'active'}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const Recommendations: React.FC<RecommendationsProps> = ({
  productId,
  limit = 4,
  showTabs = true, // Phase 8: Default to showing tabs
}) => {
  const { isAuthenticated } = useAuth();
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [personalizedProducts, setPersonalizedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [activeTab, setActiveTab] = useState('similar');

  useEffect(() => {
    fetchSimilarRecommendations();
    if (isAuthenticated && showTabs) {
      fetchPersonalizedRecommendations();
      fetchTrendingProducts();
      fetchRecentlyViewed();
    }
  }, [productId, isAuthenticated]);

  const fetchSimilarRecommendations = async () => {
    try {
      setLoadingSimilar(true);
      const response = await productsApi.getRecommendations(productId, limit);
      if (response.success && response.data.length > 0) {
        setSimilarProducts(response.data);
        return;
      }
      // Fallback: trending fills the tab instead of a dead empty state.
      const trending = await productsApi.getTrendingProducts(limit);
      if (trending.success) setSimilarProducts(trending.data);
    } catch (error) {
      try {
        const trending = await productsApi.getTrendingProducts(limit);
        if (trending.success) setSimilarProducts(trending.data);
      } catch {
        console.error('Failed to fetch recommendations:', error);
      }
    } finally {
      setLoadingSimilar(false);
    }
  };

  const fetchPersonalizedRecommendations = async () => {
    try {
      setLoadingPersonalized(true);
      const response = await productsApi.getPersonalizedRecommendations(limit);
      if (response.success) {
        setPersonalizedProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch personalized recommendations:', error);
    } finally {
      setLoadingPersonalized(false);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      setLoadingTrending(true);
      const response = await productsApi.getTrendingProducts(limit);
      if (response.success) {
        setTrendingProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch trending products:', error);
    } finally {
      setLoadingTrending(false);
    }
  };

  const fetchRecentlyViewed = async () => {
    try {
      setLoadingRecent(true);
      const response = await productsApi.getRecentlyViewed(limit);
      if (response.success && response.data.length > 0) {
        setRecentlyViewed(response.data);
        setLoadingRecent(false);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch recently viewed:', error);
    }
    // Fallback: local browsing history (works for guests + fresh accounts).
    try {
      const { getRecentlyViewed } = await import('@/lib/recentlyViewed');
      const ids = getRecentlyViewed(productId).slice(0, limit);
      if (ids.length === 0) return;
      const fetched = await Promise.all(
        ids.map((id) => productsApi.getProduct(id).then((r) => r.data).catch(() => null))
      );
      setRecentlyViewed(fetched.filter(Boolean) as Product[]);
    } catch {
      // ignore — tab shows empty state
    } finally {
      setLoadingRecent(false);
    }
  };

  // If not authenticated or tabs disabled, show simple recommendations
  if (!isAuthenticated || !showTabs) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <ProductGrid products={similarProducts} loading={loadingSimilar} limit={limit} />
      </div>
    );
  }

  // Show tabs for authenticated users
  return (
    <div className="py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-bold">Discover More</h2>
          <TabsList>
            <TabsTrigger value="similar">Similar Products</TabsTrigger>
            <TabsTrigger value="personalized">
              <Sparkles className="mr-2 h-4 w-4" />
              For You
            </TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="recent">
              <Clock className="mr-2 h-4 w-4" />
              Recently Viewed
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="similar">
          <ProductGrid products={similarProducts} loading={loadingSimilar} limit={limit} />
        </TabsContent>

        <TabsContent value="personalized">
          <ProductGrid products={personalizedProducts} loading={loadingPersonalized} limit={limit} />
        </TabsContent>

        <TabsContent value="trending">
          <ProductGrid products={trendingProducts} loading={loadingTrending} limit={limit} />
        </TabsContent>

        <TabsContent value="recent">
          <ProductGrid products={recentlyViewed} loading={loadingRecent} limit={limit} />
        </TabsContent>
      </Tabs>
    </div>
  );
};


