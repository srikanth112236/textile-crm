import { SmartImage } from '@/components/smart-image';
import { ErrorState } from '@/components/states';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Wordmark } from '@/components/wordmark';
import { categoriesApi, productsApi } from '@/lib/api/endpoints';
import type { Category } from '@/lib/api/types';
import { resolveImage } from '@/lib/config';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { ChevronRightIcon, LayoutGridIcon, SearchIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tileWidth = (width - 32 - 12) / 2;

  const categories = useQuery({
    queryKey: qk.categories,
    queryFn: async () => (await categoriesApi.tree()).data,
  });

  const total = useQuery({
    queryKey: qk.products({ limit: 1 }),
    queryFn: async () => (await productsApi.list({ limit: 1 })).pagination.total,
    staleTime: 5 * 60_000,
  });

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={categories.isRefetching} onRefresh={() => void categories.refetch()} />
      }>
      {/* Header */}
      <View className="px-4">
        <Wordmark size="sm" />
        <Text className="text-h1 text-foreground mt-2">Shop</Text>
        <Text className="text-label text-muted-foreground mt-1">
          {total.data ?? '—'} styles across {categories.data?.length ?? '—'} collections, made in India.
        </Text>

        <Link href="/search" asChild>
          <Pressable className="border-border bg-card mt-3 h-11 flex-row items-center gap-2 rounded-full border px-4 active:opacity-80">
            <Icon as={SearchIcon} size={17} className="text-muted-foreground" />
            <Text className="text-label text-muted-foreground">Search products, collections</Text>
          </Pressable>
        </Link>
      </View>

      {/* All products */}
      <View className="mt-4 px-4">
        <Link href={{ pathname: '/products', params: {} }} asChild>
          <Pressable className="overflow-hidden rounded-2xl active:opacity-90">
            <LinearGradient
              colors={['#0f172a', '#1e293b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16 }}>
              <View className="flex-row items-center gap-3">
                <View className="bg-brand h-11 w-11 items-center justify-center rounded-xl">
                  <Icon as={LayoutGridIcon} size={20} className="text-brand-foreground" />
                </View>
                <View className="flex-1">
                  <Text className="text-body font-semibold text-white">All products</Text>
                  <Text className="text-caption text-white/60">
                    {total.data ?? 'Everything'} · filter by size, colour and price
                  </Text>
                </View>
                <View className="bg-white/10 h-8 w-8 items-center justify-center rounded-full">
                  <ChevronRightIcon size={16} color="#ffffff" />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Link>
      </View>

      {/* Category tiles */}
      {categories.isLoading ? (
        <View className="mt-4 flex-row flex-wrap gap-3 px-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="rounded-2xl" style={{ width: tileWidth, height: 168 }} />
          ))}
        </View>
      ) : categories.error ? (
        <View className="mt-4 px-4">
          <ErrorState error={categories.error} onRetry={() => void categories.refetch()} compact />
        </View>
      ) : (
        <View className="mt-4 flex-row flex-wrap gap-3 px-4">
          {(categories.data ?? []).map((category) => (
            <CategoryTile key={category._id} category={category} width={tileWidth} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function CategoryTile({ category, width }: { category: Category; width: number }) {
  const image = resolveImage(category.image);
  const subCount = category.children?.length ?? 0;

  return (
    <Link
      href={{ pathname: '/categories/[slug]', params: { slug: category.slug ?? category._id } }}
      asChild>
      <Pressable
        className="overflow-hidden rounded-2xl active:opacity-90"
        style={{ width, height: 168 }}>
        <SmartImage uri={image} style={{ width: '100%', height: '100%' }} />
        <LinearGradient
          colors={['rgba(2,8,23,0.05)', 'rgba(2,8,23,0.78)']}
          locations={[0.35, 1]}
          style={{ position: 'absolute', inset: 0 }}
        />
        <View className="absolute inset-x-0 bottom-0 gap-0.5 p-3">
          <Text className="text-label font-semibold text-white" numberOfLines={1}>
            {category.name}
          </Text>
          <Text className="text-[10px] text-white/70">
            {subCount > 0 ? `${subCount} sub-collections` : 'Shop now'}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
