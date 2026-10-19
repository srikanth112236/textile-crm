'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '@/lib/api/wishlist';
import type { IProduct as Product } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';

export const WishlistClient: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/?authRequired=1');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated, router]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await getWishlist();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch wishlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load wishlist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    // Optimistic update
    const previousProducts = [...products];
    setProducts(products.filter((p) => p._id !== productId));

    try {
      await removeFromWishlist(productId);
      toast({
        title: 'Removed from wishlist',
        description: 'Item has been removed from your wishlist',
      });
    } catch (error: any) {
      // Rollback optimistic update
      setProducts(previousProducts);
      console.error('Failed to remove from wishlist:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
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
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
        <div className="text-center py-12">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-muted-foreground mb-6">
            Start adding items you love to your wishlist!
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <span className="text-muted-foreground">{products.length} {products.length === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
            <CardContent className="p-4">
              <Link href={`/products/${product._id}`}>
                <h3 className="font-semibold mb-2 line-clamp-2 hover:underline">{product.name}</h3>
              </Link>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                {product.stock > 0 ? (
                  <span className="text-sm text-green-600">In Stock</span>
                ) : (
                  <span className="text-sm text-red-600">Out of Stock</span>
                )}
              </div>
              <div className="flex gap-2">
                <AddToCartButton
                  productId={product._id}
                  className="flex-1"
                  size="sm"
                  disabled={product.stock === 0 || product.status !== 'active'}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={movingId === product._id || product.stock === 0}
                  onClick={async () => {
                    setMovingId(product._id);
                    try {
                      const ok = await addItem(product._id, 1);
                      if (ok) {
                        await removeFromWishlist(product._id);
                        setProducts((prev) => prev.filter((p) => p._id !== product._id));
                        toast({ title: 'Moved to cart!', description: `${product.name} is now in your bag.` });
                      }
                    } catch (e: any) {
                      toast({ title: 'Move failed', description: e.message, variant: 'destructive' });
                    } finally {
                      setMovingId(null);
                    }
                  }}
                  title="Move to cart (one tap)"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {movingId === product._id ? '…' : 'Move'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemove(product._id)}
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};


