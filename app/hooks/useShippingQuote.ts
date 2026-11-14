'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { shipmentApi, type ShippingQuote } from '@/lib/api/shipment';

interface QuoteItem {
  productId: string;
  quantity: number;
}

interface UseShippingQuoteOptions {
  /** 6-digit delivery PIN. Nothing is requested until this is valid. */
  pincode: string;
  paymentMethod?: string;
  orderValue?: number;
  items: QuoteItem[];
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Live courier rate for the checkout summary.
 *
 * Display-only: order creation recomputes the same quote on the server, so a
 * tampered or stale value can never change what the customer is charged.
 */
export function useShippingQuote({
  pincode,
  paymentMethod,
  orderValue,
  items,
  enabled = true,
  debounceMs = 450,
}: UseShippingQuoteOptions) {
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const requestId = useRef(0);

  const pincodeValid = /^\d{6}$/.test(pincode || '');
  const itemsKey = items.map((i) => `${i.productId}:${i.quantity}`).join('|');

  useEffect(() => {
    if (!enabled || !pincodeValid || items.length === 0) {
      setQuote(null);
      setLoading(false);
      setError(null);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      shipmentApi
        .quote({ pincode, paymentMethod, orderValue, items })
        .then((res) => {
          if (id === requestId.current) setQuote(res.data);
        })
        .catch((e: any) => {
          if (id !== requestId.current) return;
          setQuote(null);
          setError(e?.response?.data?.error || 'Could not calculate shipping');
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, debounceMs);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode, pincodeValid, paymentMethod, orderValue, itemsKey, enabled, refreshToken, debounceMs]);

  const refetch = useCallback(() => setRefreshToken((t) => t + 1), []);

  return { quote, loading, error, refetch, pincodeValid };
}
