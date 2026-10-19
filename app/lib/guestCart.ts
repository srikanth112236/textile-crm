'use client';

import { productsApi } from './api/products';

export interface GuestCartItem {
  productId: string;
  quantity: number;
  variations: Array<{ name: string; value: string }>;
  product: {
    _id: string;
    name: string;
    price: number;
    images: Array<string | { url: string }>;
    stock: number;
  };
  price: number;
  subtotal: number;
}

const KEY = 'mentoos_guest_cart';

function read(): Array<{ productId: string; quantity: number; variations: Array<{ name: string; value: string }> }> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function write(raw: Array<{ productId: string; quantity: number; variations: Array<{ name: string; value: string }> }>) {
  localStorage.setItem(KEY, JSON.stringify(raw));
  window.dispatchEvent(new Event('guest-cart-updated'));
}

export function getGuestCartRaw() {
  return read();
}

export function getGuestCount(): number {
  return read().length;
}

export async function getGuestCart(): Promise<{ items: GuestCartItem[]; total: number }> {
  const raw = read();
  const items: GuestCartItem[] = [];
  for (const r of raw) {
    try {
      const res = await productsApi.getProduct(r.productId);
      const p: any = res.data;
      items.push({
        ...r,
        product: { _id: p._id, name: p.name, price: p.price, images: p.images, stock: p.stock },
        price: p.price,
        subtotal: p.price * r.quantity,
      });
    } catch {
      // product gone — drop it
    }
  }
  return { items, total: items.reduce((s, i) => s + i.subtotal, 0) };
}

export async function addToGuestCart(productId: string, quantity = 1, variations: Array<{ name: string; value: string }> = []): Promise<void> {
  const raw = read();
  const idx = raw.findIndex((i) => i.productId === productId && JSON.stringify(i.variations) === JSON.stringify(variations));
  if (idx >= 0) raw[idx].quantity = Math.min(10, raw[idx].quantity + quantity);
  else raw.push({ productId, quantity, variations });
  write(raw);
}

export async function updateGuestItem(index: number, quantity: number): Promise<void> {
  const raw = read();
  if (raw[index]) {
    raw[index].quantity = Math.max(1, Math.min(10, quantity));
    write(raw);
  }
}

export async function removeGuestItem(index: number): Promise<void> {
  const raw = read();
  write(raw.filter((_, i) => i !== index));
}

export function clearGuestCart(): void {
  write([]);
}
