'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi } from '@/lib/api/products';
import { profileApi, type Address } from '@/lib/api/profile';
import { createOrder, type Order } from '@/lib/api/orders';
import { paymentsApi, openRazorpayCheckout, type PaymentMethods } from '@/lib/api/payments';
import { settingsApi } from '@/lib/api/settings';
import { COUPON_KEY } from '@/components/cart/CouponInput';
import { useShippingQuote } from '@/hooks/useShippingQuote';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { formatPrice, getErrorMessage } from '@/lib/utils';
import type { IProduct, IVariantSKU } from '@/lib/api/types';
import {
  Zap,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Ticket,
  ShieldCheck,
  Truck,
  X,
  Pencil,
} from 'lucide-react';

type CouponState = { code: string; discount: number; freeShipping: boolean } | null;

interface DiscountDoc {
  code: string;
  description?: string;
  type?: string;
  value?: number;
  minPurchase?: number;
  freeShipping?: boolean;
}

function attrMap(sku: any): Record<string, string> {
  const a = sku?.attributes;
  if (a instanceof Map) return Object.fromEntries(a as Map<string, string>);
  return (a || {}) as Record<string, string>;
}

function matchesVariations(sku: any, variations: Array<{ name: string; value: string }>): boolean {
  const attrs = attrMap(sku);
  return variations.every((v) =>
    Object.entries(attrs).some(
      ([k, val]) =>
        k.toLowerCase() === v.name.toLowerCase() && String(val).toLowerCase() === v.value.toLowerCase()
    )
  );
}

