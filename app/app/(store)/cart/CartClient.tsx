'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Heart,
  Sparkles,
  Truck,
  Lock,
  RotateCcw,
  BadgeCheck,
  ShieldCheck,
} from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { settingsApi } from '@/lib/api/settings';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { productsApi } from '@/lib/api/products';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { CouponInput } from '@/components/cart/CouponInput';
import { Reveal } from '@/components/store/StoreMotion';

const SkeletonRow = () => (
  <div className="flex animate-pulse gap-4 border-b border-line py-5">
    <div className="h-20 w-20 shrink-0 rounded-xl bg-sand" />
    <div className="flex-1 space-y-2.5">
      <div className="h-3 w-2/3 rounded bg-sand" />
      <div className="h-3 w-1/3 rounded bg-sand" />
      <div className="h-8 w-28 rounded bg-sand" />
    </div>
  </div>
);

/** Stable row identity: variant-aware, so removing one line does not remount the rest. */
const rowKey = (item: { productId: string; variations?: Array<{ name: string; value: string }> }) =>
  `${item.productId}::${(item.variations || []).map((v) => `${v.name}:${v.value}`).join('|')}`;

/** Static shell header — module scope so it keeps its identity between renders. */
function PageHead({ label, count, note }: { label: string; count: number; note?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-ink-subtle">
          <Link href="/products" className="transition-colors hover:text-ink">Shop</Link>
          <span aria-hidden className="opacity-40">/</span>
          <span className="text-ink">Bag</span>
        </div>
        <h1 className="mt-2 flex items-baseline gap-2.5 text-[22px] font-extrabold tracking-tight text-ink sm:text-[26px]">
          {label}
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-subtle">
            {count} {count === 1 ? 'piece' : 'pieces'}
          </span>
        </h1>
        {note ? <div className="mt-1.5 text-[12px] text-ink-muted">{note}</div> : null}
      </div>
      <Link
        href="/products"
        className="group inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Keep shopping
      </Link>
    </div>
  );
}

/** Free-shipping progress — module scope, threshold passed in from settings. */
function FreeShipBar({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / Math.max(1, threshold)) * 100));
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-[rgb(var(--color-brand))]/25 bg-[rgb(var(--color-brand))]/[0.06]">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--color-brand))] text-white">
          <Truck className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          {remaining > 0 ? (
            <p className="text-[12px] font-semibold text-ink">
              Add <span className="text-[rgb(var(--color-brand))]">{formatPrice(remaining)}</span> more for free shipping
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[rgb(var(--color-success))]">
              <BadgeCheck className="h-3.5 w-3.5" /> Free shipping unlocked
            </p>
          )}
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-[rgb(var(--color-brand))] transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-subtle">{pct}%</span>
      </div>
    </div>
  );
}

