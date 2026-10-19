'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrder, cancelOrder, repeatOrder, Order, OrderStatus, PaymentStatus } from '@/lib/api/orders';
import { paymentsApi, openRazorpayCheckout } from '@/lib/api/payments';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import {
  Package,
  MapPin,
  CreditCard,
  ArrowLeft,
  X,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Clock,
  Truck,
  Ban,
  FileText,
} from 'lucide-react';
import Image from 'next/image';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface OrderDetailClientProps {
  orderId: string;
}

const getStatusBadgeVariant = (status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'outline';
    case OrderStatus.PROCESSING:
    case OrderStatus.PACKED:
      return 'default';
    case OrderStatus.SHIPPED:
    case OrderStatus.OUT_FOR_DELIVERY:
      return 'default';
    case OrderStatus.DELIVERED:
      return 'secondary';
    case OrderStatus.CANCELLED:
      return 'destructive';
    case OrderStatus.REFUNDED:
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return <Clock className="h-5 w-5" />;
    case OrderStatus.PROCESSING:
      return <Package className="h-5 w-5" />;
    case OrderStatus.PACKED:
      return <Package className="h-5 w-5" />;
    case OrderStatus.SHIPPED:
      return <Truck className="h-5 w-5" />;
    case OrderStatus.OUT_FOR_DELIVERY:
      return <Truck className="h-5 w-5" />;
    case OrderStatus.DELIVERED:
      return <CheckCircle2 className="h-5 w-5" />;
    case OrderStatus.CANCELLED:
    case OrderStatus.REFUNDED:
      return <Ban className="h-5 w-5" />;
    default:
      return <Package className="h-5 w-5" />;
  }
};