export default function ExpressCheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isCustomer, isLoading: authLoading } = useAuth();

  const productId = searchParams.get('product') || '';
  const initialQty = Math.min(10, Math.max(1, Number(searchParams.get('qty')) || 1));
  const querySize = searchParams.get('size') || '';
  const queryColor = searchParams.get('color') || '';

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(initialQty);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [addressLoaded, setAddressLoaded] = useState(false);

  const [methods, setMethods] = useState<PaymentMethods | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [codQuote, setCodQuote] = useState<{ advance: number; balance: number; codAllowed: boolean; reason: string } | null>(null);

  const [coupon, setCoupon] = useState<CouponState>(null);
  const [couponDraft, setCouponDraft] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<DiscountDoc[]>([]);

  const [placing, setPlacing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [pendingOrder, setPendingOrder] = useState<{ id: string; number?: string } | null>(null);

  // ---------------------------------------------------------------- product
  useEffect(() => {
    if (!productId) {
      setLoadError('No product selected. Open express checkout from a product page.');
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    productsApi
      .getProduct(productId)
      .then((r) => {
        if (alive) setProduct(r.data);
      })
      .catch((e) => {
        if (alive) setLoadError(getErrorMessage(e) || 'Could not load this product.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [productId]);

  // ------------------------------------------------------------ variant axes
  const variantAttributes = product?.variantAttributes || [];
  const sizeAttr = variantAttributes.find((a) => /size/i.test(a.name));
  const colorAttr = variantAttributes.find((a) => /colo(u)?r/i.test(a.name));
  const sizeOptions = (sizeAttr?.options || []).map((o) => o.value);
  const colorOptions = (colorAttr?.options || []).map((o) => o.value);

  useEffect(() => {
    if (!product) return;
    setSelectedSize((prev) => prev || (sizeOptions.includes(querySize) ? querySize : sizeOptions[0] || ''));
    setSelectedColor((prev) => prev || (colorOptions.includes(queryColor) ? queryColor : colorOptions[0] || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const selectedVariations = useMemo(() => {
    const out: Array<{ name: string; value: string }> = [];
    if (sizeAttr && selectedSize) out.push({ name: sizeAttr.name, value: selectedSize });
    if (colorAttr && selectedColor) out.push({ name: colorAttr.name, value: selectedColor });
    return out;
  }, [sizeAttr, colorAttr, selectedSize, selectedColor]);

  const matchedSku: IVariantSKU | null = useMemo(() => {
    const skus = (product?.variantSKUs || []) as IVariantSKU[];
    if (skus.length === 0) return null;
    if (selectedVariations.length === 0) return skus.find((s) => s.isDefault) || skus[0] || null;
    return skus.find((s) => s.isEnabled !== false && matchesVariations(s, selectedVariations)) || null;
  }, [product, selectedVariations]);

  const unitPrice = Number(matchedSku?.price ?? product?.price ?? 0) || 0;
  const availableStock = Number(matchedSku ? matchedSku.stock || 0 : product?.stock || 0);
  const subtotal = unitPrice * quantity;
  const discountPreview = coupon?.discount || 0;
  const discountedSubtotal = Math.max(0, subtotal - discountPreview);

  const productImage = product?.images?.[0];
  const imageUrl = typeof productImage === 'string' ? productImage : productImage?.url;

  // --------------------------------------------------------------- addresses
  useEffect(() => {
    if (!isCustomer) return;
    let alive = true;
    profileApi
      .getAddresses()
      .then((list) => {
        if (!alive) return;
        setAddresses(list || []);
        setDefaultAddress((list || []).find((a) => a.isDefault) || list?.[0] || null);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setAddressLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [isCustomer]);

  // ----------------------------------------------------------------- methods
  useEffect(() => {
    paymentsApi.methods().then(setMethods).catch(() => {});
    // Available discount codes to choose from
    (async () => {
      try {
        const api = (await import('@/lib/api/client')).default;
        const res = await api.get('/discounts');
        setAvailableCoupons((res.data.data || []).slice(0, 6));
      } catch {
        /* coupons are optional */
      }
    })();
  }, []);

  // --------------------------------------------------------------- shipping
  const shippingItems = useMemo(
    () => (product ? [{ productId: product._id, quantity }] : []),
    [product, quantity]
  );

  const { quote: shippingQuote, loading: shippingLoading } = useShippingQuote({
    pincode: (defaultAddress?.zip || '').replace(/\D/g, '').slice(-6),
    paymentMethod,
    orderValue: discountedSubtotal,
    items: shippingItems,
    enabled: Boolean(product && defaultAddress),
  });

  const shippingCharge = coupon?.freeShipping ? 0 : shippingQuote?.available ? shippingQuote.charge : 0;
  const totalPayable = discountedSubtotal + shippingCharge;
  const codAdvance = codQuote?.advance ?? 0;
  const codAllowed = codQuote ? codQuote.codAllowed : true;

  useEffect(() => {
    if (!defaultAddress || !product || discountedSubtotal <= 0) return;
    settingsApi
      .codQuote(discountedSubtotal, defaultAddress.zip)
      .then((q) => {
        setCodQuote({ advance: q.advance, balance: q.balance, codAllowed: q.codAllowed, reason: q.reason });
        if (!q.codAllowed) setPaymentMethod('razorpay');
      })
      .catch(() => {});
  }, [discountedSubtotal, defaultAddress, product]);

  // ----------------------------------------------------------------- coupon
  const couponInit = useRef(false);
  const applyCoupon = async (raw?: string) => {
    const code = String(raw ?? couponDraft).trim().toUpperCase();
    if (code.length < 3 || !product) return;
    setCouponBusy(true);
    setCouponError(null);
    try {
      const api = (await import('@/lib/api/client')).default;
      const res = await api.post('/discounts/validate', {
        code,
        items: [{ productId: product._id, quantity }],
      });
      const d = res.data.data;
      setCoupon({ code, discount: Number(d.discount) || 0, freeShipping: Boolean(d.freeShipping) });
      setCouponDraft('');
      try {
        localStorage.setItem(COUPON_KEY, code);
      } catch {
        /* ignore */
      }
    } catch (e: any) {
      setCouponError(
        typeof e?.response?.data?.error === 'string' ? e.response.data.error : 'Invalid coupon code'
      );
    } finally {
      setCouponBusy(false);
    }
  };

  useEffect(() => {
    if (!product || couponInit.current) return;
    couponInit.current = true;
    let code = '';
    try {
      code = localStorage.getItem(COUPON_KEY) || '';
    } catch {
      /* ignore */
    }
    if (code) applyCoupon(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
    try {
      localStorage.removeItem(COUPON_KEY);
    } catch {
      /* ignore */
    }
  };

  // ------------------------------------------------------------- place order
  const handlePlaceOrder = async () => {
    if (!product || !defaultAddress) return;
    if (availableStock < quantity) {
      toast({ title: 'Out of stock', description: 'The selected variant is no longer available.', variant: 'destructive' });
      return;
    }
    setPlacing(true);
    let placed: Order | null = null;
    try {
      const res = await createOrder({
        items: [{ productId: product._id, quantity, variations: selectedVariations }],
        paymentMethod,
        discountCode: coupon?.code,
      });
      placed = res.data;
      const created = res.data;

      if (paymentMethod === 'razorpay') {
        if (!methods?.razorpayConfigured) {
          throw new Error('Online payments are not configured. Please choose Cash on Delivery.');
        }
        setPaying(true);
        const rp = await paymentsApi.createOrder(created.total, 'full', created._id, 'razorpay');
        const resp = await openRazorpayCheckout({
          keyId: rp.keyId,
          orderId: rp.razorpayOrderId,
          amountPaise: rp.amountPaise,
          description: `Mentoos ${created.orderNumber}`,
        });
        await paymentsApi.verify({
          razorpayOrderId: resp.razorpay_order_id,
          razorpayPaymentId: resp.razorpay_payment_id,
          razorpaySignature: resp.razorpay_signature,
          orderId: created._id,
        });
      } else if (paymentMethod === 'cod') {
        const advance = codQuote?.advance ?? Math.max(0, created.total - (created.codBalance || 0));
        if (advance > 0 && methods?.razorpayConfigured) {
          setPaying(true);
          const rp = await paymentsApi.createOrder(advance, 'cod_advance', created._id, 'cod_advance');
          const resp = await openRazorpayCheckout({
            keyId: rp.keyId,
            orderId: rp.razorpayOrderId,
            amountPaise: rp.amountPaise,
            description: `COD advance ${created.orderNumber}`,
          });
          await paymentsApi.verify({
            razorpayOrderId: resp.razorpay_order_id,
            razorpayPaymentId: resp.razorpay_payment_id,
            razorpaySignature: resp.razorpay_signature,
            orderId: created._id,
          });
        }
      }

      try {
        localStorage.removeItem(COUPON_KEY);
      } catch {
        /* ignore */
      }
      setCreatedOrder(created);
    } catch (e: any) {
      if (placed) {
        setPendingOrder({ id: placed._id, number: placed.orderNumber });
        toast({
          title: 'Order created — payment pending',
          description: 'Your order is saved. Open it to complete the payment.',
        });
      } else {
        toast({ title: 'Could not place order', description: getErrorMessage(e), variant: 'destructive' });
      }
    } finally {
      setPlacing(false);
      setPaying(false);
    }
  };

  // ------------------------------------------------------------------ views
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-3 py-5 max-w-5xl min-h-[720px] animate-pulse">
        <div className="mb-4 space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-7 w-56 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-80 max-w-full rounded bg-slate-100 dark:bg-slate-800/70" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-52 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="space-y-4">
            <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="h-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isCustomer) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl min-h-[720px] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <Zap className="h-10 w-10 mx-auto text-amber-500" />
            <h1 className="text-xl font-black">Login for Express Checkout</h1>
            <p className="text-sm text-muted-foreground">
              Express checkout is available to customer accounts. Log in to use your saved address.
            </p>
            <Button asChild className="w-full">
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/checkout/express?product=${productId}`)}`}>Log in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl min-h-[720px] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <p className="font-bold">{loadError || 'Product not found'}</p>
            <Button asChild variant="outline">
              <Link href="/products">Browse products</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (createdOrder) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl min-h-[720px] flex items-center justify-center">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="p-7 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Order placed!</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Order <span className="font-mono font-bold text-foreground">#{createdOrder.orderNumber}</span> ·{' '}
                {formatPrice(createdOrder.total)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {createdOrder.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'} · confirmation sent to you.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/products">Keep shopping</Link>
              </Button>
              <Button asChild className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                <Link href={`/user/orders/${createdOrder._id}`}>View order</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingOrder) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-5xl min-h-[720px] flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center space-y-3">
            <ShieldCheck className="h-10 w-10 mx-auto text-amber-500" />
            <h1 className="text-xl font-black">Order saved</h1>
            <p className="text-sm text-muted-foreground">
              {pendingOrder.number ? <>Order <strong>#{pendingOrder.number}</strong> was created. </> : null}
              Complete the payment from your order page.
            </p>
            <Button asChild className="w-full">
              <Link href={`/user/orders/${pendingOrder.id}`}>Complete payment</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (addressLoaded && !defaultAddress) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-5xl min-h-[720px] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <MapPin className="h-10 w-10 mx-auto text-amber-500" />
            <h1 className="text-xl font-black">Add your delivery address</h1>
            <p className="text-sm text-muted-foreground">
              Express checkout needs a saved default address. Add one in your profile and come back — it will be used for all
              future express orders.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/products/${product._id}`}>Back to product</Link>
              </Button>
              <Button asChild className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                <Link href="/user/profile">Add address</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const outOfStock = availableStock < quantity;
  const payNow = paymentMethod === 'cod' ? Math.min(codAdvance, totalPayable) : totalPayable;
  const payLater = paymentMethod === 'cod' ? Math.max(0, totalPayable - payNow) : 0;

  return (
    <div className="container mx-auto px-3 py-5 max-w-5xl min-h-[720px]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Express Checkout</h1>
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
              Saved address
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Review your item, apply a discount and pay — no address step needed.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href={`/products/${product._id}`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Product
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Item + variant selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-extrabold uppercase tracking-wide">Your item</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex gap-3">
                <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="80px" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm leading-snug">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[selectedSize && `Size ${selectedSize}`, selectedColor && `Colour ${selectedColor}`]
                      .filter(Boolean)
                      .join(' · ') || 'Standard'}
                  </p>
                  <p className="text-sm font-black mt-1.5">{formatPrice(unitPrice)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="h-7 w-7 rounded-lg border text-sm font-bold hover:bg-muted"
                    >
                      −
                    </button>
                    <span className="text-xs font-bold w-6 text-center">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                      className="h-7 w-7 rounded-lg border text-sm font-bold hover:bg-muted"
                    >
                      +
                    </button>
                    {availableStock > 0 && (
                      <span className={`text-[11px] ml-1 font-semibold ${outOfStock ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {outOfStock ? `Only ${availableStock} left` : `${availableStock} in stock`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {sizeOptions.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Size</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`h-8 min-w-9 px-2 rounded-lg text-[11px] font-bold border transition-colors ${
                          selectedSize === size
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-500 dark:text-slate-950 dark:border-amber-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {colorOptions.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Colour</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {colorOptions.map((color) => {
                      const opt = colorAttr?.options.find((o) => o.value === color);
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`h-8 px-2.5 rounded-lg text-[11px] font-bold border flex items-center gap-1.5 transition-colors ${
                            selectedColor === color
                              ? 'border-amber-500 bg-amber-500/10'
                              : 'border-slate-200 dark:border-slate-800 hover:border-amber-500'
                          }`}
                        >
                          {opt?.colorCode && (
                            <span
                              className="h-3 w-3 rounded-full border border-black/10"
                              style={{ backgroundColor: opt.colorCode }}
                            />
                          )}
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved address */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                <MapPin className="h-4 w-4 text-amber-500" /> Deliver to
              </CardTitle>
              <CardDescription className="text-xs">Your default saved address</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {defaultAddress ? (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="text-xs">
                    <p className="font-bold">{defaultAddress.street}</p>
                    <p className="text-muted-foreground">
                      {defaultAddress.city}, {defaultAddress.state} — {defaultAddress.zip}
                    </p>
                    <p className="text-muted-foreground">{defaultAddress.country}</p>
                  </div>
                  <Link href="/user/profile" className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1 shrink-0">
                    <Pencil className="h-3 w-3" /> Change
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Loading saved address…</p>
              )}
              {addresses.length > 1 && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Other saved addresses are available in <Link href="/user/profile" className="font-bold text-amber-600 hover:underline">your profile</Link>.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Discounts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                <Ticket className="h-4 w-4 text-amber-500" /> Discounts
              </CardTitle>
              <CardDescription className="text-xs">Apply a coupon or pick an available offer</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {coupon ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-mono tracking-wide">{coupon.code}</span>
                    {coupon.discount > 0 ? (
                      <span className="text-emerald-600 font-extrabold">−{formatPrice(coupon.discount)}</span>
                    ) : coupon.freeShipping ? (
                      <span className="text-emerald-600 font-extrabold">FREE shipping</span>
                    ) : null}
                  </span>
                  <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive" aria-label="Remove coupon">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={couponDraft}
                      onChange={(e) => {
                        setCouponDraft(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      placeholder="Coupon code (e.g. MENTOOS15)"
                      className="h-9 text-xs font-mono uppercase"
                      maxLength={24}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          applyCoupon();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 shrink-0"
                      disabled={couponDraft.trim().length < 3 || couponBusy}
                      onClick={() => applyCoupon()}
                    >
                      {couponBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                  {couponError && <p className="text-[11px] font-semibold text-rose-500">{couponError}</p>}
                </>
              )}

              {availableCoupons.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Available offers</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {availableCoupons.map((d) => {
                      const eligible = !d.minPurchase || subtotal >= d.minPurchase;
                      return (
                        <button
                          key={d.code}
                          type="button"
                          disabled={!eligible || couponBusy}
                          onClick={() => applyCoupon(d.code)}
                          title={d.description || (eligible ? 'Apply coupon' : `Minimum order ${formatPrice(d.minPurchase || 0)}`)}
                          className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-colors ${
                            eligible
                              ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10'
                              : 'border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <span className="font-mono">{d.code}</span>
                          <span className="text-muted-foreground ml-1">
                            {d.freeShipping
                              ? 'free shipping'
                              : d.type === 'percentage'
                                ? `${d.value}% off`
                                : d.value
                                  ? `₹${d.value} off`
                                  : 'offer'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide">
                <CreditCard className="h-4 w-4 text-amber-500" /> Payment
              </CardTitle>
              <CardDescription className="text-xs">Choose prepaid or cash on delivery</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2.5">
              {methods && !methods.razorpayConfigured && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[11px]">
                  Online payments are not configured — COD is available.
                </div>
              )}
              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay')}
                disabled={Boolean(methods && !methods.razorpayConfigured)}
                className={`w-full text-left p-3 rounded-xl border flex gap-3 transition-colors ${
                  methods && !methods.razorpayConfigured
                    ? 'opacity-50 cursor-not-allowed border-border'
                    : paymentMethod === 'razorpay'
                      ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                      : 'border-border hover:border-amber-500/50'
                }`}
              >
                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${paymentMethod === 'razorpay' ? 'border-amber-500' : 'border-muted-foreground/40'}`}>
                  {paymentMethod === 'razorpay' && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                </span>
                <CreditCard className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-xs font-bold">Prepaid — UPI / Card / Netbanking</span>
                  <span className="block text-[11px] text-muted-foreground">Pay {formatPrice(totalPayable)} now via Razorpay</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                disabled={!codAllowed}
                className={`w-full text-left p-3 rounded-xl border flex gap-3 transition-colors ${
                  !codAllowed
                    ? 'opacity-50 cursor-not-allowed border-border'
                    : paymentMethod === 'cod'
                      ? 'border-amber-500 bg-amber-500/5 shadow-sm'
                      : 'border-border hover:border-amber-500/50'
                }`}
              >
                <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${paymentMethod === 'cod' ? 'border-amber-500' : 'border-muted-foreground/40'}`}>
                  {paymentMethod === 'cod' && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                </span>
                <Banknote className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-xs font-bold">
                    Cash on Delivery{codAdvance > 0 ? ` — pay ${formatPrice(codAdvance)} now` : ''}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {!codAllowed
                      ? codQuote?.reason || 'COD is unavailable for this order.'
                      : codAdvance > 0
                        ? `Prepaid advance now, ${formatPrice(Math.max(0, totalPayable - codAdvance))} on delivery`
                        : `Pay ${formatPrice(totalPayable)} on delivery`}
                  </span>
                </span>
              </button>

              {codQuote?.reason && paymentMethod === 'cod' && codAllowed && (
                <p className="text-[11px] text-muted-foreground">{codQuote.reason}</p>
              )}

              {!codAllowed && paymentMethod === 'cod' && (
                <p className="text-[11px] font-semibold text-rose-500">Switch to prepaid to continue.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="lg:sticky lg:top-20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-extrabold uppercase tracking-wide">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({quantity} item{quantity > 1 ? 's' : ''})</span>
                <span className="font-bold">{formatPrice(subtotal)}</span>
              </div>
              {discountPreview > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({coupon?.code})</span>
                  <span className="font-bold">−{formatPrice(discountPreview)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> Shipping
                </span>
                <span className="font-bold">
                  {shippingLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : shippingCharge === 0 ? (
                    <span className="text-emerald-600">FREE</span>
                  ) : (
                    formatPrice(shippingCharge)
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="font-extrabold">Total</span>
                <span className="font-black">{formatPrice(totalPayable)}</span>
              </div>
              {paymentMethod === 'cod' && (
                <div className="rounded-lg bg-muted/60 px-2.5 py-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Pay now (advance)</span>
                    <span className="font-bold">{formatPrice(payNow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pay on delivery</span>
                    <span className="font-bold">{formatPrice(payLater)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handlePlaceOrder}
                disabled={placing || outOfStock || (paymentMethod === 'cod' && !codAllowed)}
                className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl"
              >
                {placing || paying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {paying ? 'Waiting for Razorpay…' : 'Placing order…'}
                  </>
                ) : (
                  <>
                    {paymentMethod === 'cod'
                      ? codAdvance > 0
                        ? `Pay ${formatPrice(payNow)} & Place COD`
                        : 'Place COD Order'
                      : `Pay ${formatPrice(totalPayable)}`}
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Secure payment · address verified
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
