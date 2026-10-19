'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getOrder,
  updateOrderStatus,
  confirmPayment,
  refundOrder,
  completeManualRefund,
  Order,
  OrderStatus,
  PaymentStatus,
  UpdateOrderStatusRequest,
  RefundOrderRequest,
} from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import {
  Package,
  MapPin,
  CreditCard,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  FileText,
  Truck,
} from 'lucide-react';
import Image from 'next/image';

interface OrderDetailAdminClientProps {
  orderId: string;
}

const getStatusBadgeVariant = (status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'outline';
    case OrderStatus.PROCESSING:
      return 'default';
    case OrderStatus.SHIPPED:
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

const getStatusLabel = (status: OrderStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function OrderDetailAdminClient({ orderId }: OrderDetailAdminClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false);
  const [confirmPaymentDialog, setConfirmPaymentDialog] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [statusNotes, setStatusNotes] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState<'source' | 'upi' | 'bank'>('source');
  const [refundUpiId, setRefundUpiId] = useState('');
  const [refundBankName, setRefundBankName] = useState('');
  const [refundBankAccount, setRefundBankAccount] = useState('');
  const [refundBankIfsc, setRefundBankIfsc] = useState('');
  const [completeReference, setCompleteReference] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [shipBusy, setShipBusy] = useState<string | null>(null);

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
        router.push('/admin/orders');
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

  const handleUpdateStatus = async () => {
    if (!order) return;
    
    setActionLoading(true);
    try {
      const data: UpdateOrderStatusRequest = {
        status: newStatus,
        notes: statusNotes || undefined,
      };
      await updateOrderStatus(order._id, data);
      toast({
        title: 'Success',
        description: 'Order status updated successfully.',
      });
      setUpdateStatusDialog(false);
      setStatusNotes('');
      await loadOrder();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update order status.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    
    setActionLoading(true);
    try {
      await confirmPayment(order._id, {
        notes: paymentNotes || undefined,
      });
      toast({
        title: 'Success',
        description: 'Payment confirmed successfully.',
      });
      setConfirmPaymentDialog(false);
      setPaymentNotes('');
      await loadOrder();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to confirm payment.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!order || !refundNotes.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Refund notes are required.',
        variant: 'destructive',
      });
      return;
    }
    const hasOnlineMoney = Boolean((order as any).razorpayPaymentId);
    const method = hasOnlineMoney ? 'source' : refundMethod;
    if (method === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(refundUpiId.trim())) {
      toast({ title: 'Validation Error', description: 'Enter a valid UPI ID (e.g. name@okbank).', variant: 'destructive' });
      return;
    }
    if (method === 'bank' && (!refundBankName.trim() || !refundBankAccount.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(refundBankIfsc.trim().toUpperCase()))) {
      toast({ title: 'Validation Error', description: 'Bank name, account number and valid IFSC are required.', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    try {
      const data: RefundOrderRequest = {
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
        notes: refundNotes,
        refundMethod: method,
        upiId: method === 'upi' ? refundUpiId.trim() : undefined,
        bankAccountName: method === 'bank' ? refundBankName.trim() : undefined,
        bankAccountNumber: method === 'bank' ? refundBankAccount.trim() : undefined,
        bankIfsc: method === 'bank' ? refundBankIfsc.trim().toUpperCase() : undefined,
      };
      const res = await refundOrder(order._id, data);
      toast({
        title: 'Success',
        description: (res as any)?.message || 'Order refunded successfully.',
      });
      setRefundDialog(false);
      setRefundAmount('');
      setRefundNotes('');
      setRefundUpiId('');
      setRefundBankName('');
      setRefundBankAccount('');
      setRefundBankIfsc('');
      await loadOrder();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to refund order.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRefund = async () => {
    if (!order || !completeReference.trim()) {
      toast({ title: 'Validation Error', description: 'Payment reference is required for audit.', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    try {
      await completeManualRefund(order._id, { reference: completeReference.trim() });
      toast({ title: 'Success', description: 'Manual refund marked completed.' });
      setCompleteReference('');
      await loadOrder();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.error || 'Failed to complete refund.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const openUpdateStatusDialog = () => {
    if (!order) return;
    setNewStatus(order.status);
    setStatusNotes('');
    setUpdateStatusDialog(true);
  };

  const openConfirmPaymentDialog = () => {
    setPaymentNotes('');
    setConfirmPaymentDialog(true);
  };

  const openRefundDialog = () => {
    setRefundAmount('');
    setRefundNotes('');
    setRefundMethod(((order as any)?.refundMethod as any) || 'source');
    setRefundUpiId((order as any)?.refundUpiId || '');
    setRefundBankName((order as any)?.refundBankName || '');
    setRefundBankAccount((order as any)?.refundBankAccount || '');
    setRefundBankIfsc((order as any)?.refundBankIfsc || '');
    setRefundDialog(true);
  };

  // ---- Shiprocket actions (inline on this page) ----
  const sr: any = order as any;
  const isClosedOrder =
    order?.status === OrderStatus.CANCELLED || order?.status === OrderStatus.REFUNDED;
  const isPushed = Boolean(sr?.shiprocketShipmentId || sr?.shiprocketOrderId);
  const hasAWB = Boolean(sr?.shiprocketAWB);

  const runShipAction = async (key: string, successTitle: string, fn: () => Promise<any>) => {
    if (!order) return;
    setShipBusy(key);
    try {
      const r = await fn();
      if (r?.duplicate) {
        toast({ title: 'Already done', description: successTitle });
      } else if (r?.data?.url) {
        window.open(r.data.url, '_blank');
        toast({ title: successTitle, description: 'Document opened in a new tab.' });
      } else {
        toast({ title: successTitle, description: r?.data?.awb ? `AWB ${r.data.awb} ${r.data?.courier || ''}` : undefined });
      }
      await loadOrder();
    } catch (error: any) {
      toast({
        title: 'Shipment action failed',
        description: error.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setShipBusy(null);
    }
  };

  const shipActions = {
    push: () =>
      runShipAction('push', 'Pushed to Shiprocket', async () => {
        const { shipmentApi } = await import('@/lib/api/shipment');
        return shipmentApi.shipOrder(orderId);
      }),
    assignAwb: () =>
      runShipAction('awb', 'AWB assigned', async () => {
        const { adminShipmentApi } = await import('@/lib/api/adminPayments');
        return adminShipmentApi.assignAwb(orderId);
      }),
    pickup: () =>
      runShipAction('pickup', 'Pickup requested', async () => {
        const { adminShipmentApi } = await import('@/lib/api/adminPayments');
        return adminShipmentApi.requestPickup(orderId);
      }),
    label: () =>
      runShipAction('label', 'Shipping label ready', async () => {
        const { adminShipmentApi } = await import('@/lib/api/adminPayments');
        return adminShipmentApi.getLabel(orderId);
      }),
    invoice: () =>
      runShipAction('invoice', 'Courier invoice ready', async () => {
        const { adminShipmentApi } = await import('@/lib/api/adminPayments');
        return adminShipmentApi.getInvoice(orderId);
      }),
    liveTrack: async () => {
      if (!hasAWB) {
        toast({ title: 'No AWB yet', description: 'Push to Shiprocket and assign AWB first.' });
        return;
      }
      setShipBusy('track');
      try {
        const { shipmentApi } = await import('@/lib/api/shipment');
        const live = await shipmentApi.liveTrack(sr.shiprocketAWB);
        const status =
          live?.tracking_data?.shipment_track?.[0]?.current_status || JSON.stringify(live).slice(0, 200);
        toast({ title: 'Live status', description: String(status) });
      } catch (error: any) {
        toast({
          title: 'Track failed',
          description: error.response?.data?.error || 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setShipBusy(null);
      }
    },
    cancelShipment: () => {
      if (!confirm('Cancel the Shiprocket shipment? Order payment/stock stay as-is.')) return;
      return runShipAction('cancel', 'Shipment cancel requested', async () => {
        const { adminShipmentApi } = await import('@/lib/api/adminPayments');
        return adminShipmentApi.cancelShipment(orderId);
      });
    },
  };

  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-0 py-4 max-w-full">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-5 w-full mb-3" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="container mx-auto px-0 py-4 max-w-full">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Order #{order.orderNumber}</h1>
        <div className="ml-auto flex gap-1.5 flex-wrap items-center">
          <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-extrabold">{getStatusLabel(order.status)}</Badge>
          <Badge className={order.paymentStatus === 'confirmed' ? 'bg-emerald-500 text-white text-[10px] font-extrabold' : 'bg-amber-500 text-slate-950 text-[10px] font-extrabold'}>
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Status & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">Order Status</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/orders/${order._id}/invoice`} target="_blank">
                      <FileText className="h-4 w-4 mr-2 text-amber-500" />
                      Tax Invoice
                    </Link>
                  </Button>
                  {order.paymentStatus === PaymentStatus.PENDING && (
                    <Button variant="outline" size="sm" onClick={openConfirmPaymentDialog}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Confirm Payment
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={openUpdateStatusDialog}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                  {order.paymentStatus === PaymentStatus.CONFIRMED &&
                    order.status !== OrderStatus.REFUNDED && (
                      <Button variant="destructive" size="sm" onClick={openRefundDialog}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Refund
                      </Button>
                    )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm px-2.5 py-0.5">
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                {order.cancelledReason && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Cancellation Reason</div>
                    <p className="text-sm">{order.cancelledReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipment — Shiprocket (create + manage without leaving this page) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" />
                  Shipment — Shiprocket
                </CardTitle>
                <Badge variant={hasAWB ? 'default' : 'outline'}>
                  {sr?.shiprocketStatus || 'not_pushed'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Push order, assign AWB, pickup, labels & live tracking — all here.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isClosedOrder ? (
                <p className="text-xs text-muted-foreground">
                  Order {order.status} — shipment actions disabled. Use Re-order for a new shipment.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs mb-3">
                    <div>
                      <div className="text-muted-foreground">Courier</div>
                      <div className="font-medium">{sr?.shiprocketCourier || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">AWB</div>
                      <div className="font-mono font-medium">{sr?.shiprocketAWB || sr?.trackingNumber || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">SR Order / Shipment</div>
                      <div className="font-mono">{sr?.shiprocketOrderId || '—'} / {sr?.shiprocketShipmentId || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Buyer phone</div>
                      <div className="font-medium">{(order.userId as any)?.phone || 'missing — fix to ship'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Package</div>
                      <div className="font-medium">
                        {sr?.packageWeightG || 500}g · {sr?.packageLengthCm || 30}×{sr?.packageWidthCm || 25}×{sr?.packageHeightCm || 3}cm
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pickup</div>
                      <div className="font-medium">
                        {sr?.pickupLocation || 'Primary'}{sr?.shiprocketPickupScheduled ? ' · scheduled ✓' : ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">ETD</div>
                      <div className="font-medium">
                        {sr?.estimatedDelivery ? new Date(sr.estimatedDelivery).toLocaleDateString('en-IN') : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pay mode → SR</div>
                      <div className="font-medium">{order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={shipBusy !== null || isPushed}
                      title={isPushed ? 'Already pushed to Shiprocket' : 'Create Shiprocket order'}
                      onClick={shipActions.push}
                    >
                      {shipBusy === 'push' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {isPushed ? 'Pushed ✓' : 'Push to Shiprocket'}
                    </Button>
                    <Button size="sm" variant="secondary" disabled={shipBusy !== null || !isPushed} onClick={shipActions.assignAwb}>
                      {shipBusy === 'awb' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Assign AWB
                    </Button>
                    <Button size="sm" variant="secondary" disabled={shipBusy !== null || !isPushed} onClick={shipActions.pickup}>
                      {shipBusy === 'pickup' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Request Pickup
                    </Button>
                    <Button size="sm" variant="outline" disabled={shipBusy !== null || !isPushed} onClick={shipActions.label}>
                      {shipBusy === 'label' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Label
                    </Button>
                    <Button size="sm" variant="outline" disabled={shipBusy !== null || !isPushed} onClick={shipActions.invoice}>
                      {shipBusy === 'invoice' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Invoice
                    </Button>
                    <Button size="sm" variant="outline" disabled={shipBusy !== null} onClick={shipActions.liveTrack}>
                      {shipBusy === 'track' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Live Track
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      disabled={shipBusy !== null || !isPushed || order.status === OrderStatus.DELIVERED}
                      onClick={shipActions.cancelShipment}
                    >
                      {shipBusy === 'cancel' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      Cancel Shipment
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Live Tracking Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" /> Live Tracking</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Status</div>
                  <div className="font-extrabold mt-1">{sr?.shiprocketStatus || 'Not pushed yet'}</div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Tracking Number</div>
                  <div className="font-mono font-bold mt-1 truncate">{sr?.shiprocketAWB || sr?.trackingNumber || '—'}</div>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Courier</div>
                  <div className="font-extrabold mt-1">{sr?.shiprocketCourier || '—'}</div>
                </div>
              </div>
              <Button size="sm" className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold" onClick={shipActions.liveTrack}>
                {shipBusy === 'track' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Live Track
              </Button>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {order.items.map((item, index) => {
                  const productId = typeof item.productId === 'object' && item.productId !== null && '_id' in item.productId
                    ? (item.productId as any)._id.toString()
                    : item.productId?.toString() || '';
                  return (
                  <div key={index} className="flex gap-4">
                    <Link href={`/products/${productId}`}>
                      <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                        {item.product?.images && item.product.images.length > 0 && (
                          <Image
                            src={getImageUrl(item.product.images[0])}
                            alt={item.product.name || 'Product'}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${productId}`}>
                        <h3 className="text-sm font-semibold hover:underline line-clamp-2">
                          {item.product?.name || 'Product'}
                        </h3>
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        SKU: {item.product?.sku || 'N/A'}
                      </div>
                      {item.variations && item.variations.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {item.variations.map((v) => (
                            <span key={`${v.name}-${v.value}`} className="mr-2">
                              {v.name}: {v.value}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
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
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm">
              <div className="space-y-1">
                {typeof order.userId === 'object' && order.userId !== null && (
                  <div className="text-sm pb-2 mb-2 border-b">
                    <span className="font-medium">{(order.userId as any).name || 'Customer'}</span>
                    {(order.userId as any).phone && (
                      <span className="text-muted-foreground"> · {(order.userId as any).phone}</span>
                    )}
                    {(order.userId as any).email && (
                      <div className="text-muted-foreground text-xs">{(order.userId as any).email}</div>
                    )}
                  </div>
                )}
                <div className="font-medium">{order.shippingAddress.street}</div>
                <div className="text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.zip}
                </div>
                <div className="text-muted-foreground">{order.shippingAddress.country}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-sm">
              {/* Payment Status */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">Payment Status</div>
                <Badge
                  variant={order.paymentStatus === PaymentStatus.CONFIRMED ? 'default' : 'outline'}
                >
                  <CreditCard className="h-3 w-3 mr-1" />
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
                {order.paymentNotes && (
                  <p className="text-sm text-muted-foreground mt-2">{order.paymentNotes}</p>
                )}
              </div>

              <Separator />

              {/* Payment Method */}
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Payment Method</div>
                <div className="font-medium capitalize">{order.paymentMethod}</div>
              </div>

              <Separator />

              {/* Order Date */}
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Order Date</div>
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
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-[11px]">
                        {((order as any).refundStatus || 'completed').replace('_', ' ')}
                      </Badge>
                      <span className="text-muted-foreground">
                        {((order as any).refundMethod || 'source') === 'source'
                          ? 'to source · 5–7 working days'
                          : `via ${((order as any).refundMethod || '').toUpperCase()}`}
                      </span>
                    </div>
                    {((order as any).refundMethod === 'upi' && (order as any).refundUpiId) && (
                      <p className="text-xs font-mono">UPI: {(order as any).refundUpiId}</p>
                    )}
                    {((order as any).refundMethod === 'bank' && (order as any).refundBankAccount) && (
                      <p className="text-xs font-mono">
                        {(order as any).refundBankName} · {(order as any).refundBankAccount} · {(order as any).refundBankIfsc}
                      </p>
                    )}
                    {((order as any).refundReference) && (
                      <p className="text-xs text-muted-foreground font-mono">Ref: {(order as any).refundReference}</p>
                    )}
                    {order.refundNotes && (
                      <p className="text-xs text-muted-foreground">{order.refundNotes}</p>
                    )}
                    {(order as any).refundStatus === 'processing' && (
                      <div className="space-y-2 rounded-lg border p-2.5">
                        <Label className="text-xs">Payment reference (UTR / txn id) *</Label>
                        <Input value={completeReference} onChange={(e) => setCompleteReference(e.target.value)} placeholder="Pay customer first, then enter ref" className="font-mono h-8 text-xs" />
                        <Button size="sm" className="w-full" disabled={actionLoading || !completeReference.trim()} onClick={handleCompleteRefund}>
                          {actionLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          Mark Refund Completed
                        </Button>
                      </div>
                    )}
                  </>
                ) : ((order as any).refundStatus === 'pending' && (
                  <>
                    <Separator />
                    <p className="text-xs text-amber-600">Advance held — needs manual refund via Refund button.</p>
                  </>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatPrice(order.total - (order.refundAmount || 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialog} onOpenChange={setUpdateStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>Update the status for order #{order.orderNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OrderStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmPaymentDialog} onOpenChange={setConfirmPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>Confirm payment for order #{order.orderNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Payment Notes (Optional)</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any notes about this payment confirmation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialog} onOpenChange={setRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Order</DialogTitle>
            <DialogDescription>
              Process a refund for order #{order.orderNumber} (Total:{' '}
              {formatPrice(order.total)})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Refund Amount (Leave empty for full refund)</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={`Max: ${formatPrice(order.total)}`}
                min={0}
                max={order.total}
              />
            </div>
            {(order as any).razorpayPaymentId ? (
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/60 p-2.5">
                Online payment detected — refund goes back to the source (UPI/card/bank) via Razorpay automatically in 5–7 working days. No UPI/bank details needed.
              </p>
            ) : (
              <>
                <div>
                  <Label>Refund via</Label>
                  <Select value={refundMethod} onValueChange={(v) => setRefundMethod(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source">Original source (if any)</SelectItem>
                      <SelectItem value="upi">Customer UPI ID</SelectItem>
                      <SelectItem value="bank">Bank transfer (NEFT/IMPS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {refundMethod === 'upi' && (
                  <div>
                    <Label>Customer UPI ID *</Label>
                    <Input value={refundUpiId} onChange={(e) => setRefundUpiId(e.target.value)} placeholder="name@okbank" className="font-mono" />
                  </div>
                )}
                {refundMethod === 'bank' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Account holder name *</Label>
                      <Input value={refundBankName} onChange={(e) => setRefundBankName(e.target.value)} placeholder="As per bank records" />
                    </div>
                    <div>
                      <Label>Account number *</Label>
                      <Input value={refundBankAccount} onChange={(e) => setRefundBankAccount(e.target.value)} placeholder="Digits only" className="font-mono" inputMode="numeric" />
                    </div>
                    <div>
                      <Label>IFSC *</Label>
                      <Input value={refundBankIfsc} onChange={(e) => setRefundBankIfsc(e.target.value.toUpperCase())} placeholder="HDFC0001234" className="font-mono uppercase" maxLength={11} />
                    </div>
                    <p className="text-xs text-muted-foreground">Verify name/number with the customer before paying — bank transfers cannot be reversed easily.</p>
                  </div>
                )}
              </>
            )}
            <div>
              <Label>Refund Notes *</Label>
              <Textarea
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="Reason for refund..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={actionLoading || !refundNotes.trim()}
              variant="destructive"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Process Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

