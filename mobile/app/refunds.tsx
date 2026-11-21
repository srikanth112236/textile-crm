import { EmptyState, ErrorState, RowsSkeleton, SignedOut } from '@/components/states';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ordersApi, returnsApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeftIcon, RotateCcwIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RefundsScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  const orders = useQuery({
    queryKey: [...qk.orders('refunds'), 'refunds'],
    queryFn: async () => (await ordersApi.list({ limit: 50 })).data.orders,
    enabled: isSignedIn,
  });

  const rmas = useQuery({
    queryKey: qk.returns,
    queryFn: async () => (await returnsApi.mine()).data,
    enabled: isSignedIn,
  });

  const refunded = (orders.data ?? []).filter(
    (order) =>
      order.status === 'cancelled' ||
      order.status === 'refunded' ||
      Boolean(order.refundAmount) ||
      /refund/i.test(order.refundStatus ?? '') ||
      order.paymentStatus === 'refunded'
  );
  const requests = rmas.data ?? [];

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2 px-4">
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent">
          <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-h2 text-foreground">Refunds</Text>
          <Text className="text-caption text-muted-foreground">Refund status for returns and cancellations</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
        {!isSignedIn ? (
          <SignedOut title="Sign in to see refunds" message="Refund status for returns and cancellations." />
        ) : (
          <>
        <Text className="text-caption text-muted-foreground font-semibold tracking-widest">
          RETURN REQUESTS
        </Text>

        {rmas.isLoading ? (
          <RowsSkeleton rows={2} />
        ) : rmas.error ? (
          <ErrorState error={rmas.error} onRetry={() => void rmas.refetch()} compact />
        ) : requests.length === 0 ? (
          <View className="border-border items-start gap-1 rounded-xl border border-dashed p-4">
            <Text className="text-label text-foreground font-medium">No return requests</Text>
            <Text className="text-caption text-muted-foreground">
              Open a delivered order and choose “Return or exchange” to start one.
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request._id} className="border-border gap-1 rounded-xl border p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-label text-foreground font-semibold capitalize">
                  {request.type} · {String(request.status).replace(/_/g, ' ')}
                </Text>
                <Text className="text-caption text-muted-foreground">
                  {new Date(request.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              {request.reason ? (
                <Text className="text-caption text-muted-foreground">{request.reason}</Text>
              ) : null}
              {request.refundAmount ? (
                <Text className="text-label text-success font-medium">
                  Refund {formatPrice(request.refundAmount)}
                  {request.refundMethod ? ` · ${request.refundMethod}` : ''}
                </Text>
              ) : null}
            </View>
          ))
        )}

        <Text className="text-caption text-muted-foreground font-semibold tracking-widest">
          CANCELLATIONS & REFUNDS
        </Text>

        {orders.isLoading ? (
          <RowsSkeleton rows={2} />
        ) : orders.error ? (
          <ErrorState error={orders.error} onRetry={() => void orders.refetch()} compact />
        ) : refunded.length === 0 ? (
          <EmptyState
            icon={RotateCcwIcon}
            title="No refunds yet"
            message="If an order is cancelled or returned, its refund status shows up here."
          />
        ) : (
          refunded.map((order) => (
            <Pressable
              key={order._id}
              onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order._id } })}
              className="border-border flex-row items-center gap-3 rounded-xl border p-3 active:opacity-80">
              <View className="flex-1">
                <Text className="text-label text-foreground font-semibold">#{order.orderNumber}</Text>
                <Text className="text-caption text-muted-foreground capitalize">
                  {order.refundStatus
                    ? `${order.refundStatus}${order.refundMethod ? ` · ${order.refundMethod}` : ''}`
                    : order.status === 'cancelled'
                      ? 'Cancelled · no payment captured'
                      : 'Refund processing'}
                </Text>
              </View>
              <Text className="text-label text-foreground font-medium">
                {formatPrice(order.refundAmount ?? order.total)}
              </Text>
            </Pressable>
          ))
        )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
