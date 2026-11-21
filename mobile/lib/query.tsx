import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';

const RETRYABLE = new Set([0, 408, 429, 500, 502, 503, 504]);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (attempt, error) => {
        const status = (error as { status?: number })?.status ?? 0;
        return attempt < 2 && RETRYABLE.has(status);
      },
    },
    mutations: { retry: 0 },
  },
});

export function AppQueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export const qk = {
  home: ['home'] as const,
  categories: ['categories'] as const,
  products: (filters: Record<string, unknown>) => ['products', filters] as const,
  product: (id: string) => ['product', id] as const,
  facets: (params: Record<string, unknown>) => ['facets', params] as const,
  recommendations: (id: string) => ['recommendations', id] as const,
  reviews: (id: string) => ['reviews', id] as const,
  featuredReviews: ['featured-reviews'] as const,
  cart: ['cart'] as const,
  profile: ['profile'] as const,
  addresses: ['addresses'] as const,
  wishlist: ['wishlist'] as const,
  returns: ['returns'] as const,
  orders: (status?: string) => ['orders', status ?? 'all'] as const,
  order: (id: string) => ['order', id] as const,
  loyalty: ['loyalty'] as const,
  referrals: ['referrals'] as const,
  settings: ['settings'] as const,
  shopLook: ['shop-look'] as const,
  ugc: ['ugc'] as const,
  trending: ['trending'] as const,
  discounts: ['discounts'] as const,
};
