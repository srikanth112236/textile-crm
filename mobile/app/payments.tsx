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
import { ChevronLeftIcon, CreditCardIcon } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'cod', label: 'Cash on delivery' },
  { id: 'refunded', label: 'Refunded' },
];

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const [filter, setFilter] = React.useState('all');

  const orders = useInfiniteQuery({
    queryKey: [...qk.orders('payments'), filter],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => ordersApi.list({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) =>
      lastPage.data.pagination.page < lastPage.data.pagination.pages
        ? lastPage.data.pagination.page + 1
        : undefined,
    enabled: isSignedIn,
  });

  const all: Order[] = orders.data?.pages.flatMap((page) => page.data.orders) ?? [];
  const items = all.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'cod') return (order.paymentMethod ?? '').toLowerCase() === 'cod';
    if (filter === 'paid') return (order.paymentStatus ?? '').toLowerCase() === 'paid';
    if (filter === 'pending') return (order.paymentStatus ?? '').toLowerCase() !== 'paid';
    if (filter === 'refunded') return (order.paymentStatus ?? '').toLowerCase() === 'refunded';
    return true;
  });

  const paidTotal = all
    .filter((order) => (order.paymentStatus ?? '').toLowerCase() === 'paid')
    .reduce((sum, order) => sum + order.total, 0);
  const pendingTotal = all
    .filter((order) => (order.paymentStatus ?? '').toLowerCase() !== 'paid')
    .reduce((sum, order) => sum + order.total, 0);

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
        <Text className="text-h2 text-foreground flex-1">Payments</Text>
      </View>

      <View className="flex-row gap-2 px-4 pt-3">
        <View className="border-border flex-1 rounded-xl border p-3">
          <Text className="text-caption text-muted-foreground">Paid</Text>
          <Text className="text-h2 text-foreground mt-0.5">{formatPrice(paidTotal)}</Text>
        </View>
        <View className="border-border flex-1 rounded-xl border p-3">
          <Text className="text-caption text-muted-foreground">Due</Text>
          <Text className="text-h2 text-foreground mt-0.5">{formatPrice(pendingTotal)}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}>
        {FILTERS.map((option) => {
          const active = option.id === filter;
          return (
            <Pressable
              key={option.id}
              onPress={() => setFilter(option.id)}
              className={`h-8 justify-center rounded-full border px-3 ${
                active ? 'border-primary bg-primary' : 'border-border'
              }`}>
              <Text className={`text-caption ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {!isSignedIn ? (
        <SignedOut title="Sign in to see payments" message="Track what you've paid and what's due on delivery." />
      ) : orders.isLoading ? (
        <View className="px-4">
          <RowsSkeleton rows={4} />
        </View>
      ) : orders.error ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={CreditCardIcon}
          title="No payments here"
          message="Payments and COD dues will appear once you place an order."
          actionLabel="Start shopping"
          onAction={() => router.replace('/')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(order) => order._id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => <PaymentRow order={item} />}
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

const METHOD_LABEL: Record<string, string> = {
  cod: 'Cash on delivery',
  razorpay: 'Razorpay',
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Netbanking',
  wallet: 'Wallet',
  manual: 'Manual',
};

function PaymentRow({ order }: { order: Order }) {
  const settled = (order.paymentStatus ?? '').toLowerCase() === 'paid';
  const method = (order.paymentMethod ?? 'cod').toLowerCase();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order._id } })}
      className="border-border flex-row items-center gap-3 rounded-xl border p-3 active:opacity-80">
      <View className="flex-1">
        <Text className="text-label text-foreground font-semibold">#{order.orderNumber}</Text>
        <Text className="text-caption text-muted-foreground">
          {METHOD_LABEL[method] ?? method}
          {' · '}
          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-label text-foreground font-medium">{formatPrice(order.total)}</Text>
        <Text className={`text-caption ${settled ? 'text-success' : 'text-sale'}`}>
          {order.paymentStatus ?? 'pending'}
        </Text>
      </View>
    </Pressable>
  );
}
