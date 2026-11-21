/**
 * Typed analytics contract.
 *
 * Every product/feature event is declared here once, with its payload shape.
 * Feature work imports `trackEvent` instead of calling `track('string', …)`
 * directly, so a typo or a missing property becomes a compile-time error.
 *
 * The existing GA4 / Meta Pixel transport lives in `app/lib/analytics.ts`;
 * `trackEvent` delegates to it, so no new third-party setup is required.
 */

import { track } from '../analytics';

export type AuthAction = 'cart' | 'wishlist' | 'checkout' | 'review' | 'generic';

export interface AnalyticsEventMap {
  // Auth / roles (P1)
  auth_prompt_shown: {
    source: 'modal' | 'listener' | 'route_guard';
    action?: AuthAction;
    expired?: boolean;
  };
  auth_login_success: {
    method: 'password' | 'otp';
    role?: string;
    returnedTo?: string;
  };
  auth_pending_action_replayed: {
    action: AuthAction;
    productId?: string;
    quantity?: number;
  };
  staff_commerce_blocked: {
    surface: 'cart' | 'checkout' | 'wishlist' | 'review' | 'add_to_cart' | 'buy_now';
    productId?: string;
  };

  // Bulk import (P2/P3)
  import_started: {
    jobId: string;
    fileName: string;
    mode: 'create' | 'upsert';
    totalRows: number;
  };
  import_validated: {
    jobId: string;
    validRows: number;
    errorRows: number;
    warningRows: number;
  };
  import_committed: {
    jobId: string;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    durationMs?: number;
  };
  import_failed: {
    jobId?: string;
    stage: 'parse' | 'validate' | 'commit';
    message: string;
  };

  // Instagram / media (P4)
  reel_play: {
    productId?: string;
    shortcode: string;
    provider: 'instagram';
    placement: 'pdp' | 'ugc' | 'home';
  };

  // Homepage (P5)
  home_section_view: {
    section: string;
    position: number;
  };

  // Filters / listing (P6)
  filter_applied: {
    page: 'product_listing' | 'search' | 'category';
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    color?: string;
    size?: string;
    fit?: string;
    fabric?: string;
    pattern?: string;
    occasion?: string;
    badge?: string;
    minRating?: number;
    minDiscount?: number;
    inStock?: boolean;
  };
  filter_cleared: {
    page: 'product_listing' | 'search' | 'category';
    previousFilters: number;
  };

  // Product discovery
  quick_view_opened: {
    productId: string;
    source: 'listing' | 'home';
  };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

/** Runtime list, useful for diagnostics and tests. */
export const ANALYTICS_EVENT_NAMES = Object.keys({
  auth_prompt_shown: true,
  auth_login_success: true,
  auth_pending_action_replayed: true,
  staff_commerce_blocked: true,
  import_started: true,
  import_validated: true,
  import_committed: true,
  import_failed: true,
  reel_play: true,
  home_section_view: true,
  filter_applied: true,
  filter_cleared: true,
  quick_view_opened: true,
}) as AnalyticsEventName[];

/**
 * Send a typed event through the existing GA4 / Meta Pixel transport.
 * Never throws: analytics must not break shopping.
 */
export function trackEvent<K extends AnalyticsEventName>(
  name: K,
  payload: AnalyticsEventMap[K]
): void {
  track(name, payload as Record<string, unknown>);
}
