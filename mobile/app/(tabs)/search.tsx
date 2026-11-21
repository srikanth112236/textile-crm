import { ProductGrid } from '@/components/product-card';
import { SmartImage } from '@/components/smart-image';
import { ErrorState, ProductGridSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { categoriesApi, productsApi } from '@/lib/api/endpoints';
import type { Category } from '@/lib/api/types';
import { productImages } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { store } from '@/lib/storage';
import { useDebouncedValue } from '@/lib/use-debounce';
import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { ArrowUpRightIcon, ClockIcon, SearchIcon, TrendingUpIcon, XIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RECENT_KEY = 'mentoos.recent_searches.v1';

function flatten(list: Category[], out: Category[] = []): Category[] {
  for (const category of list) {
    out.push(category);
    if (category.children) flatten(category.children, out);
  }
  return out;
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = React.useState('');
  const [committed, setCommitted] = React.useState<string | null>(null);
  const [recent, setRecent] = React.useState<string[]>([]);
  const debounced = useDebouncedValue(query.trim(), 320);
  const active = committed ?? debounced;

  React.useEffect(() => {
    void store.getJSON<string[]>(RECENT_KEY).then((saved) => setRecent(Array.isArray(saved) ? saved : []));
  }, []);

  const categories = useQuery({
    queryKey: qk.categories,
    queryFn: async () => (await categoriesApi.tree()).data,
    staleTime: 10 * 60_000,
  });

  const trending = useQuery({
    queryKey: qk.trending,
    queryFn: async () => (await productsApi.trending(6)).data,
    staleTime: 10 * 60_000,
  });

  const results = useQuery({
    queryKey: qk.products({ search: active }),
    queryFn: async () => productsApi.list({ search: active, limit: 30, status: 'active' }),
    enabled: active.length > 0,
  });

  const remember = React.useCallback((term: string) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setRecent((prev) => {
      const next = [clean, ...prev.filter((entry) => entry.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      void store.setJSON(RECENT_KEY, next);
      return next;
    });
  }, []);

  const products = results.data?.data ?? [];
  const total = results.data?.pagination.total ?? products.length;
  const isTyping = committed === null;
  const matchedCategories = React.useMemo(() => {
    if (!active || !categories.data) return [];
    const term = active.toLowerCase();
    return flatten(categories.data)
      .filter((category) => category.name.toLowerCase().includes(term))
      .slice(0, 3);
  }, [active, categories.data]);

  const suggestions = isTyping ? products.slice(0, 4) : products;

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}>
      <View className="px-4">
        <Text className="text-h1 text-foreground">Search</Text>

        <View className="mt-3 justify-center">
          <View className="absolute left-4 z-10">
            <Icon as={SearchIcon} size={18} className="text-muted-foreground" />
          </View>
          <Input
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setCommitted(null);
            }}
            onSubmitEditing={() => {
              remember(query);
              setCommitted(query.trim());
            }}
            placeholder="Search “oversized tee”, kurta, cargo…"
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            className="border-border h-12 rounded-full pl-11 pr-11"
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={() => {
                setQuery('');
                setCommitted(null);
              }}
              className="absolute right-4 z-10 h-6 w-6 items-center justify-center rounded-full active:opacity-70">
              <Icon as={XIcon} size={16} className="text-muted-foreground" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Idle state */}
      {active.length === 0 ? (
        <View className="mt-7 gap-7 px-4">
          {recent.length > 0 ? (
            <View>
              <View className="flex-row items-center justify-between">
                <Text className="text-caption text-muted-foreground font-bold tracking-[2px]">
                  RECENT
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setRecent([]);
                    void store.remove(RECENT_KEY);
                  }}>
                  <Text className="text-caption text-muted-foreground underline">Clear</Text>
                </Pressable>
              </View>
              <View className="mt-2 gap-1">
                {recent.slice(0, 5).map((term) => (
                  <Pressable
                    key={term}
                    onPress={() => {
                      setQuery(term);
                      setCommitted(term);
                    }}
                    className="flex-row items-center gap-3 rounded-lg py-2 active:opacity-60">
                    <Icon as={ClockIcon} size={14} className="text-muted-foreground" />
                    <Text className="text-body text-foreground flex-1">{term}</Text>
                    <Icon as={ArrowUpRightIcon} size={14} className="text-muted-foreground" />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {trending.data && trending.data.length > 0 ? (
            <View>
              <Text className="text-caption text-muted-foreground font-bold tracking-[2px]">
                TRENDING SEARCHES
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {trending.data.slice(0, 6).map((product) => (
                  <Pressable
                    key={product._id}
                    onPress={() => {
                      setQuery(product.name.split(' - ')[0]);
                      setCommitted(product.name.split(' - ')[0]);
                    }}
                    className="border-border bg-card flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-70">
                    <Icon as={TrendingUpIcon} size={12} className="text-brand" />
                    <Text className="text-caption text-foreground" numberOfLines={1}>
                      {product.name.split(' - ')[0]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View>
            <Text className="text-caption text-muted-foreground font-bold tracking-[2px]">
              SHOP BY CATEGORY
            </Text>
            <View className="mt-2 gap-1">
              {(categories.data ?? []).slice(0, 8).map((category) => (
                <Link
                  key={category._id}
                  href={{ pathname: '/categories/[slug]', params: { slug: category.slug ?? category._id } }}
                  asChild>
                  <Pressable className="flex-row items-center justify-between border-b border-border py-2.5 active:opacity-60">
                    <Text className="text-body text-foreground">{category.name}</Text>
                    <Text className="text-caption text-muted-foreground">
                      {category.children?.length ? `${category.children.length} sub` : ''}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        </View>
      ) : results.isLoading ? (
        <View className="mt-5 px-4">
          <ProductGridSkeleton count={4} />
        </View>
      ) : results.error ? (
        <View className="mt-4 px-4">
          <ErrorState error={results.error} onRetry={() => void results.refetch()} compact />
        </View>
      ) : products.length === 0 ? (
        <View className="mt-14 items-center px-8">
          <View className="bg-muted h-16 w-16 items-center justify-center rounded-full">
            <Icon as={SearchIcon} size={26} className="text-muted-foreground" />
          </View>
          <Text className="text-h2 text-foreground mt-4 text-center">No matches for “{active}”</Text>
          <Text className="text-label text-muted-foreground mt-1 text-center">
            Try a single word, a category, or one of the trending searches.
          </Text>
          <Button variant="outline" size="sm" className="mt-4" onPress={() => setQuery('')}>
            <Text>Clear search</Text>
          </Button>
        </View>
      ) : isTyping ? (
        /* Live suggestions while typing */
        <View className="mt-5">
          {matchedCategories.length > 0 ? (
            <View className="px-4">
              <Text className="text-caption text-muted-foreground font-bold tracking-[2px]">
                CATEGORIES
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {matchedCategories.map((category) => (
                  <Link
                    key={category._id}
                    href={{ pathname: '/categories/[slug]', params: { slug: category.slug ?? category._id } }}
                    asChild>
                    <Pressable className="border-border bg-secondary rounded-full border px-3 py-1.5 active:opacity-70">
                      <Text className="text-caption text-secondary-foreground">{category.name}</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-5 px-4">
            <Text className="text-caption text-muted-foreground font-bold tracking-[2px]">
              PRODUCTS
            </Text>
            <View className="mt-2">
              {suggestions.map((product) => (
                <Link
                  key={product._id}
                  href={{ pathname: '/product/[id]', params: { id: product._id } }}
                  asChild>
                  <Pressable
                    onPress={() => remember(active)}
                    className="flex-row items-center gap-3 border-b border-border py-2.5 active:opacity-70">
                    <SmartImage
                      uri={productImages(product)[0]}
                      style={{ width: 46, height: 58, borderRadius: 8 }}
                    />
                    <View className="flex-1">
                      <Text className="text-label text-foreground" numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text className="text-caption text-muted-foreground">
                        {product.category?.name ?? 'Mentoos'} · {formatPrice(product.price)}
                      </Text>
                    </View>
                    <Icon as={ArrowUpRightIcon} size={14} className="text-muted-foreground" />
                  </Pressable>
                </Link>
              ))}
            </View>

            <Pressable
              onPress={() => {
                remember(active);
                setCommitted(active);
              }}
              className="mt-3 h-11 flex-row items-center justify-center gap-2 rounded-full bg-primary active:opacity-90">
              <Text className="text-label text-primary-foreground font-semibold">
                See all {total} results for “{active}”
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="mt-5 px-4">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-label text-muted-foreground">
              {total} {total === 1 ? 'result' : 'results'} for “{active}”
            </Text>
            <Pressable
              onPress={() => {
                setQuery('');
                setCommitted(null);
              }}
              hitSlop={6}>
              <Text className="text-caption text-muted-foreground underline">New search</Text>
            </Pressable>
          </View>
          <View className="mt-3">
            <ProductGrid products={products} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
