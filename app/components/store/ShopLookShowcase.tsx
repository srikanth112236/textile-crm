'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Check, Sparkles, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ShopLook } from '@/lib/api/shopLook';
import { formatPrice } from '@/lib/utils';

interface ShopLookShowcaseProps {
  look: ShopLook;
  /** Optional look switcher chips (storefront only). */
  looks?: ShopLook[];
  onSelect?: (id: string) => void;
  /** Omit in the admin preview to make the CTA non-functional. */
  onAddAll?: () => void;
  adding?: boolean;
  added?: boolean;
  /** Render product names as links (storefront) or plain text (admin modal). */
  linkProducts?: boolean;
  id?: string;
  className?: string;
}

// Legacy records store relative `/uploads/...` paths that the Next proxy serves.
function toDisplaySrc(url: string): string {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `/api/images${url}`;
  return url;
}

/**
 * The storefront "Shop the Complete Look" block. Shared by the homepage and
 * the admin preview modal so admins see exactly what customers see.
 */
export function ShopLookShowcase({
  look,
  looks,
  onSelect,
  onAddAll,
  adding = false,
  added = false,
  linkProducts = true,
  id,
  className = '',
}: ShopLookShowcaseProps) {
  const items = ((look.productIds || []).filter(Boolean) as ShopLook['productIds']);
  const total = items.reduce((sum, p) => sum + (p.price || 0), 0);
  const bundle = look.bundlePrice && look.bundlePrice < total ? look.bundlePrice : total;
  const savings = total - bundle;
  const showSwitcher = !!looks && looks.length > 0 && !!onSelect;

  return (
    <section
      id={id}
      className={`relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 py-8 text-white shadow-2xl sm:p-10 ${className}`}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
        <div className="group relative h-[420px] w-full overflow-hidden rounded-2xl border border-slate-700/60 shadow-2xl sm:h-[480px] lg:w-1/2">
          {look.imageUrl ? (
            <Image
              src={toDisplaySrc(look.imageUrl)}
              alt={look.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-6xl font-black text-white/20">
              LOOK
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          {savings > 0 && (
            <div className="absolute left-4 top-4">
              <Badge className="bg-amber-500 px-3 py-1 text-xs font-bold tracking-wider text-slate-950">
                SAVE {formatPrice(savings)} BUNDLE OFFER
              </Badge>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-white">{look.title}</h3>
            {look.description && <p className="mt-1 text-xs text-slate-300">{look.description}</p>}
          </div>
        </div>

        <div className="w-full space-y-6 lg:w-1/2">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Sparkles className="h-4 w-4" />
              Complete Outfit Styling
            </span>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-white">SHOP THE COMPLETE LOOK</h2>
          </div>

          {showSwitcher && (
            <div className="flex flex-wrap gap-3">
              {looks!.map((l) => (
                <button
                  key={l._id}
                  type="button"
                  onClick={() => onSelect!(l._id)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    look._id === l._id
                      ? 'border-amber-400 bg-amber-500/10 font-semibold text-white'
                      : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="block max-w-[160px] truncate text-xs font-bold">{l.title}</span>
                  <span className="text-xs font-extrabold text-amber-400">{l.productIds.length} items</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              Items Included in this Look:
            </h3>
            {items.map((item) =>
              linkProducts ? (
                <Link
                  key={item._id}
                  href={`/products/${item._id}`}
                  className="flex items-center justify-between border-b border-slate-800/80 py-1.5 text-xs last:border-none hover:text-amber-300"
                >
                  <span className="font-medium text-slate-200">{item.name}</span>
                  <span className="font-bold text-white">{formatPrice(item.price)}</span>
                </Link>
              ) : (
                <div
                  key={item._id}
                  className="flex items-center justify-between border-b border-slate-800/80 py-1.5 text-xs last:border-none"
                >
                  <span className="font-medium text-slate-200">{item.name}</span>
                  <span className="font-bold text-white">{formatPrice(item.price)}</span>
                </div>
              )
            )}
            {items.length === 0 && (
              <p className="py-2 text-center text-xs text-slate-500">No products linked to this look.</p>
            )}
          </div>

          <div className="flex flex-col justify-between gap-4 pt-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400">{formatPrice(bundle)}</span>
                {savings > 0 && (
                  <span className="text-base text-slate-500 line-through">{formatPrice(total)}</span>
                )}
              </div>
              {savings > 0 && (
                <p className="text-xs font-semibold text-emerald-400">
                  Instant {formatPrice(savings)} Combo Discount Applied
                </p>
              )}
            </div>

            <Button
              type="button"
              size="lg"
              onClick={onAddAll}
              disabled={adding || items.length === 0}
              className="rounded-2xl bg-amber-500 px-8 py-6 text-sm font-bold text-slate-950 transition-all hover:scale-105 hover:bg-amber-600"
            >
              {added ? (
                <>
                  <Check className="mr-2 h-5 w-5" /> ADDED TO CART
                </>
              ) : (
                <>
                  <ShoppingBag className="mr-2 h-5 w-5" /> {adding ? 'ADDING…' : 'ADD ALL TO CART'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
