import { Wordmark } from '@/components/wordmark';
import { ProductRail, SectionHeader } from '@/components/section';
import { SmartImage } from '@/components/smart-image';
import { ErrorState, ProductGridSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { categoriesApi, productsApi, settingsApi, shopLookApi } from '@/lib/api/endpoints';
import type { Category, FeaturedReview, Product, ShopLook } from '@/lib/api/types';
import { useCart } from '@/lib/cart';
import { productImages, resolveImage } from '@/lib/config';
import { qk } from '@/lib/query';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import {
  ChevronRightIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  StarIcon,
  TruckIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Same three slides as the storefront hero (app/components/store/MentoosHero.tsx). */
const HERO_SLIDES = [
  {
    id: 1,
    badge: 'Bestseller collection',
    tag: 'New arrivals 2026',
    title: 'The oversized revolution',
    subtitle: 'Heavyweight 240 GSM combed cotton, cut for effortless style.',
    cta: 'Shop oversized tees',
    category: 't-shirts',
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 2,
    badge: 'Limited edition',
    tag: 'Ethnic & festive classics',
    title: 'Designer kurtas & nehru jackets',
    subtitle: 'Hand-crafted linen kurtas and structured waistcoats.',
    cta: 'Explore ethnic wear',
    category: 'ethnic-wear',
    image:
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 3,
    badge: 'Everyday wear',
    tag: 'Casual & formal essentials',
    title: 'Street & smart trousers',
    subtitle: 'Wrinkle-resistant chinos, relaxed cargos, tailored formals.',
    cta: 'Discover trousers',
    category: 'trousers',
    image:
      'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=1400&q=80',
  },
];

type HomeData = {
  newArrivals: Product[];
  trending: Product[];
  bestSellers: Product[];
  categories: Category[];
  looks: ShopLook[];
  reviews: FeaturedReview[];
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { itemCount } = useCart();
  const heroWidth = width - 32;

  const home = useQuery({
    queryKey: qk.home,
    queryFn: async (): Promise<HomeData> => {
      const [newArrivals, trending, bestSellers, categories, looks, reviews] = await Promise.allSettled([
        productsApi.list({ limit: 10, sort: 'createdAt', order: 'desc' }),
        productsApi.trending(10),
        productsApi.list({ limit: 10, sort: 'best-selling', order: 'desc' }),
        categoriesApi.tree(),
        shopLookApi.list(),
        productsApi.featuredReviews(8),
      ]);

      const emptyPage = { success: true, data: [] as Product[], pagination: { page: 1, limit: 0, total: 0, pages: 0 } };
      const pick = <T,>(result: PromiseSettledResult<T>, fallback: T): T =>
        result.status === 'fulfilled' ? result.value : fallback;

      const best = pick(bestSellers, emptyPage);
      const sections = [newArrivals, trending, bestSellers, categories, looks, reviews];
      const failed = sections.filter((section) => section.status === 'rejected');
      if (failed.length > 0 && best.data.length === 0) {
        throw (failed[0] as PromiseRejectedResult).reason;
      }

      return {
        newArrivals: pick(newArrivals, emptyPage).data,
        trending: (() => {
          const value = pick(trending, { success: true, data: [] as Product[] }).data;
          return value.length > 0 ? value : best.data;
        })(),
        bestSellers: best.data,
        categories: pick(categories, { success: true, data: [] as Category[] }).data,
        looks: pick(looks, { success: true, data: [] as ShopLook[] }).data,
        reviews: pick(reviews, { success: true, data: [] as FeaturedReview[] }).data,
      };
    },
  });

  const settings = useQuery({
    queryKey: qk.settings,
    queryFn: async () => (await settingsApi.get()).data,
    staleTime: 5 * 60_000,
  });

  const data = home.data;
  const announcement =
    settings.data?.storefront?.announcements?.[0]?.text ??
    settings.data?.storefront?.announcements?.[0]?.message ??
    'Free shipping over ₹999 · 30-day easy returns';

  const tiles = (data?.categories ?? []).slice(0, 4);

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={home.isRefetching}
          onRefresh={() => {
            void home.refetch();
            void settings.refetch();
          }}
          tintColor="#f59e0b"
        />
      }>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Wordmark size="md" />
            <Text className="text-[9px] font-bold uppercase tracking-[3px] text-brand">
              Modern menswear
            </Text>
          </View>
          <View className="flex-row items-center gap-0.5">
            <Link href="/search" asChild>
              <Pressable
                accessibilityLabel="Search"
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full active:bg-accent">
                <Icon as={SearchIcon} size={21} className="text-foreground" />
              </Pressable>
            </Link>
            <Link href="/cart" asChild>
              <Pressable
                accessibilityLabel="Open bag"
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full active:bg-accent">
                <Icon as={ShoppingBagIcon} size={21} className="text-foreground" />
                {itemCount > 0 ? (
                  <View className="bg-brand absolute right-1 top-1 h-4 min-w-4 items-center justify-center rounded-full px-1">
                    <Text className="text-[10px] font-bold text-brand-foreground">{itemCount}</Text>
                  </View>
                ) : null}
              </Pressable>
            </Link>
          </View>
        </View>
      </View>

      {/* Announcement */}
      <View className="border-brand/20 bg-brand/10 mx-4 mb-4 flex-row items-center justify-center gap-2 rounded-full border px-3 py-1.5">
        <Icon as={SparklesIcon} size={12} className="text-brand" />
        <Text className="text-caption text-foreground/80 flex-shrink" numberOfLines={1}>
          {announcement}
        </Text>
      </View>

      {home.isLoading ? (
        <HomeSkeleton heroWidth={heroWidth} />
      ) : home.error && !home.data ? (
        <ErrorState error={home.error} onRetry={() => void home.refetch()} />
      ) : (
        <View className="gap-9">
          <HeroCarousel heroWidth={heroWidth} />

          {/* Category tiles */}
          {tiles.length > 0 ? (
            <View className="gap-3">
              <SectionHeader title="Shop by category" href={'/shop' as never} action="All" className="px-4" />
              <View className="flex-row flex-wrap gap-3 px-4">
                {tiles.map((category) => (
                  <Link
                    key={category._id}
                    href={{ pathname: '/categories/[slug]', params: { slug: category.slug ?? category._id } }}
                    asChild>
                    <Pressable
                      className="overflow-hidden rounded-2xl active:opacity-90"
                      style={{ width: (width - 32 - 12) / 2, height: 132 }}>
                      <SmartImage uri={resolveImage(category.image)} style={{ width: '100%', height: '100%' }} />
                      <LinearGradient
                        colors={['transparent', 'rgba(2,8,23,0.75)']}
                        style={{ position: 'absolute', inset: 0 }}
                      />
                      <View className="absolute inset-x-0 bottom-0 p-3">
                        <Text className="text-label font-semibold text-white" numberOfLines={1}>
                          {category.name}
                        </Text>
                        <Text className="text-[10px] text-white/70">
                          {category.children?.length ? `${category.children.length} collections` : 'Shop now'}
                        </Text>
                      </View>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          ) : null}

          <ProductRail
            title="New arrivals"
            subtitle="Fresh drops, just landed"
            href={{ pathname: '/products', params: { sort: 'createdAt' } } as never}
            products={data?.newArrivals}
          />

          <ProductRail
            title="Trending now"
            subtitle="What everyone is buying this week"
            href={{ pathname: '/products', params: { sort: 'recommended' } } as never}
            products={data?.trending}
          />

          <ProductRail
            title="Best sellers"
            subtitle="Customer favourites, restocked"
            href={{ pathname: '/products', params: { sort: 'best-selling' } } as never}
            products={data?.bestSellers}
          />

          {/* Shop the look */}
          {data?.looks?.[0] ? (
            <View className="px-4">
              <Link href={{ pathname: '/products', params: { sort: 'recommended' } }} asChild>
                <Pressable className="overflow-hidden rounded-3xl active:opacity-90">
                  <SmartImage uri={resolveImage(data.looks[0].imageUrl)} style={{ width: '100%', height: 250 }} />
                  <LinearGradient
                    colors={['rgba(2,8,23,0.05)', 'rgba(2,8,23,0.82)']}
                    style={{ position: 'absolute', inset: 0 }}
                  />
                  <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between gap-3 p-5">
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold uppercase tracking-[3px] text-brand">
                        Shop the look
                      </Text>
                      <Text className="text-h2 mt-1 text-white">{data.looks[0].title}</Text>
                      <Text className="text-label mt-1 text-white/75" numberOfLines={2}>
                        {data.looks[0].description ?? 'Styled head to toe by our in-house team.'}
                      </Text>
                    </View>
                    <View className="bg-brand h-10 w-10 items-center justify-center rounded-full">
                      <ChevronRightIcon size={18} color="#0f172a" />
                    </View>
                  </View>
                </Pressable>
              </Link>
            </View>
          ) : null}

          {/* Reviews */}
          {data?.reviews && data.reviews.length > 0 ? (
            <View className="gap-3">
              <SectionHeader title="Loved by our customers" subtitle="Verified reviews" className="px-4" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                {data.reviews.slice(0, 6).map((review, index) => (
                  <View
                    key={`${review._id}-${index}`}
                    className="border-border bg-card w-72 gap-2 rounded-2xl border p-4">
                    <View className="flex-row items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <Icon
                          key={step}
                          as={StarIcon}
                          size={12}
                          className={step <= Math.round(review.rating) ? 'fill-brand text-brand' : 'text-border fill-border'}
                        />
                      ))}
                    </View>
                    <Text className="text-label text-foreground" numberOfLines={3}>
                      “{review.comment}”
                    </Text>
                    <Text className="text-caption text-muted-foreground">
                      {review.userName ?? 'Verified buyer'}
                      {review.verifiedPurchase ? ' · Verified' : ''}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Trust */}
          <View className="border-border mx-4 flex-row justify-between gap-2 rounded-2xl border p-4">
            <TrustItem icon={TruckIcon} label="Free shipping" hint="Over ₹999" />
            <TrustItem icon={RotateCcwIcon} label="30-day returns" hint="No questions" />
            <TrustItem icon={ShieldCheckIcon} label="Secure pay" hint="UPI & cards" />
          </View>

          <View className="flex-row flex-wrap justify-center gap-x-5 gap-y-2 px-6">
            <FooterLink slug="about" label="About" />
            <FooterLink slug="shipping" label="Shipping" />
            <FooterLink slug="returns" label="Returns" />
            <FooterLink slug="faq" label="FAQ" />
            <FooterLink slug="support" label="Support" />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/** Swipeable, auto-advancing hero — same copy as the web carousel. */
function HeroCarousel({ heroWidth }: { heroWidth: number }) {
  const scrollRef = React.useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % HERO_SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * heroWidth, animated: true });
        return next;
      });
    }, 6500);
    return () => clearInterval(timer);
  }, [heroWidth]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / heroWidth))
        }
        contentContainerStyle={{ paddingHorizontal: 16 }}>
        {HERO_SLIDES.map((slide) => (
          <View key={slide.id} style={{ width: heroWidth }}>
            <View className="overflow-hidden rounded-3xl" style={{ height: 430 }}>
              <SmartImage uri={slide.image} style={{ width: '100%', height: '100%' }} />
              <LinearGradient
                colors={['rgba(2,8,23,0.15)', 'rgba(2,8,23,0.55)', 'rgba(2,8,23,0.92)']}
                locations={[0.2, 0.62, 1]}
                style={{ position: 'absolute', inset: 0 }}
              />
              <View className="absolute inset-x-0 bottom-0 gap-1.5 p-5">
                <View className="border-brand/30 bg-brand/15 self-start rounded-full border px-2.5 py-1">
                  <Text className="text-[9px] font-bold uppercase tracking-[2px] text-brand">
                    {slide.badge}
                  </Text>
                </View>
                <Text className="text-caption mt-1 font-semibold uppercase tracking-[2px] text-white/60">
                  {slide.tag}
                </Text>
                <Text className="text-[26px] font-extrabold uppercase leading-[31px] tracking-[-0.3px] text-white">
                  {slide.title}
                </Text>
                <Text className="text-label text-white/75">{slide.subtitle}</Text>
                <Link
                  href={{ pathname: '/products', params: { category: slide.category } }}
                  asChild>
                  <Button size="sm" className="bg-brand mt-2.5 h-10 self-start px-4">
                    <Text className="text-caption font-bold uppercase tracking-wider text-brand-foreground">
                      {slide.cta}
                    </Text>
                    <ChevronRightIcon size={14} color="#0f172a" />
                  </Button>
                </Link>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="mt-3 flex-row items-center justify-center gap-1.5">
        {HERO_SLIDES.map((slide, slideIndex) => (
          <Pressable
            key={slide.id}
            accessibilityLabel={`Go to slide ${slideIndex + 1}`}
            onPress={() => {
              setIndex(slideIndex);
              scrollRef.current?.scrollTo({ x: slideIndex * heroWidth, animated: true });
            }}
            hitSlop={6}>
            <View
              className={`h-1.5 rounded-full ${
                slideIndex === index ? 'bg-brand w-6' : 'bg-border w-1.5'
              }`}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TrustItem({
  icon: IconComponent,
  label,
  hint,
}: {
  icon: typeof TruckIcon;
  label: string;
  hint: string;
}) {
  return (
    <View className="flex-1 items-center gap-1">
      <Icon as={IconComponent} size={18} className="text-foreground" />
      <Text className="text-caption text-foreground text-center font-semibold">{label}</Text>
      <Text className="text-caption text-muted-foreground text-center">{hint}</Text>
    </View>
  );
}

function FooterLink({ slug, label }: { slug: string; label: string }) {
  return (
    <Link href={{ pathname: '/content/[slug]', params: { slug } }} asChild>
      <Pressable hitSlop={6} className="active:opacity-60">
        <Text className="text-caption text-muted-foreground underline">{label}</Text>
      </Pressable>
    </Link>
  );
}

function HomeSkeleton({ heroWidth }: { heroWidth: number }) {
  return (
    <View className="gap-9">
      <View className="px-4">
        <Skeleton className="rounded-3xl" style={{ width: heroWidth, height: 430 }} />
      </View>
      <View className="gap-3 px-4">
        <Skeleton className="h-4 w-1/3 rounded" />
        <View className="flex-row gap-3">
          <Skeleton className="flex-1 rounded-2xl" style={{ height: 132 }} />
          <Skeleton className="flex-1 rounded-2xl" style={{ height: 132 }} />
        </View>
      </View>
      <ProductGridSkeleton count={2} />
    </View>
  );
}
