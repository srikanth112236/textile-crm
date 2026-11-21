import { ProductGrid } from '@/components/product-card';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { wishlistApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronLeftIcon, HeartIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();

  const wishlist = useQuery({
    queryKey: qk.wishlist,
    queryFn: async () => (await wishlistApi.list()).data,
    enabled: isSignedIn,
  });

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-2 px-4 pb-2">
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent">
          <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
        </Pressable>
        <Text className="text-h2 text-foreground flex-1">Wishlist</Text>
        {wishlist.data ? (
          <Text className="text-caption text-muted-foreground">{wishlist.data.length} saved</Text>
        ) : null}
      </View>

      {!isSignedIn ? (
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Text className="text-h2 text-foreground text-center">Sign in to save favourites</Text>
          <Button onPress={() => router.push('/auth')}>
            <Text>Sign in</Text>
          </Button>
        </View>
      ) : wishlist.isLoading ? (
        <View className="px-4 pt-2">
          <ProductGridSkeleton count={4} />
        </View>
      ) : wishlist.error ? (
        <ErrorState error={wishlist.error} onRetry={() => void wishlist.refetch()} />
      ) : (wishlist.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="Nothing saved yet"
          message="Tap the heart on any product to keep it here for later."
          actionLabel="Browse products"
          onAction={() => router.replace('/')}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
          <ProductGrid products={wishlist.data ?? []} />
        </ScrollView>
      )}
    </View>
  );
}
