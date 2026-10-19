'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ShoppingBag, Heart, Sparkles, Truck, Lock, RotateCcw, BadgeCheck } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/useAuth';
import { settingsApi } from '@/lib/api/settings';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { productsApi } from '@/lib/api/products';
import { AddToCartButton } from '@/components/products/AddToCartButton';
import { CouponInput } from '@/components/cart/CouponInput';

export const CartClient: React.FC = () => {
  const { items, total, itemCount, loading, updateItem, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { addItem: addToWishlist } = useWishlist();
  const router = useRouter();
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

  React.useEffect(() => {
    if (!isAuthenticated && !guestLoading && guestItems.length === 0 && !loading) {
      router.push('/login');
    }
  }, [isAuthenticated, guestLoading, guestItems.length, loading, router]);

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

  if (loading || (!isAuthenticated && guestLoading)) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-24 w-24" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Guest bag view (not logged in, local items present)
  if (!isAuthenticated && guestItems.length > 0) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Shopping Bag</h1>
          <span className="text-muted-foreground">({guestItems.length} {guestItems.length === 1 ? 'item' : 'items'})</span>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Checking out as guest — <Link href="/login" className="font-bold text-primary hover:underline">login</Link> for faster checkout, order history & loyalty points.</p>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {guestItems.map((item, index) => (
              <Card key={`${item.productId}-${index}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Link href={`/products/${item.productId}`}>
                      <div className="relative h-24 w-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                        {item.product.images && item.product.images.length > 0 && (
                          <Image src={getImageUrl(item.product.images[0])} alt={item.product.name} fill className="object-cover" sizes="96px" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.productId}`}>
                        <h3 className="font-semibold mb-1 hover:underline line-clamp-2">{item.product.name}</h3>
                      </Link>
                      {item.variations && item.variations.length > 0 && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {item.variations.map((v: any, i: number) => (
                            <span key={i}>{v.name}: {v.value}{i < item.variations.length - 1 && ', '}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={async () => { const { updateGuestItem } = await import('@/lib/guestCart'); await updateGuestItem(index, item.quantity - 1); reloadGuest(); }}
                            disabled={item.quantity <= 1} aria-label="Decrease quantity">
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8"
                            onClick={async () => { const { updateGuestItem } = await import('@/lib/guestCart'); await updateGuestItem(index, item.quantity + 1); reloadGuest(); }}
                            aria-label="Increase quantity">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">{formatPrice(item.subtotal)}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={async () => { const { removeGuestItem } = await import('@/lib/guestCart'); await removeGuestItem(index); reloadGuest(); }}
                            aria-label="Remove item">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="h-fit sticky top-4">
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>{formatPrice(guestTotal)}</span></div>
              <CouponInput items={guestItems.map((g: any) => ({ productId: g.productId, quantity: g.quantity }))} />
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold" size="lg" asChild>
                <Link href="/checkout?guest=1">Checkout as Guest</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Login for Faster Checkout</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Start adding items to your cart to continue shopping!
          </p>
          <Button asChild>
            <Link href="/products">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 max-w-6xl">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-black tracking-tight">Shopping Cart</h1>
        <span className="text-[11px] font-bold bg-muted rounded-full px-2.5 py-1">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      </div>

      {(() => {
        const remaining = Math.max(0, freeShipThreshold - total);
        const pct = Math.min(100, Math.round((total / freeShipThreshold) * 100));
        return (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/25 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-slate-950">
              <Truck className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              {remaining > 0 ? (
                <p className="text-xs font-bold">Add <span className="text-amber-600">{formatPrice(remaining)}</span> more to unlock <span className="uppercase">free shipping</span></p>
              ) : (
                <p className="text-xs font-black text-emerald-600 flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" /> FREE shipping unlocked!</p>
              )}
              <div className="h-1.5 mt-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="text-[11px] font-black text-muted-foreground shrink-0">{pct}%</span>
          </div>
        );
      })()}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item, index) => {
            const mrp = (item.product as any)?.compareAtPrice || (item.product as any)?.mrp;
            const unit = item.price ?? item.product.price;
            const save = mrp && mrp > unit ? (mrp - unit) * item.quantity : 0;
            return (
            <Card key={`${item.productId}-${index}`} className="hover:border-amber-500/40 transition-colors">
              <CardContent className="p-3.5">
                <div className="flex gap-3">
                  <Link href={`/products/${item.productId}`}>
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {item.product.images && item.product.images.length > 0 && (
                        <Image
                          src={getImageUrl(item.product.images[0])}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/products/${item.productId}`}>
                        <h3 className="text-sm font-semibold hover:underline line-clamp-2 leading-snug">
                          {item.product.name}
                        </h3>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(index)}
                        disabled={removingIndex === index}
                        aria-label="Remove item"
                      >
                        {removingIndex === index ? (
                          <div className="h-3.5 w-3.5 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    {item.variations && item.variations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {item.variations.map((v, i) => (
                          <span key={i} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold">
                            {v.name}: {v.value}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end justify-between mt-2.5 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(index, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updatingIndex === index}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-xs font-bold">
                            {updatingIndex === index ? '...' : item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleQuantityChange(index, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock || updatingIndex === index}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] gap-1 text-muted-foreground"
                          onClick={() => handleMoveToWishlist(index, item.productId)}
                          aria-label="Move to wishlist"
                        >
                          <Heart className="h-3 w-3" /> Wishlist
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black">{formatPrice(item.subtotal)}</div>
                        {mrp && mrp > unit && (
                          <div className="text-[11px] text-muted-foreground">
                            <span className="line-through">{formatPrice(mrp * item.quantity)}</span>{' '}
                            <span className="font-bold text-emerald-600">Save {formatPrice(save)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

        {/* Order Summary */}
        <Card className="h-fit sticky top-4 border-slate-900/10 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              {(() => {
                const savings = items.reduce((s, it) => {
                  const m = (it.product as any)?.compareAtPrice || (it.product as any)?.mrp;
                  const u = (it as any).price ?? it.product.price;
                  return s + (m && m > u ? (m - u) * it.quantity : 0);
                }, 0);
                return savings > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total savings</span>
                    <span className="font-bold text-emerald-600">−{formatPrice(savings)}</span>
                  </div>
                ) : null;
              })()}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{itemCount}</span>
              </div>
              <CouponInput items={items.map((it: any) => ({ productId: it.productId, quantity: it.quantity }))} />
            </div>
            <Separator />
            <div className="flex justify-between items-baseline">
              <span className="font-bold">Total</span>
              <span className="text-xl font-black tracking-tight">{formatPrice(total)}</span>
            </div>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black" size="lg" asChild>
              <Link href="/checkout">
                Proceed to Checkout
              </Link>
            </Button>
            <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground pt-1">
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secure checkout</span>
              <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> COD available</span>
              <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" /> 7-day exchange</span>
            </div>
            <Button variant="ghost" className="w-full text-xs" asChild>
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Complete Your Look */}
      {completeLook.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" /> COMPLETE YOUR LOOK
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Pairs well with items in your cart.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {completeLook.map((p: any) => {
              const img = p.images?.[0];
              const url = typeof img === 'string' ? img : img?.url || '/placeholder-product.jpg';
              return (
                <Card key={p._id} className="overflow-hidden">
                  <Link href={`/products/${p._id}`}>
                    <div className="relative aspect-square bg-muted">
                      <Image src={url} alt={p.name} fill className="object-cover" sizes="25vw" />
                    </div>
                  </Link>
                  <CardContent className="p-3 space-y-1">
                    <div className="text-xs font-bold line-clamp-1">{p.name}</div>
                    <div className="text-sm font-black">{formatPrice(p.price)}</div>
                    <AddToCartButton productId={p._id} size="sm" className="w-full text-xs font-bold rounded-lg" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


