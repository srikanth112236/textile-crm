import { EmptyState, ErrorState, RowsSkeleton, SignedOut } from '@/components/states';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ordersApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import type { Order } from '@/lib/api/types';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeftIcon, FileTextIcon } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  const orders = useInfiniteQuery({
    queryKey: [...qk.orders('invoices'), 'invoices'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => ordersApi.list({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.data.pagination.page < lastPage.data.pagination.pages
        ? lastPage.data.pagination.page + 1
        : undefined,
    enabled: isSignedIn,
  });

  const items = orders.data?.pages.flatMap((page) => page.data.orders) ?? [];

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
          <Text className="text-h2 text-foreground">Tax invoices</Text>
          <Text className="text-caption text-muted-foreground">
            GST invoices for every order, ready to share
          </Text>
        </View>
      </View>

      {!isSignedIn ? (
        <SignedOut title="Sign in to see invoices" message="Every order gets a GST invoice you can download." />
      ) : orders.isLoading ? (
        <View className="px-4 pt-4">
          <RowsSkeleton rows={4} />
        </View>
      ) : orders.error ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title="No invoices yet"
          message="An invoice appears here as soon as your first order is placed."
          actionLabel="Start shopping"
          onAction={() => router.replace('/')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(order) => order._id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => <InvoiceRow order={item} />}
          onEndReached={() => {
            if (orders.hasNextPage && !orders.isFetchingNextPage) void orders.fetchNextPage();
          }}
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

function InvoiceRow({ order }: { order: Order }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/invoices/[orderId]', params: { orderId: order._id } })}
      className="border-border flex-row items-center gap-3 rounded-xl border p-3 active:opacity-80">
      <View className="bg-secondary h-10 w-10 items-center justify-center rounded-lg">
        <Icon as={FileTextIcon} size={17} className="text-secondary-foreground" />
      </View>
      <View className="flex-1">
        <Text className="text-label text-foreground font-semibold">
          {order.invoiceNumber ?? `#${order.orderNumber}`}
        </Text>
        <Text className="text-caption text-muted-foreground">
          {new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}{' '}
          · {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
        </Text>
      </View>
      <Text className="text-label text-foreground font-medium">{formatPrice(order.total)}</Text>
    </Pressable>
  );
}
