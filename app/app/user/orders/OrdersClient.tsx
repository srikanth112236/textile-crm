'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserOrders, Order, OrderStatus } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { Package, Eye, Loader2 } from 'lucide-react';
import Image from 'next/image';

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

export default function OrdersClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>(undefined);

  useEffect(() => {
    loadOrders();
  }, [page, selectedStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getUserOrders(page, 10, selectedStatus);
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.pagination?.pages || 1);
      }
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={selectedStatus === undefined ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedStatus(undefined)}
        >
          All
        </Button>
        {Object.values(OrderStatus).map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(status)}
          >
            {getStatusLabel(status)}
          </Button>
        ))}
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No orders found</h2>
            <p className="text-muted-foreground mb-6">
              {selectedStatus
                ? `You don't have any ${selectedStatus} orders.`
                : "You haven't placed any orders yet."}
            </p>
            <Button asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{order.orderNumber}
                      </CardTitle>
                      <CardDescription>
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Order Items Preview */}
                  <div className="space-y-3 mb-4">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex gap-3">
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
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm line-clamp-2">
                            {item.product?.name || 'Product'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                          </div>
                          {item.variations && item.variations.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.variations.map((v) => `${v.name}: ${v.value}`).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-medium">{formatPrice(item.subtotal)}</div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="text-lg font-semibold">{formatPrice(order.total)}</div>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`/user/orders/${order._id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

