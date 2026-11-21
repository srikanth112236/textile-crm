import { ErrorState, RowsSkeleton } from '@/components/states';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { loyaltyApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeftIcon, SparklesIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoyaltyScreen() {
  const insets = useSafeAreaInsets();

  const loyalty = useQuery({
    queryKey: qk.loyalty,
    queryFn: async () => (await loyaltyApi.balance()).data,
  });

  const points = loyalty.data?.balance ?? 0;
  const nextTier = points < 500 ? 500 : points < 1500 ? 1500 : 3000;
  const progress = Math.min(100, (points / nextTier) * 100);

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
        <Text className="text-h2 text-foreground flex-1">Rewards</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
        <View className="bg-primary rounded-3xl p-5">
          <Icon as={SparklesIcon} size={20} className="text-primary-foreground/80" />
          <Text className="text-label mt-3 text-primary-foreground/80">Available points</Text>
          <Text className="text-display text-primary-foreground">{points}</Text>
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
            <View className="bg-background h-full rounded-full" style={{ width: `${progress}%` }} />
          </View>
          <Text className="text-caption mt-2 text-primary-foreground/80">
            {Math.max(0, nextTier - points)} points to the next tier · 1 point per ₹100
          </Text>
        </View>

        <Text className="text-label text-foreground font-semibold">Recent activity</Text>

        {loyalty.isLoading ? (
          <RowsSkeleton rows={3} />
        ) : loyalty.error ? (
          <ErrorState error={loyalty.error} onRetry={() => void loyalty.refetch()} compact />
        ) : (loyalty.data?.history?.length ?? 0) === 0 ? (
          <Text className="text-label text-muted-foreground">
            No activity yet — you’ll earn points on every delivered order.
          </Text>
        ) : (
          <View className="border-border overflow-hidden rounded-2xl border">
            {loyalty.data?.history?.map((entry, index) => (
              <View key={`${entry.reason}-${index}`}>
                {index > 0 ? <View className="bg-border ml-4 h-px" /> : null}
                <View className="flex-row items-center justify-between px-4 py-3">
                  <View className="flex-1">
                    <Text className="text-label text-foreground capitalize">
                      {entry.reason?.replace(/_/g, ' ') ?? 'Points'}
                    </Text>
                    <Text className="text-caption text-muted-foreground">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''}
                    </Text>
                  </View>
                  <Text className={`text-label font-semibold ${entry.points >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {entry.points >= 0 ? '+' : ''}
                    {entry.points}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
