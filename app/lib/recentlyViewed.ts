'use client';

const KEY = 'mentoos_recently_viewed';
const MAX = 12;

export function trackRecentlyViewed(productId: string): void {
  try {
    const raw = localStorage.getItem(KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    const next = [productId, ...list.filter((id) => id !== productId)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — ignore
  }
}

export function getRecentlyViewed(excludeId?: string): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return (excludeId ? list.filter((id) => id !== excludeId) : list).slice(0, 10);
  } catch {
    return [];
  }
}
