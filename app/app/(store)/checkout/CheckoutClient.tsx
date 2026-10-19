'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/contexts/CartContext';
import { useAuth } from '@/lib/hooks/useAuth';
import { profileApi, Address } from '@/lib/api/profile';
import { createOrder, CreateOrderRequest } from '@/lib/api/orders';
import { paymentsApi, openRazorpayCheckout, PaymentMethods } from '@/lib/api/payments';
import { CouponInput, clearCoupon } from '@/components/cart/CouponInput';
import { settingsApi } from '@/lib/api/settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, getErrorMessage } from '@/lib/utils';
import {
  CreditCard,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Banknote,
  Smartphone,
  Wallet,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

type Step = 'address' | 'payment' | 'review' | 'confirmation';

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === '1';
  const { items, total, loading: cartLoading, refresh } = useCart();
  const { toast } = useToast();
  const { isAuthenticated, isCustomer } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('address');
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [guestItems, setGuestItems] = useState<any[]>([]);
  const [guestTotal, setGuestTotal] = useState(0);
  const [guestLoading, setGuestLoading] = useState(isGuest);
  const [guestPhone, setGuestPhone] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const effItems = isGuest ? guestItems : items;
  const effTotal = isGuest ? guestTotal : total;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, '_id' | 'isDefault'>>({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('razorpay');
  const [methods, setMethods] = useState<PaymentMethods | null>(null);
  const [codQuote, setCodQuote] = useState<{ advance: number; balance: number; codAllowed: boolean; reason: string } | null>(null);
  const [paidAmount, setPaidAmount] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  // Snapshot for the success screen (cart is cleared before confirmation shows)
  const [placedSummary, setPlacedSummary] = useState<{ count: number; total: number; items: Array<{ name: string; qty: number; subtotal: number; image?: string }> } | null>(null);
  const [redirectIn, setRedirectIn] = useState(12);
  const [checkoutTracked, setCheckoutTracked] = useState(false);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState('');

  useEffect(() => {
    loadAddresses();
    paymentsApi.methods().then(setMethods).catch(() => {});
    settingsApi.getPublic().catch(() => {});
    if (!isGuest) {
      import('@/lib/api/loyalty').then((m) =>
        m.loyaltyApi.getBalance().then((r) => setLoyaltyBalance(r.data?.balance || 0)).catch(() => {})
      );
    }
    if (isGuest) {
      (async () => {
        try {
          const { getGuestCart } = await import('@/lib/guestCart');
          const g = await getGuestCart();
          setGuestItems(g.items as any);
          setGuestTotal(g.total);
        } catch {
          setGuestItems([]);
        } finally {
          setGuestLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isGuest && items.length === 0 && !cartLoading && currentStep !== 'confirmation') {
      router.push('/cart');
    }
    if (isGuest && !guestLoading && guestItems.length === 0 && currentStep !== 'confirmation') {
      router.push('/cart');
    }
  }, [items, cartLoading, router, currentStep, isGuest, guestLoading, guestItems.length]);

  useEffect(() => {
    if (!checkoutTracked && effTotal > 0 && effItems.length > 0 && currentStep !== 'confirmation') {
      setCheckoutTracked(true);
      import('@/lib/analytics').then((m) => m.funnel.beginCheckout(effTotal, effItems.length)).catch(() => {});
    }
    if (currentStep === 'payment' && effTotal > 0) {
      const pin = isGuest ? guestPhone.replace(/\D/g, '').slice(-10) : (useNewAddress ? newAddress.zip : addresses.find((a) => a._id === selectedAddressId)?.zip);
      settingsApi.codQuote(effTotal, /^\d{6}$/.test(pin || '') ? pin : undefined).then((q) => {
        setCodQuote({ advance: q.advance, balance: q.balance, codAllowed: q.codAllowed, reason: q.reason });
        if (!q.codAllowed && paymentMethod === 'cod') setPaymentMethod('razorpay');
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effTotal, currentStep]);

  const loadAddresses = async () => {
    try {
      const userAddresses = await profileApi.getAddresses();
      setAddresses(userAddresses);
      if (userAddresses && userAddresses.length > 0) {
        const defaultAddress = userAddresses.find((addr) => addr.isDefault) || userAddresses[0];
        if (defaultAddress && defaultAddress._id) setSelectedAddressId(defaultAddress._id);
      } else {
        setUseNewAddress(true);
      }
    } catch {
      setUseNewAddress(true);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    setUseNewAddress(false);
  };

  const handleNewAddressChange = (field: keyof typeof newAddress, value: string) => {
    setNewAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = (address: Omit<Address, '_id' | 'isDefault'>): boolean => {
    return !!(address.street.trim() && address.city.trim() && address.state.trim() && address.zip.trim() && address.country.trim());
  };

  const handleContinueToPayment = () => {
    if (useNewAddress && !validateAddress(newAddress)) {
      toast({ title: 'Validation Error', description: 'Please fill in all address fields', variant: 'destructive' });
      return;
    }
    if (isGuest) {
      const digits = guestPhone.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(digits)) {
        toast({ title: 'Mobile needed', description: 'Enter a valid 10-digit mobile number for order updates.', variant: 'destructive' });
        return;
      }
    }
    setCurrentStep('payment');
  };

  const buildOrderPayload = (): CreateOrderRequest => {
    const orderData: CreateOrderRequest = { paymentMethod: paymentMethod === 'razorpay' ? 'razorpay' : paymentMethod };
    const pts = parseInt(loyaltyPoints || '0', 10);
    if (!isGuest && pts > 0) orderData.loyaltyPointsRedeemed = Math.min(pts, loyaltyBalance);
    try {
      const coupon = localStorage.getItem('mentoos_coupon');
      if (coupon) orderData.discountCode = coupon;
    } catch { /* ignore */ }
    if (useNewAddress) orderData.shippingAddress = newAddress;
    else if (selectedAddressId) orderData.shippingAddressId = selectedAddressId;
    else if (addresses.length > 0 && addresses[0]._id) orderData.shippingAddressId = addresses[0]._id;
    else orderData.shippingAddress = { street: 'Somandepalli Road', city: 'Somandepalle', state: 'Andhra Pradesh', zip: '515122', country: 'India' };
    return orderData;
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    // Tracks the created order across the payment steps so a mid-flow
    // session death can resume (re-login → order page → Complete Payment).
    let placedId: string | null = null;
    try {
      // 1. Create order (backend computes shipping + COD advance/balance)
      let created: any;
      if (isGuest) {
        if (!validateAddress(newAddress)) {
          toast({ title: 'Address needed', description: 'Please fill in all address fields.', variant: 'destructive' });
          setLoading(false);
          setCurrentStep('address');
          return;
        }
        const api = (await import('@/lib/api/client')).default;
        const guestPayload = {
          items: guestItems.map((g: any) => ({ productId: g.productId, quantity: g.quantity, variations: g.variations || [] })),
          phone: guestPhone.replace(/\D/g, '').slice(-10),
          email: guestEmail || undefined,
          name: guestName || undefined,
          shippingAddress: newAddress,
          paymentMethod: paymentMethod === 'razorpay' ? 'razorpay' : paymentMethod,
          discountCode: (() => { try { return localStorage.getItem('mentoos_coupon') || undefined; } catch { return undefined; } })(),
        };
        const res = await api.post('/orders/guest', guestPayload);
        created = res.data.data;
      } else {
        const response = await createOrder(buildOrderPayload());
        created = response.data;
      }
      const createdId = created._id;
      const createdTotal = created.total;
      const createdAdvance = created.codBalance !== undefined && paymentMethod === 'cod' ? created.total - (created.codBalance || 0) : 0;
      setOrderId(createdId);
      setOrderNumber(created.orderNumber);
      placedId = createdId;

      // 2. Decide payment path
      const needsRazorpay =
        paymentMethod === 'razorpay' || paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking' || paymentMethod === 'wallet';
      const guestPhoneClean = isGuest ? guestPhone.replace(/\D/g, '').slice(-10) : '';

      const payFull = async (amount: number, desc: string) => {
        if (isGuest) {
          const rp = await paymentsApi.guestCreateOrder(createdId, guestPhoneClean, 'full');
          const resp = await openRazorpayCheckout({ keyId: rp.keyId, orderId: rp.razorpayOrderId, amountPaise: rp.amountPaise, description: desc });
          await paymentsApi.guestVerify({ orderId: createdId, phone: guestPhoneClean, razorpayOrderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, razorpaySignature: resp.razorpay_signature });
        } else {
          const rp = await paymentsApi.createOrder(amount, 'full', createdId, paymentMethod);
          const resp = await openRazorpayCheckout({ keyId: rp.keyId, orderId: rp.razorpayOrderId, amountPaise: rp.amountPaise, description: desc });
          await paymentsApi.verify({ razorpayOrderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, razorpaySignature: resp.razorpay_signature, orderId: createdId });
        }
      };

      const payAdvance = async (amount: number, desc: string) => {
        if (isGuest) {
          const rp = await paymentsApi.guestCreateOrder(createdId, guestPhoneClean, 'cod_advance');
          const resp = await openRazorpayCheckout({ keyId: rp.keyId, orderId: rp.razorpayOrderId, amountPaise: rp.amountPaise, description: desc });
          await paymentsApi.guestVerify({ orderId: createdId, phone: guestPhoneClean, razorpayOrderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, razorpaySignature: resp.razorpay_signature });
        } else {
          const rp = await paymentsApi.createOrder(amount, 'cod_advance', createdId, 'cod_advance');
          const resp = await openRazorpayCheckout({ keyId: rp.keyId, orderId: rp.razorpayOrderId, amountPaise: rp.amountPaise, description: desc });
          await paymentsApi.verify({ razorpayOrderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, razorpaySignature: resp.razorpay_signature, orderId: createdId });
        }
      };

      if (needsRazorpay) {
        if (!methods?.razorpayConfigured) {
          toast({ title: 'Razorpay not configured', description: 'Admin must add RAZORPAY_KEY_ID/SECRET in server/.env. Order created, pay later.', variant: 'destructive' });
          if (!isGuest) await refresh();
          try {
            const { funnel } = await import('@/lib/analytics');
            funnel.purchase(created.orderNumber, createdTotal, effItems.map((it: any) => ({ item_id: it.productId, item_name: it.product?.name, price: it.price, quantity: it.quantity })));
          } catch { /* tracking optional */ }
          setCurrentStep('confirmation');
          return;
        }
        setPaying(true);
        await payFull(createdTotal, `Mentoos ${created.orderNumber}`);
        setPaidAmount(createdTotal);
        setBalanceDue(0);
      } else if (paymentMethod === 'cod') {
        const advance = codQuote?.advance ?? createdAdvance ?? 0;
        if (advance > 0) {
          if (!methods?.razorpayConfigured) {
            toast({ title: 'COD order created', description: `Pay ${formatPrice(advance)} advance on confirmation call. Balance ${formatPrice(created.codBalance || 0)} on delivery.` });
          } else {
            setPaying(true);
            await payAdvance(advance, `COD advance ${created.orderNumber}`);
            setPaidAmount(advance);
            setBalanceDue(created.codBalance || codQuote?.balance || 0);
          }
        } else {
          setPaidAmount(0);
          setBalanceDue(createdTotal);
        }
      } else {
        setPaidAmount(0);
        setBalanceDue(createdTotal);
      }

      if (isGuest) {
        const { clearGuestCart } = await import('@/lib/guestCart');
        clearGuestCart();
      } else {
        await refresh();
      }
      // Snapshot for the success screen before cart state empties
      setPlacedSummary({
        count: effItems.length,
        total: createdTotal,
        items: effItems.slice(0, 3).map((it: any) => ({
          name: it.product?.name || 'Item',
          qty: it.quantity,
          subtotal: it.subtotal,
          image: typeof it.product?.images?.[0] === 'string' ? it.product.images[0] : it.product?.images?.[0]?.url,
        })),
      });
      setRedirectIn(12);
      try {
        localStorage.removeItem('mentoos_coupon');
      } catch { /* ignore */ }
      try {
        const { funnel } = await import('@/lib/analytics');
        funnel.purchase(created.orderNumber, createdTotal, effItems.map((it: any) => ({ item_id: it.productId, item_name: it.product?.name, price: it.price, quantity: it.quantity })));
      } catch { /* tracking optional */ }
      setCurrentStep('confirmation');
      toast({ title: 'Order Placed Successfully', description: `Order #${created.orderNumber} placed!${isGuest ? ' Login with OTP on the same mobile to track it.' : ''}` });
    } catch (error: any) {
      const status = error?.response?.status;
      // Session died mid-payment (e.g. token expired while the Razorpay
      // popup was open). The order itself exists — send the shopper to log
      // back in and land straight on it, where Complete Payment retries.
      // Never show raw "Invalid or expired token" for this case.
      if (status === 401 && placedId && !isGuest) {
        toast({
          title: 'Session expired during payment',
          description: 'Your order was created. Please log in again — you will land on it to complete payment.',
        });
        router.push(`/login?callbackUrl=${encodeURIComponent(`/user/orders/${placedId}`)}&expired=1`);
      } else {
        const errorMsg = getErrorMessage(error) || 'Failed to place order.';
        toast({ title: 'Order Error', description: errorMsg, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
      setPaying(false);
    }
  };

  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };

  // Auto-redirect home from the success screen (cancelled by any navigation)
  useEffect(() => {
    if (currentStep !== 'confirmation') return;
    if (redirectIn <= 0) {
      router.push('/');
      return;
    }
    const t = setTimeout(() => setRedirectIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [currentStep, redirectIn, router]);

  if (cartLoading || guestLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (effItems.length === 0 && currentStep !== 'confirmation') {
    // Staff accounts are dashboard-only and cannot shop — explain instead of blank.
    if (!isGuest && isAuthenticated && !isCustomer) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <p className="font-bold text-lg">Checkout is for customers</p>
              <p className="text-sm text-muted-foreground">Staff accounts (admin/superadmin) can browse the store but cannot place orders. Please log in with a customer account to shop, or continue in the dashboard.</p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline"><Link href="/products">Browse Products</Link></Button>
                <Button asChild><Link href="/admin/dashboard">Go to Dashboard</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return null;
  }

  const steps: Step[] = ['address', 'payment', 'review', 'confirmation'];
  const stepLabels = ['Address', 'Payment', 'Review', 'Confirmation'];

  return (
    <div className="container mx-auto px-3 py-5 max-w-6xl">
      <div className="mb-5">
        <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-4 flex-wrap">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${currentStep === s ? 'bg-primary text-primary-foreground' : steps.indexOf(currentStep) > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {steps.indexOf(currentStep) > i ? <CheckCircle2 className="h-4 w-4" /> : `${i + 1}`}
              </div>
              <span className={currentStep === s ? 'font-semibold text-xs' : 'text-xs text-muted-foreground'}>{stepLabels[i]}</span>
              {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {currentStep === 'address' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" /> Shipping Address</CardTitle>
                <CardDescription className="text-xs">{isGuest ? 'Guest checkout — no login needed. Track via OTP on your mobile.' : 'Select or enter a shipping address'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {isGuest && (
                  <div className="space-y-4 p-4 border rounded-lg bg-amber-500/5 border-amber-500/20">
                    <div>
                      <Label htmlFor="guestPhone">Mobile Number * (order updates + tracking)</Label>
                      <Input id="guestPhone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 13))} placeholder="9876543210" inputMode="numeric" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label htmlFor="guestName">Name</Label><Input id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Your name" /></div>
                      <div><Label htmlFor="guestEmail">Email (optional)</Label><Input id="guestEmail" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="you@example.com" /></div>
                    </div>
                  </div>
                )}
                {addresses.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wide">Select an existing address</Label>
                    {addresses.map((address) => {
                      const active = selectedAddressId === address._id && !useNewAddress;
                      return (
                        <div key={address._id} onClick={() => handleAddressSelect(address._id || '')} className={`p-3 border rounded-xl cursor-pointer flex gap-3 transition-all ${active ? 'border-amber-500 bg-amber-500/5 shadow-sm' : 'border-border hover:border-amber-500/50'}`}>
                          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-amber-500' : 'border-muted-foreground/40'}`}>
                            {active && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm">{address.street}</div>
                            <div className="text-xs text-muted-foreground">{address.city}, {address.state} {address.zip}</div>
                            <div className="text-xs text-muted-foreground">{address.country}</div>
                            {address.isDefault && <Badge variant="secondary" className="mt-1.5 text-[10px]">Default</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="useNewAddress" checked={useNewAddress} onChange={(e) => { setUseNewAddress(e.target.checked); if (e.target.checked) setSelectedAddressId(null); }} className="w-4 h-4" />
                    <Label htmlFor="useNewAddress" className="cursor-pointer font-medium">Use a new address</Label>
                  </div>
                  {useNewAddress && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div><Label>Street *</Label><Input value={newAddress.street} onChange={(e) => handleNewAddressChange('street', e.target.value)} placeholder="123 Main St" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>City *</Label><Input value={newAddress.city} onChange={(e) => handleNewAddressChange('city', e.target.value)} /></div>
                        <div><Label>State *</Label><Input value={newAddress.state} onChange={(e) => handleNewAddressChange('state', e.target.value)} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>PIN *</Label><Input value={newAddress.zip} maxLength={6} onChange={(e) => handleNewAddressChange('zip', e.target.value)} placeholder="515122" /></div>
                        <div><Label>Country *</Label><Input value={newAddress.country} onChange={(e) => handleNewAddressChange('country', e.target.value)} /></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" asChild><Link href="/cart"><ArrowLeft className="h-4 w-4 mr-2" />Back to Cart</Link></Button>
                  <Button onClick={handleContinueToPayment} className="flex-1">Continue to Payment<ChevronRight className="h-4 w-4 ml-2" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'payment' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" /> Payment Method</CardTitle>
                <CardDescription className="text-xs">UPI / Cards via Razorpay, or COD with confirmation advance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {!methods?.razorpayConfigured && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">Razorpay keys not configured yet — online payments will fail. COD/Manual still works. Admin: set RAZORPAY_KEY_ID/SECRET.</div>
                )}
                {[
                  { id: 'razorpay', icon: Smartphone, title: 'UPI / Card / Netbanking / Wallet', desc: 'Via Razorpay — fastest confirmation', disabled: false, tag: 'Recommended' },
                  { id: 'cod', icon: Banknote, title: `Cash on Delivery${codQuote && codQuote.advance > 0 ? ` (pay ${formatPrice(codQuote.advance)} advance now)` : ''}`, desc: codQuote && !codQuote.codAllowed ? codQuote.reason : codQuote && codQuote.advance > 0 ? `${codQuote.reason ? codQuote.reason + '. ' : ''}Balance ${formatPrice(codQuote.balance)} on delivery.` : 'Pay full amount on delivery', disabled: !!codQuote && !codQuote.codAllowed },
                  { id: 'manual', icon: ShieldCheck, title: 'Manual / Pay Later', desc: 'Admin confirms payment later', disabled: false },
                ].map((m) => (
                  <div key={m.id} onClick={() => { if (!m.disabled) setPaymentMethod(m.id); }} className={`p-3.5 border rounded-xl flex gap-3 transition-all ${m.disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${paymentMethod === m.id ? 'border-amber-500 bg-amber-500/5 shadow-sm' : 'border-border hover:border-amber-500/50'}`}`}>
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${paymentMethod === m.id && !m.disabled ? 'border-amber-500' : 'border-muted-foreground/40'}`}>
                      {paymentMethod === m.id && !m.disabled && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                    </span>
                    <m.icon className="h-5 w-5 mt-0 shrink-0 text-amber-600" />
                    <div className="min-w-0"><div className="font-bold text-sm flex items-center gap-2 flex-wrap">{m.title}{'tag' in m && (m as any).tag && <span className="text-[10px] font-black uppercase bg-amber-500 text-slate-950 rounded-md px-1.5 py-0.5">{(m as any).tag}</span>}</div><div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div></div>
                  </div>
                ))}
                <div className="flex gap-2 text-[11px] text-muted-foreground items-center"><Wallet className="h-3.5 w-3.5" /> UPI <Landmark className="h-3.5 w-3.5 ml-2" /> Netbanking <CreditCard className="h-3.5 w-3.5 ml-2" /> Cards — all processed securely by Razorpay. No card data touches our servers.</div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setCurrentStep('address')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                  <Button onClick={() => setCurrentStep('review')} className="flex-1">Continue to Review<ChevronRight className="h-4 w-4 ml-2" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'review' && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Review Your Order</CardTitle><CardDescription className="text-xs">Payment: {paymentMethod.toUpperCase()}{paymentMethod === 'cod' && codQuote && codQuote.advance > 0 ? ` — advance ${formatPrice(codQuote.advance)}, balance ${formatPrice(codQuote.balance)}` : ''}</CardDescription></CardHeader>
              <CardContent className="space-y-4 pt-0">
                {(() => {
                  const addr = useNewAddress
                    ? newAddress
                    : (addresses.find((a) => a._id === selectedAddressId) || addresses[0] || newAddress) as any;
                  return addr && (addr.street || addr.city) ? (
                    <div className="flex items-start justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5 text-xs">
                      <div className="flex gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <span className="font-bold">Deliver to: </span>
                          {[addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <button onClick={() => setCurrentStep('address')} className="font-bold text-primary hover:underline shrink-0">Change</button>
                    </div>
                  ) : null;
                })()}
                <div className="rounded-xl border divide-y">
                  {effItems.slice(0, 4).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 text-xs">
                      <span className="font-semibold truncate flex-1">{item.product?.name} <span className="text-muted-foreground font-medium">× {item.quantity}</span></span>
                      <span className="font-bold whitespace-nowrap">{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                  {effItems.length > 4 && <div className="px-3 py-1.5 text-[11px] text-muted-foreground">+{effItems.length - 4} more item(s) — full list in Order Summary</div>}
                </div>
                {!isGuest && loyaltyBalance > 0 && (
                  <div className="p-4 border rounded-xl bg-amber-500/5 border-amber-500/20 space-y-2">
                    <Label className="font-bold text-xs">Loyalty Points — you have {loyaltyBalance} pts (100 pts = ₹1)</Label>
                    <div className="flex gap-2">
                      <Input type="number" min={0} max={loyaltyBalance} value={loyaltyPoints} onChange={(e) => setLoyaltyPoints(e.target.value.replace(/\D/g, ''))} placeholder="Points to redeem" className="text-xs" />
                      {loyaltyPoints && <span className="text-xs font-bold self-center">= ₹{(parseInt(loyaltyPoints || '0', 10) / 100).toFixed(2)} off</span>}
                    </div>
                  </div>
                )}
                <div className="flex gap-2.5">
                  <Button variant="outline" onClick={() => setCurrentStep('payment')}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                  <Button onClick={handlePlaceOrder} disabled={loading || paying} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black">
                    {(loading || paying) ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{paying ? 'Waiting for Razorpay…' : 'Placing Order...'}</> : <>{paymentMethod === 'cod' ? 'Place COD Order' : 'Pay & Place Order'}<ChevronRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'confirmation' && (
            <div className="lg:col-span-3 max-w-2xl mx-auto w-full text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Order placed successfully!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {orderNumber ? <>Order <span className="font-mono font-bold text-foreground">#{orderNumber}</span></> : 'Your order has been placed'}
                  {' '}· confirmation sent{isGuest ? ' to your mobile' : ' via SMS, WhatsApp & email'}
                </p>
              </div>
              <Card className="text-left">
                <CardContent className="p-4 space-y-3 text-sm">
                  {placedSummary && placedSummary.items.length > 0 && (
                    <div className="space-y-2">
                      {placedSummary.items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          {it.image ? (
                            <span className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 inline-block">
                              <Image src={it.image} alt={it.name} fill className="object-cover" sizes="40px" />
                            </span>
                          ) : null}
                          <span className="font-medium truncate flex-1 text-xs">{it.name} <span className="text-muted-foreground">× {it.qty}</span></span>
                          <span className="font-bold text-xs whitespace-nowrap">{formatPrice(it.subtotal)}</span>
                        </div>
                      ))}
                      {placedSummary.count > placedSummary.items.length && (
                        <p className="text-[11px] text-muted-foreground">+{placedSummary.count - placedSummary.items.length} more item(s)</p>
                      )}
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Order total</span><span className="font-black">{placedSummary ? formatPrice(placedSummary.total) : ''}</span></div>
                  {paidAmount > 0 ? (
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Paid online</span><span className="font-bold text-emerald-600">{formatPrice(paidAmount)}{balanceDue > 0 ? ` · balance ${formatPrice(balanceDue)} on delivery` : ' · fully paid'}</span></div>
                  ) : (
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Payment</span><span className="font-bold">{paymentMethod === 'cod' ? `COD · keep ${formatPrice(balanceDue)} ready on delivery` : 'To be confirmed by admin'}</span></div>
                  )}
                  <p className="text-[11px] text-muted-foreground">Delivery in 3–5 working days · live tracking on the Track Order page.</p>
                </CardContent>
              </Card>
              <div className="flex gap-2 justify-center flex-wrap">
                <Button asChild><Link href="/track-order">Track Order</Link></Button>
                {orderId && !isGuest && <Button asChild variant="outline"><Link href={`/user/orders/${orderId}`}>View Order</Link></Button>}
                <Button asChild variant="outline"><Link href="/products">Continue Shopping</Link></Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Returning to homepage in {redirectIn}s…</p>
            </div>
          )}
        </div>

        {(currentStep === 'address' || currentStep === 'payment' || currentStep === 'review') && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3"><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-3">
                  {effItems.map((item, index) => (
                    <div key={`${item.productId}-${index}`} className="flex gap-3">
                      <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                        {item.product.images && item.product.images.length > 0 && <Image src={getImageUrl(item.product.images[0])} alt={item.product.name} fill className="object-cover" sizes="64px" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm line-clamp-2">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price)}</div>
                      </div>
                      <div className="text-sm font-medium">{formatPrice(item.subtotal)}</div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(effTotal)}</span></div>
                <CouponInput items={effItems.map((it: any) => ({ productId: it.productId, quantity: it.quantity }))} />
                {(() => {
                  let coupon = '';
                  try { coupon = localStorage.getItem('mentoos_coupon') || ''; } catch { /* ignore */ }
                  return coupon ? (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Coupon <span className="font-mono font-bold">{coupon}</span></span>
                      <span className="text-emerald-600 font-bold">validated on order</span>
                    </div>
                  ) : null;
                })()}
                <div className="text-xs text-muted-foreground">Shipping + COD advance + coupon calculated on order creation.</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
