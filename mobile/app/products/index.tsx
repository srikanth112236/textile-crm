import { ProductCard } from '@/components/product-card';
import { Sheet } from '@/components/sheet';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { productsApi } from '@/lib/api/endpoints';
import type { FilterFacets, ProductFilters } from '@/lib/api/types';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  PackageSearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SORTS = [
  { id: 'newest', label: 'Newest', sort: 'createdAt', order: 'desc' },
  { id: 'recommended', label: 'Recommended', sort: 'recommended', order: 'desc' },
  { id: 'price-asc', label: 'Price: low to high', sort: 'price', order: 'asc' },
  { id: 'price-desc', label: 'Price: high to low', sort: 'price', order: 'desc' },
  { id: 'rating', label: 'Top rated', sort: 'rating', order: 'desc' },
  { id: 'best-selling', label: 'Best selling', sort: 'best-selling', order: 'desc' },
  { id: 'discount', label: 'Biggest discount', sort: 'discount', order: 'desc' },
] as const;

const PRICE_BANDS = [
  { id: 'under-999', label: 'Under ₹999', min: 0, max: 999 },
  { id: '999-1999', label: '₹999 – ₹1,999', min: 999, max: 1999 },
  { id: '1999-2999', label: '₹1,999 – ₹2,999', min: 1999, max: 2999 },
  { id: 'over-3000', label: '₹3,000+', min: 3000, max: undefined },
];

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; search?: string; sort?: string; badge?: string }>();

  const [sortId, setSortId] = React.useState<string>(params.sort ?? 'newest');
  const [sizes, setSizes] = React.useState<string[]>([]);
  const [colors, setColors] = React.useState<string[]>([]);
  const [priceBand, setPriceBand] = React.useState<string | null>(null);
  const [minRating, setMinRating] = React.useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [filterOpen, setFilterOpen] = React.useState(false);

  const sort = SORTS.find((entry) => entry.id === sortId) ?? SORTS[0];
  const band = PRICE_BANDS.find((entry) => entry.id === priceBand);

  const queryFilters: ProductFilters = {
    category: params.category,
    search: params.search,
    badge: params.badge,
    sort: sort.sort as ProductFilters['sort'],
    order: sort.order as ProductFilters['order'],
    size: sizes.length > 0 ? sizes.join(',') : undefined,
    color: colors.length > 0 ? colors.join(',') : undefined,
    minPrice: band?.min,
    maxPrice: band?.max,
    minRating: minRating ?? undefined,
    inStock: inStockOnly || undefined,
    limit: 20,
  };

  const products = useInfiniteQuery({
    queryKey: qk.products(queryFilters),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => productsApi.list({ ...queryFilters, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.pages ? lastPage.pagination.page + 1 : undefined,
  });

  const facets = useQuery({
    queryKey: qk.facets({ category: params.category, search: params.search }),
    queryFn: async () => (await productsApi.facets({ category: params.category, search: params.search })).data,
    staleTime: 10 * 60_000,
  });

  const items = React.useMemo(() => products.data?.pages.flatMap((page) => page.data) ?? [], [products.data]);
  const total = products.data?.pages[0]?.pagination.total ?? items.length;
  const activeCount =
    sizes.length + colors.length + (priceBand ? 1 : 0) + (minRating ? 1 : 0) + (inStockOnly ? 1 : 0);

  const title = params.search
    ? `“${params.search}”`
    : params.badge
      ? params.badge.toUpperCase()
      : params.category
        ? params.category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
        : 'All products';

  const resetFilters = () => {
    setSizes([]);
    setColors([]);
    setPriceBand(null);
    setMinRating(null);
    setInStockOnly(false);
  };

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top + 8 }}>
      {/* Header */}
      <View className="flex-row items-center gap-2 px-4">
        <Pressable
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-accent">
          <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-h2 text-foreground" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-caption text-muted-foreground">
            {products.isLoading
              ? 'Loading…'
              : products.error
                ? '—'
                : `${total} ${total === 1 ? 'product' : 'products'}`}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Sort"
          onPress={() => setSortOpen(true)}
          className="border-border h-9 flex-row items-center gap-1 rounded-full border px-3 active:opacity-70">
          <Text className="text-caption text-foreground font-medium">{sort.label}</Text>
          <Icon as={ChevronDownIcon} size={13} className="text-muted-foreground" />
        </Pressable>
        <Pressable
          accessibilityLabel="Filters"
          onPress={() => setFilterOpen(true)}
          className={`h-9 flex-row items-center gap-1 rounded-full border px-3 active:opacity-70 ${
            activeCount > 0 ? 'border-primary bg-primary' : 'border-border'
          }`}>
          <Icon
            as={SlidersHorizontalIcon}
            size={13}
            className={activeCount > 0 ? 'text-primary-foreground' : 'text-foreground'}
          />
          <Text
            className={`text-caption font-medium ${
              activeCount > 0 ? 'text-primary-foreground' : 'text-foreground'
            }`}>
            {activeCount > 0 ? `Filters (${activeCount})` : 'Filters'}
          </Text>
        </Pressable>
      </View>

      {/* Active chips */}
      {activeCount > 0 ? (
        <View className="mt-3 flex-row flex-wrap items-center gap-2 px-4">
          {sizes.map((size) => (
            <Chip key={`size-${size}`} label={size} onRemove={() => setSizes((prev) => prev.filter((entry) => entry !== size))} />
          ))}
          {colors.map((color) => (
            <Chip key={`color-${color}`} label={color} onRemove={() => setColors((prev) => prev.filter((entry) => entry !== color))} />
          ))}
          {band ? <Chip label={band.label} onRemove={() => setPriceBand(null)} /> : null}
          {minRating ? <Chip label={`${minRating}★ & up`} onRemove={() => setMinRating(null)} /> : null}
          {inStockOnly ? <Chip label="In stock" onRemove={() => setInStockOnly(false)} /> : null}
          <Pressable onPress={resetFilters} hitSlop={8}>
            <Text className="text-caption text-muted-foreground underline">Clear all</Text>
          </Pressable>
        </View>
      ) : null}

      {products.isLoading ? (
        <View className="mt-4 px-4">
          <ProductGridSkeleton count={6} />
        </View>
      ) : products.error ? (
        <ErrorState error={products.error} onRetry={() => void products.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageSearchIcon}
          title="Nothing matches those filters"
          message="Try removing a filter or widening the price range."
          actionLabel="Clear filters"
          onAction={resetFilters}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          numColumns={2}
          className="mt-4"
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 20, paddingBottom: insets.bottom + 32 }}
          renderItem={({ item }) => <ProductCard product={item} />}
          onEndReached={() => {
            if (products.hasNextPage && !products.isFetchingNextPage) void products.fetchNextPage();
          }}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            products.isFetchingNextPage ? (
              <View className="items-center py-6">
                <ActivityIndicator />
              </View>
            ) : !products.hasNextPage && items.length > 6 ? (
              <Text className="text-caption text-muted-foreground py-6 text-center">
                You’ve seen all {total} products
              </Text>
            ) : undefined
          }
        />
      )}

      {/* Sort sheet */}
      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort by" scroll={false}>
        <View className="gap-1 pb-2">
          {SORTS.map((option) => {
            const active = option.id === sortId;
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  setSortId(option.id);
                  setSortOpen(false);
                }}
                className="h-11 flex-row items-center justify-between rounded-lg px-2 active:bg-accent">
                <Text className={`text-body ${active ? 'text-foreground font-semibold' : 'text-foreground'}`}>
                  {option.label}
                </Text>
                {active ? <View className="bg-primary h-2 w-2 rounded-full" /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      {/* Filter sheet */}
      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
        subtitle={`${facets.data?.sizes.length ?? 0} sizes · ${facets.data?.colors.length ?? 0} colours`}
        footer={
          <View className="flex-row gap-2 pb-1">
            <Button variant="outline" className="flex-1" onPress={resetFilters}>
              <Text>Reset</Text>
            </Button>
            <Button className="flex-1" onPress={() => setFilterOpen(false)}>
              <Text>Apply{activeCount > 0 ? ` (${activeCount})` : ''}</Text>
            </Button>
          </View>
        }>
        <FacetSection title="Price">
          <View className="flex-row flex-wrap gap-2">
            {PRICE_BANDS.map((option) => (
              <Selectable
                key={option.id}
                label={option.label}
                active={priceBand === option.id}
                onPress={() => setPriceBand(priceBand === option.id ? null : option.id)}
              />
            ))}
          </View>
          {facets.data ? (
            <Text className="text-caption text-muted-foreground mt-2">
              Catalogue range {formatPrice(facets.data.minPrice)} – {formatPrice(facets.data.maxPrice)}
            </Text>
          ) : null}
        </FacetSection>

        <FacetSection title="Size">
          <View className="flex-row flex-wrap gap-2">
            {(facets.data?.sizes ?? []).map((size) => (
              <Selectable
                key={size}
                label={size}
                active={sizes.includes(size)}
                onPress={() =>
                  setSizes((prev) => (prev.includes(size) ? prev.filter((entry) => entry !== size) : [...prev, size]))
                }
              />
            ))}
          </View>
        </FacetSection>

        {(facets.data?.colors.length ?? 0) > 0 ? (
          <FacetSection title="Colour">
            <View className="flex-row flex-wrap gap-2">
              {facets.data?.colors.map((color) => {
                const active = colors.includes(color.name);
                return (
                  <Pressable
                    key={color.name}
                    onPress={() =>
                      setColors((prev) =>
                        prev.includes(color.name) ? prev.filter((entry) => entry !== color.name) : [...prev, color.name]
                      )
                    }
                    className={`h-9 flex-row items-center gap-2 rounded-full border px-3 active:opacity-70 ${
                      active ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                    <View
                      className="border-border h-4 w-4 rounded-full border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <Text className={`text-caption ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {color.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </FacetSection>
        ) : null}

        <FacetSection title="Rating">
          <View className="flex-row flex-wrap gap-2">
            {[4, 3].map((rating) => (
              <Selectable
                key={rating}
                label={`${rating}★ & up`}
                active={minRating === rating}
                onPress={() => setMinRating(minRating === rating ? null : rating)}
              />
            ))}
          </View>
        </FacetSection>

        <FacetSection title="Availability">
          <Selectable label="In stock only" active={inStockOnly} onPress={() => setInStockOnly((prev) => !prev)} />
        </FacetSection>
      </Sheet>
    </View>
  );
}

function FacetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-5 gap-2">
      <Text className="text-label text-foreground font-semibold">{title}</Text>
      {children}
    </View>
  );
}

function Selectable({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-9 justify-center rounded-full border px-3 active:opacity-70 ${
        active ? 'border-primary bg-primary' : 'border-border bg-background'
      }`}>
      <Text className={`text-caption ${active ? 'text-primary-foreground' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Pressable
      onPress={onRemove}
      className="border-border bg-secondary flex-row items-center gap-1 rounded-full border px-2.5 py-1 active:opacity-70">
      <Text className="text-caption text-secondary-foreground capitalize">{label}</Text>
      <XIcon size={11} color="#64748B" />
    </Pressable>
  );
}
