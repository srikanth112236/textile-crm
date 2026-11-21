import { EmptyState, ErrorState, RowsSkeleton, SignedOut } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ordersApi, returnsApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeftIcon, PackageIcon, RotateCcwIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RETURN_STATUS_STYLE: Record<string, string> = {
  requested: 'bg-sale/10 text-sale',
  approved: 'bg-primary/10 text-primary',
  pickup_scheduled: 'bg-primary/10 text-primary',
  received: 'bg-secondary text-secondary-foreground',
  refunded: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function ReturnsScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  const rmas = useQuery({
    queryKey: qk.returns,
    queryFn: async () => (await returnsApi.mine()).data,
    enabled: isSignedIn,
  });

  const orders = useQuery({
    queryKey: [...qk.orders('returns'), 'returns'],
    queryFn: async () => (await ordersApi.list({ limit: 30, status: 'delivered' })).data.orders,
    enabled: isSignedIn,
  });

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
          <Text className="text-h2 text-foreground">Returns & exchanges</Text>
          <Text className="text-caption text-muted-foreground">30 days from delivery, free pickup</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
        {!isSignedIn ? (
          <SignedOut title="Sign in for returns" message="Start a return or exchange from any delivered order." />
        ) : (
          <>
        <Text className="text-caption text-muted-foreground font-semibold tracking-widest">
          YOUR REQUESTS
        </Text>

        {rmas.isLoading ? (
          <RowsSkeleton rows={2} />
        ) : rmas.error ? (
          <ErrorState error={rmas.error} onRetry={() => void rmas.refetch()} compact />
        ) : (rmas.data?.length ?? 0) === 0 ? (
          <View className="border-border items-start gap-1 rounded-xl border border-dashed p-4">
            <Text className="text-label text-foreground font-medium">No requests yet</Text>
            <Text className="text-caption text-muted-foreground">
              Start one from a delivered order below.
            </Text>
          </View>
        ) : (
          rmas.data?.map((request) => {
            const style = RETURN_STATUS_STYLE[String(request.status)] ?? 'bg-secondary text-secondary-foreground';
            return (
              <View key={request._id} className="border-border gap-1.5 rounded-xl border p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-label text-foreground font-semibold capitalize">
                    {request.type}
                  </Text>
                  <View className={`rounded-full px-2.5 py-1 ${style.split(' ')[0]}`}>
                    <Text className={`text-caption capitalize font-medium ${style.split(' ')[1]}`}>
                      {String(request.status).replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
                {request.reason ? (
                  <Text className="text-caption text-muted-foreground">{request.reason}</Text>
                ) : null}
                <View className="flex-row items-center justify-between">
                  <Text className="text-caption text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  {request.refundAmount ? (
                    <Text className="text-label text-success font-medium">
                      {formatPrice(request.refundAmount)}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}

        <Text className="text-caption text-muted-foreground font-semibold tracking-widest">
          ELIGIBLE ORDERS
        </Text>

        {orders.isLoading ? (
          <RowsSkeleton rows={2} />
        ) : orders.error ? (
          <ErrorState error={orders.error} onRetry={() => void orders.refetch()} compact />
        ) : (orders.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="No delivered orders yet"
            message="Once an order is delivered you can request a return or exchange here."
          />
        ) : (
          orders.data?.map((order) => (
            <View key={order._id} className="border-border flex-row items-center gap-3 rounded-xl border p-3">
              <View className="flex-1">
                <Text className="text-label text-foreground font-semibold">#{order.orderNumber}</Text>
                <Text className="text-caption text-muted-foreground">
                  {order.items.length} items · {formatPrice(order.total)}
                </Text>
              </View>
              <Button
                variant="outline"
                size="sm"
                onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order._id, return: '1' } })}>
                <Icon as={RotateCcwIcon} size={13} className="text-foreground" />
                <Text>Return</Text>
              </Button>
            </View>
          ))
        )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
