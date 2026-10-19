'use client';

// GA4 + Meta Pixel funnel tracking for Mentoos.
// IDs from env (NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_META_PIXEL_ID).
// No-ops when unconfigured, so pages never break. Debug logs in dev.

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

export function track(event: string, params: Record<string, any> = {}): void {
  try {
    if (typeof window === 'undefined') return;
    if (GA_ID && typeof window.gtag === 'function') {
      window.gtag('event', event, params);
    }
    if (PIXEL_ID && typeof window.fbq === 'function') {
      // Map GA event names to Pixel standard events where possible
      const pixelMap: Record<string, string> = {
        view_item: 'ViewContent',
        search: 'Search',
        add_to_cart: 'AddToCart',
        begin_checkout: 'InitiateCheckout',
        purchase: 'Purchase',
        view_item_list: 'ViewContent',
      };
      const fbEvent = pixelMap[event] || event;
      window.fbq('track', fbEvent, params);
    }
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[analytics] ${event}`, params);
    }
  } catch {
    // never break shopping on tracking errors
  }
}

export interface TrackItem {
  item_id: string;
  item_name?: string;
  price?: number;
  quantity?: number;
}

export const funnel = {
  viewItem(id: string, name: string, price: number) {
    track('view_item', { currency: 'INR', value: price, items: [{ item_id: id, item_name: name, price, quantity: 1 }] });
  },
  viewList(name: string) {
    track('view_item_list', { item_list_name: name });
  },
  search(term: string) {
    track('search', { search_term: term });
  },
  addToCart(id: string, name: string | undefined, price: number | undefined, quantity: number) {
    track('add_to_cart', { currency: 'INR', value: (price || 0) * quantity, items: [{ item_id: id, item_name: name, price, quantity }] });
  },
  beginCheckout(total: number, itemCount: number) {
    track('begin_checkout', { currency: 'INR', value: total, num_items: itemCount });
  },
  purchase(orderNumber: string, total: number, items: TrackItem[]) {
    track('purchase', { currency: 'INR', value: total, transaction_id: orderNumber, items });
  },
};
