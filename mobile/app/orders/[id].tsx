import { SmartImage } from '@/components/smart-image';
import { Sheet } from '@/components/sheet';
import { ErrorState, RowsSkeleton, SignedOut } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { ordersApi, returnsApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import type { Order } from '@/lib/api/types';
import { productImages } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  MapPinIcon,
  PackageIcon,
  RotateCcwIcon,
  TruckIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEPS: Array<{ id: string; label: string }> = [
  { id: 'pending', label: 'Placed' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
];

const PAYMENT_LABEL: Record<string, string> = {
  cod: 'Cash on delivery',
  razorpay: 'Razorpay',
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Netbanking',
  wallet: 'Wallet',
  manual: 'Manual',
};

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id, placed, return: openReturn } = useLocalSearchParams<{ id: string; placed?: string; return?: string }>();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [returnOpen, setReturnOpen] = React.useState(openReturn === '1');
  const [returnType, setReturnType] = React.useState<'return' | 'exchange'>('return');
  const [returnReason, setReturnReason] = React.useState('Size doesn’t fit');
  const [refundMethod, setRefundMethod] = React.useState<'source' | 'upi'>('source');
  const [upiId, setUpiId] = React.useState('');
  const [returnDone, setReturnDone] = React.useState(false);

  const orderQuery = useQuery({
    queryKey: qk.order(id),
    queryFn: async () => (await ordersApi.get(id)).data,
    enabled: Boolean(id) && isSignedIn,
  });

  const cancel = useMutation({
    mutationFn: async () => ordersApi.cancel(id, 'Changed my mind'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.order(id) });
      void queryClient.invalidateQueries({ queryKey: qk.orders() });
    },
    onError: (cause) => setError((cause as Error).message),
  });

  const createReturn = useMutation({
    mutationFn: async (order: Order) =>
      returnsApi.create({
        orderId: order._id,
        type: returnType,
        reason: returnReason,
        refundMethod: returnType === 'return' ? refundMethod : undefined,
        upiId: returnType === 'return' && refundMethod === 'upi' ? upiId : undefined,
        items: order.items.map((item) => ({
          productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
          quantity: item.quantity,
          reason: returnReason,
        })),
      }),
    onSuccess: () => {
      setReturnOpen(false);
      setReturnDone(true);
      void queryClient.invalidateQueries({ queryKey: qk.returns });
    },
    onError: (cause) => setError((cause as Error).message),
  });

  const order = orderQuery.data;
  const canCancel = order && ['pending', 'processing', 'on_hold'].includes(order.status);
  const stepIndex = order
    ? Math.max(0, STEPS.findIndex((step) => step.id === order.status))
    : 0;

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2 px-4">
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/orders'))}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent">
          <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
        </Pressable>
        <Text className="text-h2 text-foreground flex-1">Order details</Text>
      </View>

      {orderQuery.isLoading ? (
        <View className="px-4 pt-4">
          <RowsSkeleton rows={3} />
        </View>
      ) : !isSignedIn ? (
        <SignedOut title="Sign in to view this order" />
      ) : orderQuery.error || !order ? (
        <ErrorState error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
          {placed === '1' ? (
            <View className="items-center gap-2 rounded-2xl border border-success/30 bg-success/5 px-4 py-5">
              <CheckCircle2Icon size={28} color="#047857" />
              <Text className="text-h2 text-foreground">Order placed</Text>
              <Text className="text-label text-muted-foreground text-center">
                We’ve emailed a confirmation. You’ll get tracking details as soon as it ships.
              </Text>
            </View>
          ) : null}

          <View className="border-border rounded-2xl border p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-label text-foreground font-semibold">#{order.orderNumber}</Text>
              <View className="bg-secondary rounded-full px-2.5 py-1">
                <Text className="text-caption text-secondary-foreground capitalize">
                  {order.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <Text className="text-caption text-muted-foreground mt-1">
              Placed{' '}
              {new Date(order.createdAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>

            {/* Progress */}
            <View className="mt-4 flex-row items-center">
              {STEPS.map((step, index) => {
                const done = index <= stepIndex;
                return (
                  <React.Fragment key={step.id}>
                    <View className="items-center gap-1">
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-full ${
                          done ? 'bg-primary' : 'bg-muted'
                        }`}>
                        {done ? (
                          <CheckCircle2Icon size={12} color="#F8FAFC" />
                        ) : (
                          <Text className="text-[10px] text-muted-foreground">{index + 1}</Text>
                        )}
                      </View>
                      <Text
                        className={`text-[10px] ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.label}
                      </Text>
                    </View>
                    {index < STEPS.length - 1 ? (
                      <View
                        className={`mx-1 h-0.5 flex-1 ${index < stepIndex ? 'bg-primary' : 'bg-muted'}`}
                        style={{ marginBottom: 14 }}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Items */}
          <View className="gap-3">
            <Text className="text-label text-foreground font-semibold">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </Text>
            {order.items.map((item, index) => {
              const product = typeof item.productId === 'object' ? item.productId : undefined;
              const name = product?.name ?? item.name ?? 'Product';
              return (
                <View key={`${name}-${index}`} className="flex-row items-center gap-3">
                  <SmartImage
                    uri={productImages(product)[0]}
                    style={{ width: 56, height: 70, borderRadius: 8 }}
                  />
                  <View className="flex-1">
                    <Text className="text-label text-foreground" numberOfLines={2}>
                      {name}
                    </Text>
                    <Text className="text-caption text-muted-foreground">
                      Qty {item.quantity}
                      {item.variations?.length
                        ? ` · ${item.variations.map((variation) => variation.value).join(' / ')}`
                        : ''}
                    </Text>
                  </View>
                  <Text className="text-label text-foreground font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Address */}
          {order.shippingAddress ? (
            <View className="border-border rounded-2xl border p-4">
              <View className="flex-row items-center gap-2">
                <Icon as={MapPinIcon} size={15} className="text-muted-foreground" />
                <Text className="text-label text-foreground font-semibold">Delivery address</Text>
              </View>
              <Text className="text-label text-muted-foreground mt-2">{order.shippingAddress.street}</Text>
              <Text className="text-label text-muted-foreground">
                {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          ) : null}

          {/* Payment */}
          <View className="border-border rounded-2xl border p-4">
            <Text className="text-label text-foreground font-semibold">Payment</Text>
            <View className="mt-2 gap-1.5">
              <Row label="Subtotal" value={formatPrice(order.subtotal ?? order.total)} />
              {order.discountAmount ? (
                <Row label="Discount" value={`− ${formatPrice(order.discountAmount)}`} />
              ) : null}
              <Row label="Shipping" value={order.shippingCost ? formatPrice(order.shippingCost) : 'Free'} />
              <View className="border-border mt-1 border-t pt-2">
                <Row label="Total" value={formatPrice(order.total)} strong />
              </View>
              <Text className="text-caption text-muted-foreground mt-1 capitalize">
                {PAYMENT_LABEL[(order.paymentMethod ?? 'cod').toLowerCase()] ?? order.paymentMethod ?? 'COD'} ·{' '}
                {order.paymentStatus ?? 'pending'}
              </Text>
            </View>
          </View>

          {order.trackingNumber || order.trackingUrl ? (
            <Button
              variant="outline"
              className="h-11"
              onPress={() =>
                router.push({ pathname: '/track-order', params: { number: order.orderNumber } })
              }>
              <Icon as={TruckIcon} size={16} className="text-foreground" />
              <Text>Track shipment</Text>
            </Button>
          ) : null}

          {error ? <Text className="text-caption text-destructive">{error}</Text> : null}

          {returnDone ? (
            <View className="rounded-xl border border-success/30 bg-success/5 px-3 py-2">
              <Text className="text-caption text-success">
                Return requested — pickup details will be shared by email.
              </Text>
            </View>
          ) : null}

          {['delivered', 'shipped'].includes(order.status) ? (
            <Button variant="outline" className="h-11" onPress={() => setReturnOpen(true)}>
              <Icon as={RotateCcwIcon} size={16} className="text-foreground" />
              <Text>Return or exchange</Text>
            </Button>
          ) : null}

          {canCancel ? (
            <Button
              variant="outline"
              className="h-11"
              disabled={cancel.isPending}
              onPress={() => {
                setError(null);
                cancel.mutate();
              }}>
              <Text className="text-destructive">
                {cancel.isPending ? 'Cancelling…' : 'Cancel order'}
              </Text>
            </Button>
          ) : null}

          <Button variant="ghost" onPress={() => router.replace('/')}>
            <Icon as={PackageIcon} size={16} className="text-foreground" />
            <Text>Continue shopping</Text>
          </Button>
        </ScrollView>
      )}

      {order ? (
        <Sheet
          open={returnOpen}
          onClose={() => setReturnOpen(false)}
          title="Return or exchange"
          subtitle={`Order #${order.orderNumber} · ${order.items.length} items`}
          footer={
            <Button
              className="h-11"
              disabled={createReturn.isPending}
              onPress={() => {
                setError(null);
                createReturn.mutate(order);
              }}>
              <Text>{createReturn.isPending ? 'Submitting…' : 'Submit request'}</Text>
            </Button>
          }>
          <View className="gap-4 pb-2">
            <View className="gap-2">
              <Text className="text-label text-foreground font-medium">What do you need?</Text>
              <View className="flex-row gap-2">
                {(['return', 'exchange'] as const).map((option) => {
                  const active = returnType === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setReturnType(option)}
                      className={`h-9 flex-1 items-center justify-center rounded-full border ${
                        active ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                      <Text
                        className={`text-caption capitalize ${
                          active ? 'text-primary-foreground' : 'text-foreground'
                        }`}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-label text-foreground font-medium">Reason</Text>
              <View className="flex-row flex-wrap gap-2">
                {['Size doesn’t fit', 'Not as described', 'Changed my mind', 'Damaged or defective'].map(
                  (reason) => {
                    const active = returnReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        onPress={() => setReturnReason(reason)}
                        className={`h-8 justify-center rounded-full border px-3 ${
                          active ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                        <Text className={`text-caption ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                          {reason}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>
            </View>

            {returnType === 'return' ? (
              <View className="gap-2">
                <Text className="text-label text-foreground font-medium">Refund to</Text>
                <View className="flex-row gap-2">
                  {(
                    [
                      { id: 'source', label: 'Original payment' },
                      { id: 'upi', label: 'UPI' },
                    ] as const
                  ).map((option) => {
                    const active = refundMethod === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => setRefundMethod(option.id)}
                        className={`h-9 flex-1 items-center justify-center rounded-full border ${
                          active ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                        <Text
                          className={`text-caption ${
                            active ? 'text-primary-foreground' : 'text-foreground'
                          }`}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {refundMethod === 'upi' ? (
                  <Input
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="yourname@upi"
                    autoCapitalize="none"
                    className="h-11"
                  />
                ) : null}
              </View>
            ) : null}

            <Text className="text-caption text-muted-foreground">
              Items must be unworn with tags attached. Pickup is scheduled within 24–48 hours of approval.
            </Text>
          </View>
        </Sheet>
      ) : null}
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Text className={`text-label ${strong ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
        {label}
      </Text>
      <Text className={`${strong ? 'text-body font-semibold' : 'text-label'} text-foreground`}>{value}</Text>
    </View>
  );
}
