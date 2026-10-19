'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getOrder, cancelOrder, repeatOrder, Order, OrderStatus, PaymentStatus } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return <Clock className="h-5 w-5" />;
    case OrderStatus.PROCESSING:
      return <Package className="h-5 w-5" />;
    case OrderStatus.SHIPPED:
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
        router.push('/orders');
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
        description: error.response?.data?.error || 'Failed to cancel order. Please try again.',
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
      router.push(`/orders/${response.data._id}`);
    } catch (error: any) {
      console.error('Failed to repeat order:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create order. Please try again.',
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
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
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
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <Link href={`/products/${item.productId}`}>
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
                      <Link href={`/products/${item.productId}`}>
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
                ))}
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
                {order.refundAmount && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Refunded</span>
                      <span>-{formatPrice(order.refundAmount)}</span>
                    </div>
                    {order.refundNotes && (
                      <p className="text-xs text-muted-foreground">{order.refundNotes}</p>
                    )}
                  </>
                )}
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
    </div>
  );
}

