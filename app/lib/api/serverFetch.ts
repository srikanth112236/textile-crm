import type { IProduct, ICategory } from './types';

/**
 * Server-side JSON GET using WHATWG-native `fetch` instead of axios.
 *
 * Why this exists: axios resolves redirects through its `follow-redirects`
 * dependency, which still calls the legacy Node `url.parse()` — that emits a
 * DEP0169 deprecation warning on every server-rendered data fetch (Console:
 * "at HomePage / ProductDetailPage"). Node's built-in fetch uses its own
 * WHATWG URL implementation, so the warning disappears.
 *
 * Behavior contract: never throws — any failure resolves to `null` after a
 * bounded timeout, which the fallback-sensitive callers already treat as
 * "render the empty state".
 */

const API_BASE =
  `${process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com'}/api`;

export interface Paged<T> {
  success?: boolean;
  data?: T[];
  pagination?: { page?: number; total?: number; pages?: number };
}

export async function serverGetJSON<T extends Paged<unknown>>(
  path: string,
  timeoutMs = 12000
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type HomeProductPage = Paged<IProduct>;
export type HomeCategoryPage = Paged<ICategory>;
