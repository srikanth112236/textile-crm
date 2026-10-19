'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, getCart, addItemToCart, updateCartItem, removeCartItem, clearCart } from '../api/cart';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils/errorHandler';

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
  addItem: (productId: string, quantity: number, variations?: Array<{ name: string; value: string }>) => Promise<boolean>;
  updateItem: (itemIndex: number, quantity: number) => Promise<void>;
  removeItem: (itemIndex: number) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
  requiresAuth: () => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated, isCustomer } = useAuth();

  const staffBlocked = useCallback(() => {
    if (isAuthenticated && !isCustomer) {
      toast({
        title: 'Customers only',
        description: 'Shopping actions are for customer accounts. Staff, please use the dashboard.',
        variant: 'destructive',
      });
      return true;
    }
    return false;
  }, [isAuthenticated, isCustomer, toast]);

  const refresh = useCallback(async () => {
    // Only fetch cart if user is authenticated; staff accounts never shop.
    if (!isAuthenticated || !isCustomer) {
      setItems([]);
      setTotal(0);
      setItemCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getCart();
      if (response.success && response.data) {
        const cartItems = response.data.items || [];
        setItems(cartItems);
        setTotal(response.data.total || 0);
        // Use unique items count (length of items array) instead of total quantity
        setItemCount(cartItems.length);
      } else {
        // Ensure empty state if no data
        setItems([]);
        setTotal(0);
        setItemCount(0);
      }
    } catch (error: any) {
      // Handle 401 (unauthorized) gracefully - user not logged in
      if (error.response?.status === 401 || error.response?.status === 400) {
        setItems([]);
        setTotal(0);
        setItemCount(0);
      } else if (!error.isRateLimited && error.status !== 429) {
        // 429s already surface via the countdown banner — stay quiet here
        console.error('Failed to fetch cart:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isCustomer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh cart when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    }
  }, [isAuthenticated, refresh]);

  const addItem = useCallback(
    async (productId: string, quantity: number, variations?: Array<{ name: string; value: string }>): Promise<boolean> => {
      if (!isAuthenticated) {
        return false; // Return false to indicate auth is required
      }
      if (staffBlocked()) {
        return false; // Staff accounts cannot shop
      }

      // Fast optimistic update WITHOUT an extra getProduct round-trip
      // (previously 2 sequential requests per Quick Add). If the item already
      // exists, bump quantity instantly; otherwise wait for the single
      // add-to-cart response as source of truth.
      const existingIndex = items.findIndex(
        (item) => item.productId === productId &&
        JSON.stringify(item.variations || []) === JSON.stringify(variations || [])
      );
      let rolledForward = false;
      const prevItems = items;
      const prevTotal = total;
      if (existingIndex >= 0) {
        const updatedItems = [...items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + quantity,
          subtotal: updatedItems[existingIndex].price * (updatedItems[existingIndex].quantity + quantity),
        };
        setItems(updatedItems);
        setTotal(updatedItems.reduce((sum, item) => sum + item.subtotal, 0));
        rolledForward = true;
      }

      try {
        const response = await addItemToCart({ productId, quantity, variations });
        if (response.success && response.data) {
          // Update with server response (source of truth)
          const updatedCartItems = response.data.items || [];
          setItems(updatedCartItems);
          setTotal(response.data.total || 0);
          setItemCount(updatedCartItems.length);
          try {
            const { funnel } = await import('@/lib/analytics');
            const added = updatedCartItems.find(
              (it: any) => it.productId === productId && JSON.stringify(it.variations || []) === JSON.stringify(variations || [])
            ) as any;
            funnel.addToCart(productId, added?.product?.name, added?.price, quantity);
          } catch { /* tracking optional */ }
          toast({
            title: 'Added to cart',
            description: 'Item has been added to your cart',
          });
          return true;
        }
        // Rollback on failure - revert optimistic update
        if (rolledForward) {
          setItems(prevItems);
          setTotal(prevTotal);
          setItemCount(prevItems.length);
        }
        return false;
      } catch (error: any) {
        console.error('Failed to add item to cart:', error);
        // Rollback optimistic update on error
        if (rolledForward) {
          setItems(prevItems);
          setTotal(prevTotal);
          setItemCount(prevItems.length);
        }
        if (error.response?.status === 401 || error.response?.status === 400) {
          return false; // Auth required
        }
        toast({
          title: 'Error',
          description: getErrorMessage(error) || 'Failed to add item to cart',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, isAuthenticated, items, total, refresh, staffBlocked]
  );

  const requiresAuth = useCallback(() => {
    return !isAuthenticated;
  }, [isAuthenticated]);

  const updateItem = useCallback(
    async (itemIndex: number, quantity: number) => {
      // Optimistic update
      const previousItems = [...items];
      const previousTotal = total;
      const previousItemCount = itemCount;

      if (itemIndex >= 0 && itemIndex < items.length) {
        const updatedItems = [...items];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          quantity,
          subtotal: updatedItems[itemIndex].price * quantity,
        };
        setItems(updatedItems);
        setTotal(updatedItems.reduce((sum, item) => sum + item.subtotal, 0));
        setItemCount(updatedItems.length);
      }

      try {
        const response = await updateCartItem(itemIndex, quantity);
        if (response.success && response.data) {
          // Update with server response (source of truth)
          const updatedCartItems = response.data.items || [];
          setItems(updatedCartItems);
          setTotal(response.data.total || 0);
          setItemCount(updatedCartItems.length);
        } else {
          // If response not successful, rollback
          setItems(previousItems);
          setTotal(previousTotal);
          setItemCount(previousItemCount);
        }
      } catch (error: any) {
        // Rollback optimistic update on error
        setItems(previousItems);
        setTotal(previousTotal);
        setItemCount(previousItemCount);
        console.error('Failed to update cart item:', error);
        toast({
          title: 'Error',
          description: getErrorMessage(error) || 'Failed to update cart item',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast, items, total, itemCount]
  );

  const removeItem = useCallback(
    async (itemIndex: number) => {
      // Optimistic update
      const previousItems = [...items];
      const previousTotal = total;
      const previousItemCount = itemCount;

      if (itemIndex >= 0 && itemIndex < items.length) {
        const updatedItems = items.filter((_, index) => index !== itemIndex);
        setItems(updatedItems);
        setTotal(updatedItems.reduce((sum, item) => sum + item.subtotal, 0));
        setItemCount(updatedItems.length);
      }

      try {
        const response = await removeCartItem(itemIndex);
        if (response.success && response.data) {
          // Update with server response (source of truth)
          const updatedCartItems = response.data.items || [];
          setItems(updatedCartItems);
          setTotal(response.data.total || 0);
          setItemCount(updatedCartItems.length);
          toast({
            title: 'Removed from cart',
            description: 'Item has been removed from your cart',
          });
        } else {
          // If response not successful, rollback
          setItems(previousItems);
          setTotal(previousTotal);
          setItemCount(previousItemCount);
        }
      } catch (error: any) {
        // Rollback optimistic update on error
        setItems(previousItems);
        setTotal(previousTotal);
        setItemCount(previousItemCount);
        console.error('Failed to remove cart item:', error);
        toast({
          title: 'Error',
          description: getErrorMessage(error) || 'Failed to remove cart item',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toast, items, total, itemCount]
  );

  const clear = useCallback(async () => {
    try {
      await clearCart();
      setItems([]);
      setTotal(0);
      setItemCount(0);
      toast({
        title: 'Cart cleared',
        description: 'Your cart has been cleared',
      });
    } catch (error: any) {
      console.error('Failed to clear cart:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to clear cart',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        loading,
        addItem,
        updateItem,
        removeItem,
        clear,
        refresh,
        requiresAuth,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

