import { QuantityStepper } from '@/components/quantity-stepper';
import { ProductRail } from '@/components/section';
import { SmartImage } from '@/components/smart-image';
import { ErrorState, RowsSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { productsApi, wishlistApi } from '@/lib/api/endpoints';
import type { Product, VariantAttribute } from '@/lib/api/types';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { productImages } from '@/lib/config';
import { formatPrice } from '@/lib/format';
import { qk } from '@/lib/query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  HeartIcon,
  RotateCcwIcon,
  Share2Icon,
  ShieldCheckIcon,
  StarIcon,
  TruckIcon,
} from 'lucide-react-native';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isSignedIn } = useAuth();
  const { add, itemCount } = useCart();
  const queryClient = useQueryClient();

  const [selected, setSelected] = React.useState<Record<string, string>>({});
  const [quantity, setQuantity] = React.useState(1);
  const [page, setPage] = React.useState(0);
  const [added, setAdded] = React.useState(false);
  const [expanded, setExpanded] = React.useState<'description' | 'size' | 'specs' | null>(null);
  const [reviewPage, setReviewPage] = React.useState(1);

  const productQuery = useQuery({
    queryKey: qk.product(id),
    queryFn: async () => (await productsApi.get(id)).data,
    enabled: Boolean(id),
  });

  const product = productQuery.data;

  const recommendations = useQuery({
    queryKey: qk.recommendations(id),
    queryFn: async () => (await productsApi.recommendations(id, 8)).data,
    enabled: Boolean(id) && Boolean(product),
  });

  const reviews = useQuery({
    queryKey: [...qk.reviews(id), reviewPage],
    queryFn: async () => productsApi.reviews(id, reviewPage, 5, 'newest'),
    enabled: Boolean(id),
  });

  const wishlistCheckKey = React.useMemo(() => ['wishlist-check', id] as const, [id]);

  const wishlistCheck = useQuery({
    queryKey: wishlistCheckKey,
    queryFn: async () => (await wishlistApi.check(id)).data.isInWishlist,
    enabled: isSignedIn && Boolean(id),
  });

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      const inList = wishlistCheck.data === true;
      if (inList) await wishlistApi.remove(id);
      else await wishlistApi.add(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistCheckKey });
      void queryClient.invalidateQueries({ queryKey: qk.wishlist });
      Haptics.selectionAsync().catch(() => {});
    },
  });

  const attributes = React.useMemo(() => (product?.variantAttributes ?? []).filter((attribute) => attribute.options?.length > 0), [product]);

  React.useEffect(() => {
    if (!product || attributes.length === 0) return;
    setSelected((prev) => {
      const next = { ...prev };
      for (const attribute of attributes) {
        if (!next[attribute.name]) {
          const fromDefaultSku = product.variantSKUs?.find((sku) => sku.isDefault)?.attributes?.[attribute.name];
          next[attribute.name] = fromDefaultSku ?? attribute.options[0]?.value ?? '';
        }
      }
      return next;
    });
  }, [attributes, product]);

  const matchingSku = React.useMemo(() => {
    if (!product?.variantSKUs?.length || attributes.length === 0) return undefined;
    return product.variantSKUs.find((sku) =>
      attributes.every((attribute) => sku.attributes?.[attribute.name] === selected[attribute.name])
    );
  }, [attributes, product, selected]);

  const price = matchingSku?.price ?? product?.price ?? 0;
  const compareAtPrice = matchingSku?.compareAtPrice ?? product?.compareAtPrice;
  const stock = matchingSku ? matchingSku.stock : product?.stock ?? 0;
  const soldOut = stock <= 0 || product?.status === 'out_of_stock';
  const images = productImages(product);
  const off = compareAtPrice && compareAtPrice > price ? Math.round((1 - price / compareAtPrice) * 100) : 0;
  const galleryHeight = Math.min(width * 1.2, 470);

  const variations = React.useMemo(
    () =>
      attributes
        .map((attribute) => ({ name: attribute.name, value: selected[attribute.name] }))
        .filter((variation) => Boolean(variation.value)),
    [attributes, selected]
  );

  const onAdd = async () => {
    if (!product || soldOut) return;
    await add(product, quantity, variations);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  if (productQuery.isLoading) {
    return <ProductSkeleton height={galleryHeight} topInset={insets.top} />;
  }

  if (productQuery.error || !product) {
    return (
      <View className="bg-background flex-1" style={{ paddingTop: insets.top }}>
        <BackButton top={insets.top + 8} />
        <ErrorState error={productQuery.error} onRetry={() => void productQuery.refetch()} />
      </View>
    );
  }

  const reviewList = reviews.data?.data ?? [];
  const reviewTotal = reviews.data?.pagination.total ?? product.totalReviews ?? 0;
  const hasMoreReviews = (reviews.data?.pagination.pages ?? 1) > reviewPage;

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 132 }} showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View style={{ height: galleryHeight }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}>
            {images.length > 0 ? (
              images.map((uri, index) => (
                <SmartImage key={`image-${index}`} uri={uri} style={{ width, height: galleryHeight }} />
              ))
            ) : (
              <View className="bg-muted" style={{ width, height: galleryHeight }} />
            )}
          </ScrollView>

          <LinearGradient
            colors={['rgba(2,8,23,0.28)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}
          />

          {images.length > 1 ? (
            <View className="absolute bottom-3 w-full flex-row justify-center gap-1.5">
              {images.map((uri, index) => (
                <View
                  key={`dot-${index}`}
                  className={`h-1.5 rounded-full ${index === page ? 'bg-foreground w-5' : 'bg-foreground/30 w-1.5'}`}
                />
              ))}
            </View>
          ) : null}

          <BackButton top={insets.top + 8} />
          <View style={{ top: insets.top + 8 }} className="absolute right-4 flex-row gap-2">
            <Pressable
              accessibilityLabel="Share product"
              onPress={() =>
                void Share.share({
                  message: `${product.name} — ${formatPrice(price)} on Mentoos`,
                })
              }
              className="bg-background/90 h-10 w-10 items-center justify-center rounded-full active:opacity-70">
              <Icon as={Share2Icon} size={17} className="text-foreground" />
            </Pressable>
            <Pressable
              accessibilityLabel="Save to wishlist"
              onPress={() => {
                if (!isSignedIn) {
                  router.push('/auth');
                  return;
                }
                toggleWishlist.mutate();
              }}
              className="bg-background/90 h-10 w-10 items-center justify-center rounded-full active:opacity-70">
              <Icon
                as={HeartIcon}
                size={17}
                className={wishlistCheck.data ? 'fill-destructive text-destructive' : 'text-foreground'}
              />
            </Pressable>
          </View>
        </View>

        {/* Summary */}
        <View className="px-4 pt-5">
          <View className="flex-row items-center gap-2">
            <Text className="text-caption text-muted-foreground flex-1">
              {product.brand?.name ?? product.category?.name ?? 'Mentoos'}
            </Text>
            {(product.badges ?? []).slice(0, 2).map((badge) => (
              <View key={badge} className="bg-secondary rounded-full px-2 py-0.5">
                <Text className="text-caption text-secondary-foreground capitalize">{badge}</Text>
              </View>
            ))}
          </View>

          <Text className="text-h1 text-foreground mt-1">{product.name}</Text>

          <Pressable
            onPress={() => setExpanded(expanded === 'specs' ? null : 'specs')}
            className="mt-2 flex-row items-center gap-1.5 active:opacity-70">
            <Icon as={StarIcon} size={13} className="fill-sale text-sale" />
            <Text className="text-label text-foreground font-medium">
              {(product.averageRating ?? 0).toFixed(1)}
            </Text>
            <Text className="text-label text-muted-foreground underline">
              {reviewTotal} {reviewTotal === 1 ? 'review' : 'reviews'}
            </Text>
            <Text className={`text-label ${soldOut ? 'text-destructive' : 'text-success'}`}>
              · {soldOut ? 'Sold out' : 'In stock'}
            </Text>
          </Pressable>

          <View className="mt-3 flex-row flex-wrap items-baseline gap-2">
            <Text className="text-h2 text-foreground">{formatPrice(price)}</Text>
            {off > 0 ? (
              <>
                <Text className="text-label text-muted-foreground line-through">
                  {formatPrice(compareAtPrice!)}
                </Text>
                <View className="bg-sale/10 rounded-full px-2 py-0.5">
                  <Text className="text-caption text-sale font-semibold">Save {off}%</Text>
                </View>
              </>
            ) : null}
          </View>
          <Text className="text-caption text-muted-foreground mt-1">Inclusive of all taxes</Text>

          {product.shortDescription ? (
            <Text className="text-body text-muted-foreground mt-3">{product.shortDescription}</Text>
          ) : null}

          {/* Variants */}
          {attributes.map((attribute) => (
            <VariantPicker
              key={attribute.name}
              attribute={attribute}
              value={selected[attribute.name]}
              onChange={(value) => setSelected((prev) => ({ ...prev, [attribute.name]: value }))}
            />
          ))}

          {/* Quantity */}
          <View className="mt-5 flex-row items-center justify-between">
            <Text className="text-label text-foreground font-medium">Quantity</Text>
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.min(10, Math.max(1, stock))}
            />
          </View>

          {/* Delivery */}
          <View className="border-border bg-card mt-6 gap-3 rounded-2xl border p-4">
            <InfoRow icon={TruckIcon} title="Free delivery on orders over ₹1,999" />
            <InfoRow icon={RotateCcwIcon} title="30-day free returns, no questions" />
            <InfoRow icon={ShieldCheckIcon} title="Secure payments · UPI, cards, COD" />
          </View>

          {/* Description */}
          <Accordion
            title="Product details"
            open={expanded === 'description'}
            onToggle={() => setExpanded(expanded === 'description' ? null : 'description')}>
            <Text className="text-body text-muted-foreground">
              {product.description ?? 'No description available for this product.'}
            </Text>
            {product.features && product.features.length > 0 ? (
              <View className="mt-3 gap-1.5">
                {product.features.slice(0, 8).map((feature) => (
                  <View key={feature} className="flex-row gap-2">
                    <Text className="text-label text-muted-foreground">•</Text>
                    <Text className="text-label text-muted-foreground flex-1">{feature}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View className="mt-3 flex-row flex-wrap gap-2">
              {[product.fit, product.fabric, product.pattern, product.occasion, product.washCare]
                .filter(Boolean)
                .map((value) => (
                  <View key={String(value)} className="bg-secondary rounded-full px-2.5 py-1">
                    <Text className="text-caption text-secondary-foreground">{String(value)}</Text>
                  </View>
                ))}
            </View>
          </Accordion>

          {/* Specs + size chart */}
          {product.specifications && product.specifications.length > 0 ? (
            <Accordion
              title="Specifications"
              open={expanded === 'specs'}
              onToggle={() => setExpanded(expanded === 'specs' ? null : 'specs')}>
              <View className="gap-1.5">
                {product.specifications.slice(0, 12).map((spec) => (
                  <View key={`${spec.name}-${spec.value}`} className="flex-row justify-between gap-4">
                    <Text className="text-label text-muted-foreground flex-1">{spec.name}</Text>
                    <Text className="text-label text-foreground flex-1 text-right">
                      {spec.value}
                      {spec.unit ? ` ${spec.unit}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </Accordion>
          ) : null}

          {product.sizeChart && product.sizeChart.length > 0 ? (
            <Accordion
              title="Size guide"
              open={expanded === 'size'}
              onToggle={() => setExpanded(expanded === 'size' ? null : 'size')}>
              <View className="border-border overflow-hidden rounded-lg border">
                <View className="bg-secondary flex-row px-2 py-1.5">
                  {['size', 'chest', 'length', 'waist'].map((key) => (
                    <Text key={key} className="text-caption text-secondary-foreground flex-1 capitalize">
                      {key}
                    </Text>
                  ))}
                </View>
                {product.sizeChart.slice(0, 10).map((row) => (
                  <View key={row.size} className="border-border flex-row border-t px-2 py-1.5">
                    <Text className="text-caption text-foreground flex-1">{row.size}</Text>
                    <Text className="text-caption text-muted-foreground flex-1">{row.chest ?? '—'}</Text>
                    <Text className="text-caption text-muted-foreground flex-1">{row.length ?? '—'}</Text>
                    <Text className="text-caption text-muted-foreground flex-1">{row.waist ?? '—'}</Text>
                  </View>
                ))}
              </View>
            </Accordion>
          ) : null}

          {/* Reviews */}
          <View className="mt-6">
            <View className="flex-row items-baseline justify-between">
              <Text className="text-h2 text-foreground">Reviews</Text>
              <Text className="text-caption text-muted-foreground">{reviewTotal} total</Text>
            </View>

            {reviews.isLoading ? (
              <View className="mt-3">
                <RowsSkeleton rows={2} />
              </View>
            ) : reviewList.length === 0 ? (
              <Text className="text-label text-muted-foreground mt-2">
                No reviews yet — be the first to review this product.
              </Text>
            ) : (
              <View className="mt-3 gap-3">
                {reviewList.map((review) => (
                  <View key={review._id} className="border-border rounded-xl border p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-label text-foreground font-semibold">
                        {review.userName ?? 'Verified buyer'}
                      </Text>
                      <View className="flex-row items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((step) => (
                          <Icon
                            key={step}
                            as={StarIcon}
                            size={10}
                            className={step <= review.rating ? 'fill-sale text-sale' : 'text-border fill-border'}
                          />
                        ))}
                      </View>
                    </View>
                    {review.comment ? (
                      <Text className="text-label text-foreground mt-1.5">{review.comment}</Text>
                    ) : null}
                    <Text className="text-caption text-muted-foreground mt-1.5">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {review.verifiedPurchase ? ' · Verified purchase' : ''}
                    </Text>
                  </View>
                ))}

                {hasMoreReviews ? (
                  <Button variant="outline" size="sm" onPress={() => setReviewPage((prev) => prev + 1)}>
                    <Text>Load more reviews</Text>
                  </Button>
                ) : null}
              </View>
            )}
          </View>
        </View>

        {/* Recommendations */}
        {recommendations.data && recommendations.data.length > 0 ? (
          <View className="mt-8">
            <ProductRail title="You may also like" products={recommendations.data} />
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky purchase bar */}
      <View
        className="border-border bg-background border-t px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}>
        {added ? (
          <View className="mb-2 flex-row items-center justify-between rounded-lg bg-success/10 px-3 py-2">
            <Text className="text-caption text-success font-medium">Added to your bag</Text>
            <Pressable onPress={() => router.push('/cart')} hitSlop={6}>
              <Text className="text-caption text-foreground font-semibold underline">View bag ({itemCount})</Text>
            </Pressable>
          </View>
        ) : null}
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-caption text-muted-foreground">{soldOut ? 'Out of stock' : 'Total'}</Text>
            <Text className="text-h2 text-foreground">{formatPrice(price * quantity)}</Text>
          </View>
          <Button className="h-12 flex-1" disabled={soldOut} onPress={() => void onAdd()}>
            <Text className="text-body font-semibold">{soldOut ? 'Sold out' : 'Add to bag'}</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

function BackButton({ top }: { top: number }) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={10}
      style={{ top }}
      className="bg-background/90 absolute left-4 z-10 h-10 w-10 items-center justify-center rounded-full active:opacity-70">
      <Icon as={ChevronLeftIcon} size={20} className="text-foreground" />
    </Pressable>
  );
}

function VariantPicker({
  attribute,
  value,
  onChange,
}: {
  attribute: VariantAttribute;
  value?: string;
  onChange: (value: string) => void;
}) {
  const isColor = attribute.type === 'color' || /colou?r/i.test(attribute.name);

  return (
    <View className="mt-5">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-label text-foreground font-medium capitalize">{attribute.name}</Text>
        <Text className="text-label text-muted-foreground">{value}</Text>
      </View>

      {isColor ? (
        <View className="mt-2 flex-row flex-wrap gap-2.5">
          {attribute.options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityLabel={option.value}
                onPress={() => {
                  onChange(option.value);
                  Haptics.selectionAsync().catch(() => {});
                }}
                className={`h-9 w-9 items-center justify-center rounded-full border-2 ${
                  active ? 'border-foreground' : 'border-transparent'
                }`}>
                <View
                  className="border-border h-7 w-7 rounded-full border"
                  style={{ backgroundColor: option.colorCode ?? '#E2E8F0' }}
                />
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {attribute.options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  Haptics.selectionAsync().catch(() => {});
                }}
                className={`h-10 min-w-14 items-center justify-center rounded-md border px-3 ${
                  active ? 'border-primary bg-primary' : 'border-border bg-background'
                }`}>
                <Text className={`text-label ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {option.label ?? option.value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function InfoRow({ icon: IconComponent, title }: { icon: typeof TruckIcon; title: string }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <Icon as={IconComponent} size={16} className="text-muted-foreground" />
      <Text className="text-label text-foreground flex-1">{title}</Text>
    </View>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="border-border mt-4 border-b pb-4">
      <Pressable onPress={onToggle} className="flex-row items-center justify-between py-2 active:opacity-70">
        <Text className="text-label text-foreground font-semibold">{title}</Text>
        <Icon as={open ? ChevronUpIcon : ChevronDownIcon} size={16} className="text-muted-foreground" />
      </Pressable>
      {open ? <View className="pt-1">{children}</View> : null}
    </View>
  );
}

function ProductSkeleton({ height, topInset }: { height: number; topInset: number }) {
  return (
    <View className="bg-background flex-1">
      <Skeleton style={{ width: '100%', height }} />
      <View className="gap-3 px-4 pt-5">
        <Skeleton className="h-3 w-1/4 rounded" />
        <Skeleton className="h-6 w-4/5 rounded" />
        <Skeleton className="h-4 w-2/5 rounded" />
        <Skeleton className="h-6 w-1/3 rounded" />
        <Skeleton className="mt-4 h-11 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-lg" />
      </View>
      <BackButton top={topInset + 8} />
    </View>
  );
}
