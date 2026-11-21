import { Platform } from 'react-native';

/**
 * Same backend the web storefront talks to (server/ Express API, mounted at /api).
 *
 * Native (iOS/Android) — EXPO_PUBLIC_API_URL from mobile/.env, or a local server.
 * Browser preview — the production API does not allow http://localhost:8081, so
 * web on localhost goes through the dev CORS proxy (`npm run dev:web`).
 */
const PRODUCTION = 'https://textile-crm-backend.onrender.com';
const WEB_PROXY_FALLBACK = 'http://localhost:5050';

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

function resolveBase() {
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    isLocalHost(window.location.hostname)
  ) {
    return (process.env.EXPO_PUBLIC_WEB_PROXY_URL?.trim() || WEB_PROXY_FALLBACK).replace(/\/+$/, '');
  }

  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  // Android emulator reaches the host machine through 10.0.2.2.
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
}

export const API_BASE = resolveBase();
export const API_URL = `${API_BASE}/api`;
export const PRODUCTION_API_BASE = PRODUCTION;

/** True when this build is a browser preview routed through the dev proxy. */
export const USING_WEB_PROXY =
  Platform.OS === 'web' && typeof window !== 'undefined' && isLocalHost(window.location.hostname);

type ImageLike = string | { url?: string | null } | null | undefined;

/**
 * Product images come back either as absolute URLs (new uploads, Unsplash seeds)
 * or as legacy relative paths like `/uploads/products/x.jpg`.
 */
export function resolveImage(source: ImageLike): string | undefined {
  const raw = typeof source === 'string' ? source : source?.url ?? undefined;
  if (!raw) return undefined;
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  return `${API_BASE}${raw.startsWith('/') ? '' : '/'}${raw}`;
}

export function productImages(product: { images?: ImageLike[] } | null | undefined): string[] {
  const list = (product?.images ?? []).map(resolveImage).filter(Boolean) as string[];
  return list.length > 0 ? list : [];
}