export const CartClient: React.FC = () => {
  const { items, total, itemCount, loading, updateItem, removeItem } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addItem: addToWishlist } = useWishlist();
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [freeShipThreshold, setFreeShipThreshold] = useState(999);
  const [completeLook, setCompleteLook] = useState<any[]>([]);
  const [guestItems, setGuestItems] = useState<any[]>([]);
  const [guestTotal, setGuestTotal] = useState(0);
  const [guestLoading, setGuestLoading] = useState(true);

  React.useEffect(() => {
    settingsApi.getPublic().then((s) => setFreeShipThreshold(s.shipping.freeShippingThreshold)).catch(() => {});
  }, []);

  // Guest bag (localStorage) for non-logged-in shoppers
  const reloadGuest = React.useCallback(async () => {
    if (isAuthenticated) {
      setGuestItems([]);
      setGuestTotal(0);
      setGuestLoading(false);
      return;
    }
    try {
      const { getGuestCart } = await import('@/lib/guestCart');
      const g = await getGuestCart();
      setGuestItems(g.items);
      setGuestTotal(g.total);
    } catch {
      setGuestItems([]);
      setGuestTotal(0);
    } finally {
      setGuestLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    reloadGuest();
    window.addEventListener('guest-cart-updated', reloadGuest);
    return () => window.removeEventListener('guest-cart-updated', reloadGuest);
  }, [reloadGuest]);

  React.useEffect(() => {
    if (items.length > 0) {
      const firstId = items[0].productId;
      productsApi.getRecommendations(firstId, 4).then((r) => {
        if (r.data && r.data.length > 0) {
          setCompleteLook(r.data);
        } else {
          // Fallback so the slot never sits empty
          productsApi.getTrendingProducts(4).then((t) => setCompleteLook(t.data || [])).catch(() => {});
        }
      }).catch(() => {
        productsApi.getTrendingProducts(4).then((t) => setCompleteLook(t.data || [])).catch(() => {});
      });
    } else {
      setCompleteLook([]);
    }
  }, [items.length]);

  const handleMoveToWishlist = async (itemIndex: number, productId: string) => {
    try {
      await addToWishlist(productId);
      await removeItem(itemIndex);
    } catch {
      // errors handled in contexts
    }
  };

  // `/cart` is public: logged-in customers and guests with a local bag can both
  // use it. No auth-based redirect here (that caused deep links to bounce).

  const handleQuantityChange = async (itemIndex: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingIndex(itemIndex);
    try {
      await updateItem(itemIndex, newQuantity);
    } catch (error) {
      // Error handled in context
    } finally {
      setUpdatingIndex(null);
    }
  };

  const handleRemove = async (itemIndex: number) => {
    setRemovingIndex(itemIndex);
    try {
      await removeItem(itemIndex);
    } catch (error) {
      // Error handled in context
    } finally {
      setRemovingIndex(null);
    }
  };

  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };

  if (loading || authLoading || (!isAuthenticated && guestLoading)) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="container-page pb-16 pt-7">
          <div className="border-b border-line pb-5">
            <div className="h-3 w-20 animate-pulse rounded bg-sand" />
            <div className="mt-3 h-6 w-40 animate-pulse rounded bg-sand" />
          </div>
          <div className="mt-6 grid gap-x-10 lg:grid-cols-[minmax(0,1fr)_352px]">
            <div>
              <SkeletonRow />
              <SkeletonRow />
            </div>
            <div className="mt-8 h-56 animate-pulse rounded-2xl bg-sand lg:mt-0" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- guest */
  if (!isAuthenticated && guestItems.length > 0) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="container-page pb-16 pt-7">
          <PageHead
            label="Guest bag"
            count={guestItems.length}
            note={
              <>
                Checking out as guest —{' '}
                <Link href="/login" className="font-semibold text-[rgb(var(--color-brand))] underline decoration-1 underline-offset-2">
                  log in
                </Link>{' '}
                for faster checkout, order history and loyalty points.
              </>
            }
          />

          <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_352px]">
            <div>
              {guestItems.map((item, index) => (
                <Reveal key={rowKey(item)} delay={Math.min(index * 45, 180)}>
                  <div className="group flex gap-4 border-b border-line py-5">
                    <Link href={`/products/${item.productId}`} className="shrink-0">
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-sand sm:h-24 sm:w-24">
                        {item.product.images && item.product.images.length > 0 && (
                          <Image
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            sizes="96px"
                          />
                        )}
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/products/${item.productId}`}>
                          <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink transition-colors hover:text-[rgb(var(--color-brand))]">
                            {item.product.name}
                          </h3>
                        </Link>
                        <button
                          onClick={async () => { const { removeGuestItem } = await import('@/lib/guestCart'); await removeGuestItem(index); reloadGuest(); }}
                          aria-label="Remove item"
                          className="shrink-0 rounded-full p-1.5 text-ink-subtle transition-colors hover:bg-[rgb(var(--color-danger))]/10 hover:text-[rgb(var(--color-danger))]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {item.variations && item.variations.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.variations.map((v: any, i: number) => (
                            <span key={i} className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                              {v.name}: {v.value}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                        <div className="flex items-center rounded-full border border-line">
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
                            onClick={async () => { const { updateGuestItem } = await import('@/lib/guestCart'); await updateGuestItem(index, item.quantity - 1); reloadGuest(); }}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-[12px] font-bold text-ink">{item.quantity}</span>
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink"
                            onClick={async () => { const { updateGuestItem } = await import('@/lib/guestCart'); await updateGuestItem(index, item.quantity + 1); reloadGuest(); }}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-[14px] font-extrabold tracking-tight text-ink">{formatPrice(item.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[20px] border border-line bg-white p-5 shadow-soft">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.26em] text-ink-subtle">Order summary</h2>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-[13px] text-ink-muted">Total</span>
                  <span className="text-[20px] font-extrabold tracking-tight text-ink">{formatPrice(guestTotal)}</span>
                </div>
                <div className="mt-4">
                  <CouponInput
                    items={guestItems.map((g: any) => ({ productId: g.productId, quantity: g.quantity }))}
                    subtotal={guestTotal}
                  />
                </div>
                <Button className="mt-4 h-11 w-full rounded-full bg-ink text-[12px] font-bold uppercase tracking-[0.16em] text-white hover:bg-ink/90" asChild>
                  <Link href="/checkout?guest=1" className="inline-flex items-center justify-center gap-2">
                    Checkout as guest <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button variant="ghost" className="mt-1 w-full text-[11px] font-semibold text-ink-muted" asChild>
                  <Link href="/login">Log in for faster checkout</Link>
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.14em] text-ink-subtle">
                <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Secure</span>
                <span className="inline-flex items-center gap-1"><RotateCcw className="h-3 w-3" /> 7-day exchange</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- empty */
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-paper">
        <div className="container-page pb-20 pt-7">
          <PageHead label="Your bag" count={0} />
          <div className="mx-auto max-w-md py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-white shadow-soft">
              <ShoppingBag className="h-6 w-6 text-ink-subtle" />
            </div>
            <h2 className="mt-5 text-[20px] font-extrabold tracking-tight text-ink">Nothing in the bag yet</h2>
            <p className="mx-auto mt-2 max-w-xs text-[12.5px] leading-relaxed text-ink-muted">
              Start with the pieces everyone reorders — heavyweight tees, pure linen shirts and relaxed trousers.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Button className="h-11 rounded-full bg-ink px-6 text-[12px] font-bold uppercase tracking-[0.16em] text-white hover:bg-ink/90" asChild>
                <Link href="/products" className="inline-flex items-center gap-2">
                  Shop the collection <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" className="h-11 rounded-full border-line px-6 text-[12px] font-bold uppercase tracking-[0.16em]" asChild>
                <Link href="/demo-1">Browse lookbook</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------------- main */
  const savings = items.reduce((s, it) => {
    const m = (it.product as any)?.compareAtPrice || (it.product as any)?.mrp;
    const u = (it as any).price ?? it.product.price;
    return s + (m && m > u ? (m - u) * it.quantity : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-paper">
      <div className="container-page pb-16 pt-7">
        <PageHead label="Your bag" count={itemCount} />
        <FreeShipBar subtotal={total} threshold={freeShipThreshold} />

        <div className="mt-7 grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_352px]">
          {/* Items */}
          <div>
            <div className="hidden border-b border-line pb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-ink-subtle sm:flex">
              <span className="flex-1">Piece</span>
              <span className="w-28 text-center">Qty</span>
              <span className="w-24 text-right">Total</span>
            </div>

            {items.map((item, index) => {
              const mrp = (item.product as any)?.compareAtPrice || (item.product as any)?.mrp;
              const unit = item.price ?? item.product.price;
              const save = mrp && mrp > unit ? (mrp - unit) * item.quantity : 0;
              return (
                <Reveal key={rowKey(item)} delay={Math.min(index * 45, 180)}>
                  <div className="group flex gap-4 border-b border-line py-5 transition-colors hover:bg-white/60">
                    <Link href={`/products/${item.productId}`} className="shrink-0">
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-sand sm:h-24 sm:w-24">
                        {item.product.images && item.product.images.length > 0 && (
                          <Image
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            sizes="96px"
                          />
                        )}
                      </div>
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/products/${item.productId}`}>
                            <h3 className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-ink transition-colors hover:text-[rgb(var(--color-brand))]">
                              {item.product.name}
                            </h3>
                          </Link>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-ink-subtle">
                            {formatPrice(unit)} each
                          </p>
                          {item.variations && item.variations.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.variations.map((v, i) => (
                                <span key={i} className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                                  {v.name}: {v.value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(index)}
                          disabled={removingIndex === index}
                          aria-label="Remove item"
                          className="shrink-0 rounded-full p-1.5 text-ink-subtle transition-colors hover:bg-[rgb(var(--color-danger))]/10 hover:text-[rgb(var(--color-danger))]"
                        >
                          {removingIndex === index ? (
                            <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center rounded-full border border-line">
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
                              onClick={() => handleQuantityChange(index, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updatingIndex === index}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-[12px] font-bold text-ink">
                              {updatingIndex === index ? '···' : item.quantity}
                            </span>
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink disabled:opacity-40"
                              onClick={() => handleQuantityChange(index, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock || updatingIndex === index}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-subtle transition-colors hover:bg-ink/5 hover:text-ink"
                            onClick={() => handleMoveToWishlist(index, item.productId)}
                            aria-label="Move to wishlist"
                          >
                            <Heart className="h-3 w-3" /> Save
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-[14px] font-extrabold tracking-tight text-ink">{formatPrice(item.subtotal)}</div>
                          {mrp && mrp > unit && (
                            <div className="mt-0.5 text-[10.5px] text-ink-subtle">
                              <span className="line-through">{formatPrice(mrp * item.quantity)}</span>{' '}
                              <span className="font-bold text-[rgb(var(--color-success))]">save {formatPrice(save)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}

            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[20px] border border-line bg-white p-5 shadow-soft">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.26em] text-ink-subtle">Order summary</h2>

              <div className="mt-4 space-y-2.5 text-[12.5px]">
                <div className="flex justify-between text-ink-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-ink">{formatPrice(total)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-ink-muted">
                    <span>You save</span>
                    <span className="font-bold text-[rgb(var(--color-success))]">−{formatPrice(savings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-muted">
                  <span>Pieces</span>
                  <span className="font-semibold text-ink">{itemCount}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Shipping</span>
                  <span className="font-semibold text-ink">
                    {total >= freeShipThreshold ? 'Free' : 'Calculated at checkout'}
                  </span>
                </div>
              </div>

              <div className="mt-4 border-t border-line pt-4">
                <CouponInput
                  items={items.map((it: any) => ({ productId: it.productId, quantity: it.quantity }))}
                  subtotal={total}
                />
              </div>

              <Separator className="my-4" />

              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-bold uppercase tracking-[0.18em] text-ink">Total</span>
                <span className="text-[20px] font-extrabold tracking-tight text-ink">{formatPrice(total)}</span>
              </div>
              <p className="mt-1 text-[10.5px] text-ink-subtle">Taxes included. Coupons apply at checkout.</p>

              <Button className="mt-4 h-11 w-full rounded-full bg-ink text-[12px] font-bold uppercase tracking-[0.16em] text-white transition-transform hover:bg-ink/90 active:scale-[0.99]" asChild>
                <Link href="/checkout" className="inline-flex items-center justify-center gap-2">
                  Proceed to checkout <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <div className="mt-3 grid grid-cols-3 gap-1 border-t border-line pt-3 text-center">
                {[
                  { icon: Lock, label: 'Secure' },
                  { icon: Truck, label: 'COD' },
                  { icon: RotateCcw, label: '7-day' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex flex-col items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-ink-subtle">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-line bg-sand/60 p-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--color-success))]" />
              <p className="text-[11px] leading-relaxed text-ink-muted">
                Free 7-day exchange, live courier tracking and no card details stored on our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Complete your look */}
        {completeLook.length > 0 && (
          <section className="mt-14 border-t border-line pt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-[rgb(var(--color-brand))]">
                  <Sparkles className="h-3 w-3" /> Pairs well with
                </p>
                <h2 className="mt-1.5 text-[18px] font-extrabold tracking-tight text-ink">Complete the look</h2>
              </div>
              <Link href="/products" className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-ink">
                View all
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {completeLook.map((p: any, i: number) => {
                const img = p.images?.[0];
                const url = typeof img === 'string' ? img : img?.url || '/placeholder-product.jpg';
                return (
                  <Reveal key={p._id} delay={i * 60}>
                    <div className="group overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-soft">
                      <Link href={`/products/${p._id}`}>
                        <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                          <Image
                            src={url}
                            alt={p.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        </div>
                      </Link>
                      <div className="space-y-1.5 p-3">
                        <div className="line-clamp-1 text-[12px] font-semibold text-ink">{p.name}</div>
                        <div className="text-[13px] font-extrabold tracking-tight text-ink">{formatPrice(p.price)}</div>
                        <AddToCartButton productId={p._id} size="sm" className="mt-1 w-full rounded-full text-[11px] font-bold" />
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
