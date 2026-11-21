import { ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { referralsApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeftIcon, GiftIcon, Share2Icon, UsersIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets();

  const referral = useQuery({
    queryKey: qk.referrals,
    queryFn: async () => (await referralsApi.mine()).data,
  });

  const code = referral.data?.code ?? '—';

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
        <Text className="text-h2 text-foreground flex-1">Refer & earn</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
        <View className="bg-primary items-center gap-2 rounded-3xl p-6">
          <Icon as={GiftIcon} size={24} className="text-primary-foreground" />
          <Text className="text-h2 text-primary-foreground text-center">
            Give ₹500, get ₹500
          </Text>
          <Text className="text-label text-primary-foreground/80 text-center">
            Share your code. Your friend gets ₹500 off their first order, you earn ₹500 in points
            once it’s delivered.
          </Text>

          <View className="mt-3 w-full rounded-xl border border-white/25 border-dashed py-3">
            <Text className="text-h2 text-primary-foreground text-center tracking-[4px]">{code}</Text>
          </View>

          <Button
            className="bg-background mt-2 w-full"
            onPress={() =>
              void Share.share({
                message: `Shop Mentoos with my code ${code} and get ₹500 off your first order.`,
              })
            }>
            <Icon as={Share2Icon} size={16} className="text-primary" />
            <Text className="text-primary font-semibold">Share your code</Text>
          </Button>
        </View>

        {referral.error ? (
          <ErrorState error={referral.error} onRetry={() => void referral.refetch()} compact />
        ) : (
          <View className="flex-row gap-3">
            <View className="border-border flex-1 items-center gap-1 rounded-2xl border p-4">
              <Icon as={UsersIcon} size={18} className="text-foreground" />
              <Text className="text-h2 text-foreground">{referral.data?.referredCount ?? 0}</Text>
              <Text className="text-caption text-muted-foreground">Friends joined</Text>
            </View>
            <View className="border-border flex-1 items-center gap-1 rounded-2xl border p-4">
              <Icon as={GiftIcon} size={18} className="text-foreground" />
              <Text className="text-h2 text-foreground">{referral.data?.pointsEarned ?? 0}</Text>
              <Text className="text-caption text-muted-foreground">Points earned</Text>
            </View>
          </View>
        )}

        <View className="border-border gap-2 rounded-2xl border p-4">
          <Text className="text-label text-foreground font-semibold">How it works</Text>
          {['Share your code with a friend', 'They shop their first order', 'You both get ₹500 in rewards'].map(
            (step, index) => (
              <View key={step} className="flex-row items-center gap-2">
                <View className="bg-secondary h-5 w-5 items-center justify-center rounded-full">
                  <Text className="text-[10px] text-secondary-foreground font-semibold">{index + 1}</Text>
                </View>
                <Text className="text-label text-muted-foreground flex-1">{step}</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}