const getStatusLabel = (status: OrderStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getPaymentStatusLabel = (status: PaymentStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
  const [returnItems, setReturnItems] = useState<Record<number, boolean>>({});
  const [returnReason, setReturnReason] = useState('');
  const [exchangeSize, setExchangeSize] = useState('');
  const [returning, setReturning] = useState(false);
  const [refundMethod, setRefundMethod] = useState<'source' | 'upi' | 'bank'>('source');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [liveTrack, setLiveTrack] = useState<any>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await getOrder(orderId);
      if (response.success && response.data) {
        setOrder(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load order:', error);
      if (error.response?.status === 404) {
        toast({
          title: 'Order Not Found',
          description: 'The order you are looking for does not exist.',
          variant: 'destructive',
        });
        router.push('/user/orders');
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to load order. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reason?: string) => {
    setCancelling(true);
    try {
      await cancelOrder(orderId, reason ? { reason } : undefined);
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled successfully.',
      });
      await loadOrder();
      setShowCancelModal(false);
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to cancel order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleRepeatOrder = async () => {
    setRepeating(true);
    try {
      const response = await repeatOrder(orderId);
      toast({
        title: 'Order Created',
        description: 'Your order has been created successfully.',
      });
      router.push(`/user/orders/${response.data._id}`);
    } catch (error: any) {
      console.error('Failed to repeat order:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to create order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRepeating(false);
    }
  };

  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };

  const canCancel = order && (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING);

  // Gap-4: retry a failed/abandoned online payment from the order page.
  // COD orders retry the confirmation advance; prepaid orders retry the balance.
  const [paying, setPaying] = useState(false);
  const canRetryPayment =
    order &&
    (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) &&
    (order.paymentStatus === PaymentStatus.PENDING || (order.paymentStatus as string) === 'failed') &&
    ((order.paymentMethod === 'cod' && (order.codBalance || 0) > 0 && (order.codAdvancePaid || 0) <= 0) ||
      (order.paymentMethod !== 'cod' && order.paymentMethod !== 'manual'));

  const handleRetryPayment = async () => {
    if (!order) return;
    const isCodAdvance = order.paymentMethod === 'cod';
    setPaying(true);
    try {
      const created = await paymentsApi.createOrder(
        0,
        isCodAdvance ? 'cod_advance' : 'full',
        order._id
      );
      const resp = await openRazorpayCheckout({
        keyId: created.keyId,
        orderId: created.razorpayOrderId,
        amountPaise: created.amountPaise,
        description: isCodAdvance ? `COD advance for ${order.orderNumber}` : `Payment for ${order.orderNumber}`,
      });
      await paymentsApi.verify({
        razorpayOrderId: resp.razorpay_order_id,
        razorpayPaymentId: resp.razorpay_payment_id,
        razorpaySignature: resp.razorpay_signature,
        orderId: order._id,
      });
      toast({
        title: isCodAdvance ? 'Advance paid' : 'Payment successful',
        description: isCodAdvance
          ? `COD advance received. Pay balance on delivery.`
          : 'Your order payment is confirmed.',
      });
      await loadOrder();
    } catch (error: any) {
      const msg = getErrorMessage(error);
      if (msg !== 'Payment cancelled by user') {
        toast({ title: 'Payment failed', description: msg, variant: 'destructive' });
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/user/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-xl">
          <Link href={`/user/orders/${order._id}/invoice`} target="_blank">
            <FileText className="h-4 w-4 mr-2 text-amber-500" />
            Tax Invoice
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant={getStatusBadgeVariant(order.status)} className="text-base px-3 py-1">
                    {getStatusLabel(order.status)}
                  </Badge>
                  {order.cancelledReason && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Reason: {order.cancelledReason}
                    </p>
                  )}
                </div>
                {canRetryPayment && (
                  <Button
                    size="sm"
                    onClick={handleRetryPayment}
                    disabled={paying}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                  >
                    {paying ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {order.paymentMethod === 'cod'
                      ? `Pay COD Advance ${formatPrice(order.codBalance || 0)}`
                      : 'Complete Payment'}
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
                {(order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRepeatOrder}
                    disabled={repeating}
                  >
                    {repeating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Repeat Order
                  </Button>
                )}
                {(order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const init: Record<number, boolean> = {};
                      order.items.forEach((_, i) => { init[i] = true; });
                      setReturnItems(init);
                      setReturnReason('');
                      setReturnType('exchange');
                      setShowReturnDialog(true);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Return / Exchange
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipment & Live Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-4 w-4" />
                Shipment & Live Tracking
              </CardTitle>
              <CardDescription>Courier, AWB and live status (auto-pushed to Shiprocket on admin confirmation)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-muted-foreground">Courier</p><p className="font-semibold">{(order as any).shiprocketCourier || 'Assigning…'}</p></div>
                <div><p className="text-xs text-muted-foreground">AWB / Tracking No</p><p className="font-semibold break-all">{(order as any).shiprocketAWB || (order as any).trackingNumber || (order as any).shiprocketShipmentId || '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Shiprocket Status</p><p className="font-semibold">{(order as any).shiprocketStatus || order.status}</p></div>
                <div><p className="text-xs text-muted-foreground">Expected Delivery</p><p className="font-semibold">{(order as any).estimatedDelivery ? new Date((order as any).estimatedDelivery).toLocaleDateString('en-IN') : '—'}</p></div>
              </div>
              {(order as any).trackingUrl && <Link href={(order as any).trackingUrl} target="_blank" className="text-xs font-bold text-amber-600 hover:underline">Open courier tracking link →</Link>}
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm" variant="outline" className="h-8 text-xs"
                  disabled={liveLoading || !((order as any).shiprocketAWB || (order as any).trackingNumber)}
                  onClick={async () => {
                    setLiveLoading(true);
                    try {
                      const { shipmentApi } = await import('@/lib/api/shipment');
                      const awb = (order as any).shiprocketAWB || (order as any).trackingNumber;
                      setLiveTrack(await shipmentApi.liveTrack(awb));
                      toast({ title: 'Live status refreshed' });
                    } catch (e: any) {
                      toast({ title: 'Live tracking unavailable', description: e.response?.data?.error || e.message, variant: 'destructive' });
                    } finally { setLiveLoading(false); }
                  }}
                >{liveLoading ? 'Refreshing…' : 'Refresh Live Status'}</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" asChild><Link href="/track-order">Track by Order No</Link></Button>
              </div>
              {liveTrack && <pre className="text-[11px] bg-muted p-2 rounded-lg overflow-auto max-h-40">{JSON.stringify(liveTrack, null, 2)}</pre>}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => {
                  const productId = typeof item.productId === 'object' && item.productId !== null && '_id' in item.productId
                    ? (item.productId as any)._id.toString()
                    : item.productId?.toString() || '';
                  return (
                  <div key={index} className="flex gap-4">
                    <Link href={`/products/${productId}`}>
                      <div className="relative h-24 w-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                        {item.product?.images && item.product.images.length > 0 && (
                          <Image
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.name || 'Product'}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${productId}`}>
                        <h3 className="font-semibold hover:underline line-clamp-2">
                          {item.product?.name || 'Product'}
                        </h3>
                      </Link>
                      <div className="text-sm text-muted-foreground mt-1">
                        SKU: {item.product?.sku || 'N/A'}
                      </div>
                      {item.variations && item.variations.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.variations.map((v) => (
                            <span key={`${v.name}-${v.value}`} className="mr-2">
                              {v.name}: {v.value}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-2">
                        Quantity: {item.quantity} × {formatPrice(item.price)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(item.subtotal)}</div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="font-medium">{order.shippingAddress.street}</div>
                <div className="text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </div>
                <div className="text-muted-foreground">{order.shippingAddress.country}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Status */}
              <div>
                <div className="text-sm text-muted-foreground mb-2">Payment Status</div>
                <Badge variant={order.paymentStatus === PaymentStatus.CONFIRMED ? 'default' : 'outline'}>
                  <CreditCard className="h-3 w-3 mr-1" />
                  {getPaymentStatusLabel(order.paymentStatus)}
                </Badge>
                {order.paymentNotes && (
                  <p className="text-sm text-muted-foreground mt-2">{order.paymentNotes}</p>
                )}
              </div>

              <Separator />

              {/* Payment Method */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Payment Method</div>
                <div className="font-medium capitalize">{order.paymentMethod}</div>
              </div>

              <Separator />

              {/* Order Date */}
              <div>
                <div className="text-sm text-muted-foreground mb-1">Order Date</div>
                <div className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                {order.refundAmount ? (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Refunded</span>
                      <span>-{formatPrice(order.refundAmount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {((order as any).refundStatus === 'completed')
                        ? (((order as any).refundMethod || 'source') === 'source'
                          ? 'Refunded to your original payment method. Bank/UPI refunds reflect in 5–7 working days.'
                          : 'Refund sent to your UPI / bank account.')
                        : ((order as any).refundStatus === 'processing'
                          ? 'Refund initiated — completing shortly, you will be notified.'
                          : 'Refund is being processed.')}
                    </p>
                    {((order as any).refundReference) && (
                      <p className="text-xs text-muted-foreground font-mono">Ref: {(order as any).refundReference}</p>
                    )}
                    {order.refundNotes && (
                      <p className="text-xs text-muted-foreground">{order.refundNotes}</p>
                    )}
                  </>
                ) : (((order as any).refundStatus === 'pending' || (order as any).refundStatus === 'processing') && (
                  <>
                    <Separator />
                    <p className="text-xs text-muted-foreground">Refund initiated — you will be notified on completion.</p>
                  </>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(order.total - (order.refundAmount || 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        title="Cancel Order"
        description={`Are you sure you want to cancel order #${order.orderNumber}? This action cannot be undone.`}
        confirmText="Cancel Order"
        cancelText="Keep Order"
        onConfirm={() => handleCancel()}
        variant="destructive"
      />

      {/* Return / Exchange Dialog */}
      {showReturnDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setShowReturnDialog(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-extrabold text-lg">Request {returnType === 'exchange' ? 'Exchange' : 'Return'}</h3>
            <p className="text-xs text-muted-foreground">7-day easy exchange · pickup arranged after approval · updates on WhatsApp</p>
            <div className="flex gap-2">
              {(['exchange', 'return'] as const).map((t) => (
                <Button key={t} size="sm" variant={returnType === t ? 'default' : 'outline'} onClick={() => setReturnType(t)} className="capitalize">{t}</Button>
              ))}
            </div>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <label key={i} className="flex items-center gap-2 text-sm border rounded-xl p-2 cursor-pointer">
                  <input type="checkbox" checked={!!returnItems[i]} onChange={(e) => setReturnItems({ ...returnItems, [i]: e.target.checked })} className="w-4 h-4" />
                  <span className="flex-1 font-medium line-clamp-1">{item.product?.name || 'Product'} × {item.quantity}</span>
                  <span className="text-muted-foreground">{formatPrice(item.subtotal)}</span>
                </label>
              ))}
            </div>
            {returnType === 'exchange' && (
              <div>
                <Label className="text-xs font-bold">Preferred size (exchange)</Label>
                <div className="flex gap-1.5 mt-1">
                  {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                    <button key={s} type="button" onClick={() => setExchangeSize(s)} className={`h-8 w-10 rounded-lg text-xs font-bold border ${exchangeSize === s ? 'bg-slate-900 text-white' : ''}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs font-bold">Reason *</Label>
              <textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={3} placeholder="e.g. Size too small, need XL" className="mt-1 w-full text-sm border rounded-xl p-2 bg-transparent" />
            </div>
            {returnType === 'return' && (
              <div className="space-y-2 rounded-xl border p-3">
                <Label className="text-xs font-bold">Refund destination *</Label>
                <div className="flex gap-2">
                  {(['source', 'upi', 'bank'] as const).map((m) => (
                    <Button key={m} size="sm" variant={refundMethod === m ? 'default' : 'outline'} onClick={() => setRefundMethod(m)} className="capitalize text-xs h-7">
                      {m === 'source' ? 'Original source' : m === 'upi' ? 'UPI' : 'Bank'}
                    </Button>
                  ))}
                </div>
                {refundMethod === 'upi' && (
                  <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="w-full text-sm border rounded-lg p-2 bg-transparent" />
                )}
                {refundMethod === 'bank' && (
                  <div className="grid grid-cols-1 gap-2">
                    <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Account holder name" className="w-full text-sm border rounded-lg p-2 bg-transparent" />
                    <input value={bankNumber} onChange={(e) => setBankNumber(e.target.value)} placeholder="Account number" className="w-full text-sm border rounded-lg p-2 bg-transparent" />
                    <input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} placeholder="IFSC (e.g. HDFC0001234)" className="w-full text-sm border rounded-lg p-2 bg-transparent" />
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">Refund is issued via Razorpay to the original source, or recorded against your UPI / bank account.</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={returning || !returnReason.trim() || !Object.values(returnItems).some(Boolean)}
                onClick={async () => {
                  setReturning(true);
                  try {
                    const { returnsApi } = await import('@/lib/api/returns');
                    const picked = order.items.map((item, i) => ({ item, i })).filter(({ i }) => returnItems[i]);
                    if (returnType === 'return' && refundMethod === 'upi' && !upiId.trim()) {
                      toast({ title: 'UPI ID required', description: 'Please enter your UPI ID for the refund.', variant: 'destructive' });
                      setReturning(false);
                      return;
                    }
                    if (returnType === 'return' && refundMethod === 'bank' && (!bankName.trim() || !bankNumber.trim() || !bankIfsc.trim())) {
                      toast({ title: 'Bank details required', description: 'Name, account number and IFSC are required.', variant: 'destructive' });
                      setReturning(false);
                      return;
                    }
                    await returnsApi.create({
                      orderId,
                      type: returnType,
                      reason: returnReason.trim(),
                      items: picked.map(({ item }) => ({
                        productId: typeof item.productId === 'object' ? (item.productId as any)._id : String(item.productId),
                        quantity: item.quantity,
                        reason: returnReason.trim(),
                        size: (item.variations || []).find((v: any) => v.name === 'Size')?.value,
                        exchangeSize: returnType === 'exchange' ? exchangeSize || undefined : undefined,
                      })),
                      ...(returnType === 'return'
                        ? {
                            refundMethod,
                            ...(refundMethod === 'upi' ? { upiId: upiId.trim() } : {}),
                            ...(refundMethod === 'bank'
                              ? { bankAccountName: bankName.trim(), bankAccountNumber: bankNumber.trim(), bankIfsc: bankIfsc.trim().toUpperCase() }
                              : {}),
                          }
                        : {}),
                    });
                    toast({ title: 'Request raised!', description: 'We will confirm pickup on WhatsApp shortly.' });
                    setShowReturnDialog(false);
                  } catch (e: any) {
                    toast({ title: 'Request failed', description: e.response?.data?.error || e.message, variant: 'destructive' });
                  } finally {
                    setReturning(false);
                  }
                }}
              >
                {returning ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

