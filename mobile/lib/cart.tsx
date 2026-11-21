import { cartApi } from '@/lib/api/endpoints';
import { productImages } from '@/lib/config';
import type { Product } from '@/lib/api/types';
import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/query';
import { store } from '@/lib/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';

export type Variation = { name: string; value: string };

export type CartLine = {
  key: string;
  /** Server cart index — the backend addresses items positionally. */
  index: number;
  productId: string;
  name: string;
  image?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  variations: Variation[];
  stock?: number;
};

type GuestLine = {
  productId: string;
  quantity: number;
  variations: Variation[];
  snapshot: { name: string; image?: string; price: number; compareAtPrice?: number; stock?: number };
};

const GUEST_KEY = 'mentoos.guest_cart.v1';

export const FREE_SHIPPING_FALLBACK = 1999;

function lineKey(productId: string, variations: Variation[]) {
  const signature = variations
    .map((variation) => `${variation.name}:${variation.value}`)
    .sort()
    .join('|');
  return signature ? `${productId}::${signature}` : productId;
}

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  savings: number;
  isLoading: boolean;
  isMutating: boolean;
  isEmpty: boolean;
  add: (product: Product, quantity?: number, variations?: Variation[]) => Promise<void>;
  setQuantity: (key: string, quantity: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  error: string | null;
};

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const [guestLines, setGuestLines] = React.useState<GuestLine[]>([]);
  const [guestReady, setGuestReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const syncedRef = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await store.getJSON<GuestLine[]>(GUEST_KEY);
      if (cancelled) return;
      setGuestLines(Array.isArray(saved) ? saved : []);
      setGuestReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistGuest = React.useCallback((next: GuestLine[]) => {
    setGuestLines(next);
    void store.setJSON(GUEST_KEY, next);
  }, []);

  const serverCart = useQuery({
    queryKey: qk.cart,
    queryFn: async () => (await cartApi.get()).data,
    enabled: isSignedIn,
  });

  const invalidate = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: qk.cart });
  }, [queryClient]);

  // Merge a guest basket into the account cart the moment a session appears.
  React.useEffect(() => {
    if (!isSignedIn || !guestReady || guestLines.length === 0 || syncedRef.current) return;
    syncedRef.current = true;
    (async () => {
      try {
        for (const line of guestLines) {
          await cartApi.add({
            productId: line.productId,
            quantity: line.quantity,
            variations: line.variations,
          });
        }
        persistGuest([]);
      } catch {
        /* keep the local basket if the merge fails; next sign-in retries */
        syncedRef.current = false;
      } finally {
        invalidate();
      }
    })();
  }, [guestLines, guestReady, invalidate, isSignedIn, persistGuest]);

  React.useEffect(() => {
    if (!isSignedIn) syncedRef.current = false;
  }, [isSignedIn]);

  const addMutation = useMutation({
    mutationFn: async (input: { productId: string; quantity: number; variations: Variation[] }) => cartApi.add(input),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: async (input: { index: number; quantity: number }) =>
      cartApi.update(input.index, input.quantity),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: async (index: number) => cartApi.remove(index),
    onSuccess: invalidate,
  });
  const clearMutation = useMutation({ mutationFn: () => cartApi.clear(), onSuccess: invalidate });

  const lines = React.useMemo<CartLine[]>(() => {
    if (isSignedIn) {
      const items = serverCart.data?.items ?? [];
      return items.map((item, index) => {
        const product = item.product;
        return {
          key: `${item.productId}-${index}`,
          index,
          productId: String(item.productId),
          name: product?.name ?? 'Product',
          image: productImages(product)[0],
          price: item.price ?? product?.price ?? 0,
          compareAtPrice: product?.compareAtPrice,
          quantity: item.quantity,
          variations: item.variations ?? [],
          stock: product?.stock,
        };
      });
    }

    return guestLines.map((line, index) => ({
      key: lineKey(line.productId, line.variations),
      index,
      productId: line.productId,
      name: line.snapshot.name,
      image: line.snapshot.image,
      price: line.snapshot.price,
      compareAtPrice: line.snapshot.compareAtPrice,
      quantity: line.quantity,
      variations: line.variations,
      stock: line.snapshot.stock,
    }));
  }, [guestLines, isSignedIn, serverCart.data]);

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const savings = lines.reduce(
    (sum, line) =>
      sum + (line.compareAtPrice && line.compareAtPrice > line.price ? (line.compareAtPrice - line.price) * line.quantity : 0),
    0
  );

  const add = React.useCallback(
    async (product: Product, quantity = 1, variations: Variation[] = []) => {
      setError(null);
      if (isSignedIn) {
        try {
          await addMutation.mutateAsync({ productId: product._id, quantity, variations });
        } catch (cause) {
          setError((cause as Error).message);
        }
        return;
      }

      const key = lineKey(product._id, variations);
      const existing = guestLines.find((line) => lineKey(line.productId, line.variations) === key);
      const snapshot = {
        name: product.name,
        image: productImages(product)[0],
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
      };
      const next = existing
        ? guestLines.map((line) =>
            lineKey(line.productId, line.variations) === key
              ? { ...line, quantity: Math.min(10, line.quantity + quantity) }
              : line
          )
        : [...guestLines, { productId: product._id, quantity, variations, snapshot }];
      persistGuest(next);
    },
    [addMutation, guestLines, isSignedIn, persistGuest]
  );

  const setQuantity = React.useCallback(
    async (key: string, quantity: number) => {
      setError(null);
      const line = lines.find((entry) => entry.key === key);
      if (!line) return;

      if (isSignedIn) {
        try {
          if (quantity <= 0) await removeMutation.mutateAsync(line.index);
          else await updateMutation.mutateAsync({ index: line.index, quantity });
        } catch (cause) {
          setError((cause as Error).message);
        }
        return;
      }

      const next =
        quantity <= 0
          ? guestLines.filter((entry, index) => index !== line.index)
          : guestLines.map((entry, index) =>
              index === line.index ? { ...entry, quantity: Math.min(10, quantity) } : entry
            );
      persistGuest(next);
    },
    [guestLines, isSignedIn, lines, persistGuest, removeMutation, updateMutation]
  );

  const remove = React.useCallback(
    async (key: string) => {
      const line = lines.find((entry) => entry.key === key);
      if (!line) return;
      await setQuantity(key, 0);
    },
    [lines, setQuantity]
  );

  const clear = React.useCallback(async () => {
    if (isSignedIn) {
      try {
        await clearMutation.mutateAsync();
      } catch (cause) {
        setError((cause as Error).message);
      }
      return;
    }
    persistGuest([]);
  }, [clearMutation, isSignedIn, persistGuest]);

  const value = React.useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount,
      subtotal,
      savings,
      isLoading: isSignedIn && serverCart.isLoading,
      isMutating:
        addMutation.isPending ||
        updateMutation.isPending ||
        removeMutation.isPending ||
        clearMutation.isPending,
      isEmpty: lines.length === 0,
      add,
      setQuantity,
      remove,
      clear,
      error,
    }),
    [
      add,
      addMutation.isPending,
      clear,
      clearMutation.isPending,
      error,
      itemCount,
      lines,
      remove,
      removeMutation.isPending,
      serverCart.isLoading,
      setQuantity,
      subtotal,
      savings,
      isSignedIn,
      updateMutation.isPending,
    ]
  );

  if (status === 'loading' && !guestReady) {
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}
