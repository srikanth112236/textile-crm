import { SmartImage } from '@/components/smart-image';
import { EmptyState, ErrorState, RowsSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ordersApi } from '@/lib/api/endpoints';
import type { Order, OrderStatus } from '@/lib/api/types';
import { useAuth } from '@/lib/auth';
import { productImages } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeftIcon, PackageIcon } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS: Array<{ id: string; label: string; status?: OrderStatus }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending', status: 'pending' },
  { id: 'processing', label: 'Processing', status: 'processing' },
  { id: 'shipped', label: 'Shipped', status: 'shipped' },
  { id: 'delivered', label: 'Delivered', status: 'delivered' },
  { id: 'cancelled', label: 'Cancelled', status: 'cancelled' },
];

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-sale/10 text-sale',
  processing: 'bg-secondary text-secondary-foreground',
  packed: 'bg-secondary text-secondary-foreground',
  shipped: 'bg-primary/10 text-primary',
  out_for_delivery: 'bg-primary/10 text-primary',
  delivered: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  refunded: 'bg-destructive/10 text-destructive',
  on_hold: 'bg-secondary text-secondary-foreground',
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const [filter, setFilter] = React.useState('all');
  const active = FILTERS.find((entry) => entry.id === filter) ?? FILTERS[0];

  const orders = useInfiniteQuery({
    queryKey: [...qk.orders(active.id), active.status],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => ordersApi.list({ page: pageParam, limit: 10, status: active.status }),
    getNextPageParam: (lastPage) =>
      lastPage.data.pagination.page < lastPage.data.pagination.pages
        ? lastPage.data.pagination.page + 1
        : undefined,
    enabled: isSignedIn,
  });

  const items = orders.data?.pages.flatMap((page) => page.data.orders) ?? [];

  if (!isSignedIn) {
    return (
      <View className="bg-background flex-1 items-center justify-center gap-3 px-8" style={{ paddingTop: insets.top }}>
        <Text className="text-h2 text-foreground text-center">Sign in to see your orders</Text>
        <Button onPress={() => router.push('/auth')}>
          <Text>Sign in</Text>
        </Button>
      </View>
    );
  }

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
        <Text className="text-h2 text-foreground flex-1">Your orders</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}>
        {FILTERS.map((option) => {
          const isActive = option.id === filter;
          return (
            <Pressable
              key={option.id}
              onPress={() => setFilter(option.id)}
              className={`h-8 justify-center rounded-full border px-3 ${
                isActive ? 'border-primary bg-primary' : 'border-border bg-background'
              }`}>
              <Text className={`text-caption ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {orders.isLoading ? (
        <View className="px-4">
          <RowsSkeleton rows={4} />
        </View>
      ) : orders.error ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageIcon}
          title="No orders here yet"
          message="When you place an order it will show up here with live tracking."
          actionLabel="Start shopping"
          onAction={() => router.replace('/')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(order) => order._id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => <OrderCard order={item} />}
          onEndReached={() => {
            if (orders.hasNextPage && !orders.isFetchingNextPage) void orders.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            orders.isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator />
              </View>
            ) : undefined
          }
        />
      )}
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const thumbs = order.items
    .slice(0, 3)
    .map((item) => {
      const product = typeof item.productId === 'object' ? item.productId : undefined;
      return productImages(product)[0];
    })
    .filter(Boolean) as string[];

  const statusStyle = STATUS_STYLES[order.status] ?? 'bg-secondary text-secondary-foreground';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order._id } })}
      className="border-border rounded-2xl border p-3 active:opacity-80">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-1">
          <Text className="text-label text-foreground font-semibold">#{order.orderNumber}</Text>
          <Text className="text-caption text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            {' · '}
            {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
          </Text>
        </View>
        <View className={`rounded-full px-2.5 py-1 ${statusStyle.split(' ')[0]}`}>
          <Text className={`text-caption capitalize font-medium ${statusStyle.split(' ')[1]}`}>
            {order.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        {thumbs.map((uri) => (
          <SmartImage key={uri} uri={uri} style={{ width: 44, height: 54, borderRadius: 8 }} />
        ))}
        <View className="flex-1" />
        <Text className="text-body text-foreground font-semibold">{formatPrice(order.total)}</Text>
      </View>
    </Pressable>
  );
}
