'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } from '@/lib/api/wishlist';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { IProduct as Product } from '@/lib/api/types';

interface WishlistContextType {
  items: Product[];
  itemCount: number;
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  addItem: (productId: string) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isCustomer } = useAuth();
  const { toast } = useToast();

  const staffBlocked = useCallback(() => {
    if (isAuthenticated && !isCustomer) {
      toast({
        title: 'Customers only',
        description: 'Wishlist is for customer accounts. Staff, please use the dashboard.',
        variant: 'destructive',
      });
      return true;
    }
    return false;
  }, [isAuthenticated, isCustomer, toast]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !isCustomer) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getWishlist();
      if (response.success && response.data) {
        setItems(response.data || []);
      } else {
        setItems([]);
      }
    } catch (error: any) {
      // 429s already surface via the countdown banner — stay quiet here
      if (error.response?.status !== 401 && error.response?.status !== 400 && error.response?.status !== 403 && !error.isRateLimited && error.status !== 429) {
        console.error('Failed to fetch wishlist:', error);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isCustomer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh wishlist when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, refresh]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item._id === productId);
    },
    [items]
  );

  const addItem = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        return false;
      }
      if (staffBlocked()) {
        return false;
      }

      // Optimistic update
      try {
        const productResponse = await import('../api/products').then((m) => m.productsApi.getProduct(productId));
        if (productResponse.success && !items.some((item) => item._id === productId)) {
          const newItems = [...items, productResponse.data];
          setItems(newItems);
        }
      } catch (error) {
        // Continue even if product fetch fails
        console.warn('Could not fetch product for optimistic update:', error);
      }

      try {
        await addToWishlist(productId);
        await refresh(); // Refresh to get accurate state
        toast({
          title: 'Added to wishlist',
          description: 'Item has been added to your wishlist',
        });
        return true;
      } catch (error: any) {
        // Rollback optimistic update
        await refresh();
        console.error('Failed to add to wishlist:', error);
        if (error.response?.status === 401) {
          return false;
        }
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to add to wishlist',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, isAuthenticated, isCustomer, items, refresh, staffBlocked]
  );

  const removeItem = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        return false;
      }
      if (staffBlocked()) {
        return false;
      }

      // Optimistic update
      const previousItems = [...items];
      setItems(items.filter((item) => item._id !== productId));

      try {
        await removeFromWishlist(productId);
        await refresh(); // Refresh to get accurate state
        toast({
          title: 'Removed from wishlist',
          description: 'Item has been removed from your wishlist',
        });
        return true;
      } catch (error: any) {
        // Rollback optimistic update
        setItems(previousItems);
        console.error('Failed to remove from wishlist:', error);
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to remove from wishlist',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, isAuthenticated, isCustomer, items, refresh, staffBlocked]
  );

  const itemCount = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        itemCount,
        loading,
        isInWishlist,
        addItem,
        removeItem,
        refresh,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

