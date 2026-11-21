import { ProductGrid } from '@/components/product-card';
import { SmartImage } from '@/components/smart-image';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { categoriesApi, productsApi } from '@/lib/api/endpoints';
import type { Category } from '@/lib/api/types';
import { resolveImage } from '@/lib/config';
import { qk } from '@/lib/query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeftIcon, PackageSearchIcon } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function findCategory(list: Category[], key: string): Category | undefined {
  for (const category of list) {
    if (category.slug === key || category._id === key) return category;
    const nested = category.children ? findCategory(category.children, key) : undefined;
    if (nested) return nested;
  }
  return undefined;
}

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const categories = useQuery({
    queryKey: qk.categories,
    queryFn: async () => (await categoriesApi.tree()).data,
    staleTime: 10 * 60_000,
  });

  const category = React.useMemo(
    () => (categories.data ? findCategory(categories.data, slug) : undefined),
    [categories.data, slug]
  );

  const products = useInfiniteQuery({
    queryKey: [...qk.products({ category: slug }), 'category-page'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      productsApi.list({ category: slug, page: pageParam, limit: 20, status: 'active' }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.pages ? lastPage.pagination.page + 1 : undefined,
    enabled: Boolean(slug),
  });

  const items = products.data?.pages.flatMap((page) => page.data) ?? [];
  const total = products.data?.pages[0]?.pagination.total ?? items.length;

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ height: 190 }}>
          {resolveImage(category?.image) ? (
            <SmartImage uri={resolveImage(category?.image)} style={{ width: '100%', height: '100%' }} />
          ) : (
            <View className="bg-secondary h-full w-full" />
          )}
          <View className="absolute inset-0 bg-black/45" />
          <Pressable
            accessibilityLabel="Go back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/shop'))}
            hitSlop={10}
            style={{ top: insets.top + 8 }}
            className="bg-background/90 absolute left-4 h-10 w-10 items-center justify-center rounded-full active:opacity-70">
            <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
          </Pressable>
          <View className="absolute inset-x-0 bottom-0 p-4">
            <Text className="text-caption font-semibold tracking-widest text-white/80">COLLECTION</Text>
            <Text className="text-h1 mt-1 text-white">{category?.name ?? slug}</Text>
            <Text className="text-label mt-0.5 text-white/80">
              {products.isLoading ? 'Loading…' : `${total} products`}
            </Text>
          </View>
        </View>

        <View className="px-4 pt-4">
          {category?.description ? (
            <Text className="text-body text-muted-foreground">{category.description}</Text>
          ) : null}

          {category?.children && category.children.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
              {category.children.map((child) => (
                <Pressable
                  key={child._id}
                  onPress={() =>
                    router.push({
                      pathname: '/categories/[slug]',
                      params: { slug: child.slug ?? child._id },
                    })
                  }
                  className="border-border bg-card rounded-full border px-3 py-1.5 active:opacity-70">
                  <Text className="text-caption text-foreground">{child.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <View className="px-4 pt-2">
          {products.isLoading ? (
            <ProductGridSkeleton count={6} />
          ) : products.error ? (
            <ErrorState error={products.error} onRetry={() => void products.refetch()} compact />
          ) : items.length === 0 ? (
            <EmptyState
              icon={PackageSearchIcon}
              title="Nothing in this collection yet"
              message="New styles drop every week — check the full catalogue in the meantime."
              actionLabel="Browse all products"
              onAction={() => router.push('/products')}
            />
          ) : (
            <>
              <ProductGrid products={items} />
              {products.hasNextPage ? (
                <Button
                  variant="outline"
                  className="mt-5 h-11"
                  disabled={products.isFetchingNextPage}
                  onPress={() => void products.fetchNextPage()}>
                  {products.isFetchingNextPage ? <ActivityIndicator /> : <Text>Load more</Text>}
                </Button>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
