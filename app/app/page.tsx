import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { MentoosHero } from '@/components/store/MentoosHero';
import { CategoryGrid } from '@/components/store/CategoryGrid';
import { DiscountsOffersSection } from '@/components/store/DiscountsOffersSection';
import { ShopByFit } from '@/components/store/ShopByFit';
import { ShopByStyle } from '@/components/store/ShopByStyle';
import { ProductSlider } from '@/components/store/ProductSlider';
import { ShopTheLook } from '@/components/store/ShopTheLook';
import { CustomerReviews } from '@/components/store/CustomerReviews';
import { UgcReels } from '@/components/store/UgcReels';
import { InstagramFeed } from '@/components/store/InstagramFeed';
import { TrustBadges } from '@/components/store/TrustBadges';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Mentoos | Modern Men\'s Fashion, Oversized Tees & Ethnic Wear',
  description: 'Shop premium men\'s apparel at Mentoos. Explore oversized t-shirts, casual shirts, formal trousers, cargo joggers, activewear, and designer kurtas.',
  openGraph: {
    title: 'Mentoos | Modern Men\'s Fashion & Apparel',
    description: 'Shop premium men\'s apparel at Mentoos. Explore oversized t-shirts, casual shirts, formal trousers, cargo joggers, activewear, and designer kurtas.',
    type: 'website',
  },
};

async function getHomeData() {
  // Each fetch fails independently to [] so one slow/broken endpoint never
  // blanks the whole homepage. Single parallel batch keeps TTFB to one hop.
  const safe = <T,>(p: Promise<T>, fallback: T): Promise<T> => p.catch(() => fallback);
  try {
    const [newArrivalsRes, trendingRes, bestSellersRes, topRatedRes, categoriesResponse] = await Promise.all([
      safe(productsApi.getProducts({ status: 'active', limit: 10, sort: 'createdAt', order: 'desc' }), null),
      safe(productsApi.getTrendingProducts(10), null),
      safe(productsApi.getProducts({ status: 'active', limit: 10, sort: 'best-selling', order: 'desc' }), null),
      safe(productsApi.getProducts({ status: 'active', limit: 10, sort: 'rating', order: 'desc' }), null),
      safe(categoriesApi.getCategories('active'), null),
    ]);

    // Trending needs recorded views/purchases — brand-new catalogs return [].
    // Fall back to top-rated so the section never vanishes.
    const topRated = topRatedRes?.data || [];
    const trending = (trendingRes?.data || []).length > 0 ? trendingRes!.data : topRated;

    return {
      newArrivals: newArrivalsRes?.data || [],
      trending,
      bestSellers: bestSellersRes?.data || [],
      categories: categoriesResponse?.data || [],
    };
  } catch (error) {
    console.error('Failed to fetch home data:', error);
    return {
      newArrivals: [],
      trending: [],
      bestSellers: [],
      categories: [],
    };
  }
}

function HomeLoadingSkeleton() {
  return (
    <div className="space-y-12">
      <Skeleton className="h-[480px] w-full rounded-3xl" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-32 rounded-2xl shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-96">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-full w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const { newArrivals, trending, bestSellers, categories } = await getHomeData();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* 1. Header with Compact Navbar, Hover Mega Menu & Header Smart Search */}
      <Header />

      {/* Main Storefront Content — spec §4 order, one section each */}
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-6 space-y-10 sm:space-y-14">
          <Suspense fallback={<HomeLoadingSkeleton />}>
            {/* 1. Main Hero Banner */}
            <MentoosHero />

            {/* 2. Shop by Category */}
            <CategoryGrid categories={categories} />

            {/* 3. New Arrivals */}
            <ProductSlider
              products={newArrivals}
              title="NEW ARRIVALS"
              subtitle="Fresh drops, just landed in the latest fits and fabrics."
            />

            {/* 4. Trending Now */}
            <ProductSlider
              products={trending}
              title="TRENDING NOW"
              subtitle="What everyone is shopping this week."
            />

            {/* 5. Best Sellers */}
            <ProductSlider
              products={bestSellers}
              title="BEST SELLERS"
              subtitle="Customer favorites with instant discount savings."
            />

            {/* 6. Shop by Fit */}
            <ShopByFit />

            {/* 7. Shop by Style */}
            <ShopByStyle />

            {/* 8. Shop the Look */}
            <ShopTheLook />

            {/* 9. Customer Reviews */}
            <CustomerReviews />

            {/* 10. UGC / Customer Videos */}
            <UgcReels />

            {/* 28. Smart Cart Recommendations (already in CartContext) */}

            {/* 33. Personalized Recommendations */}
            <section className="py-6">
              <h2 className="text-xl font-extrabold tracking-tight mb-4">Recommended For You</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bestSellers.slice(0, 4).map((p) => (
                  <Link key={p._id} href={`/products/${p._id}`} className="group block rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all">
                    <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-950">
                      <Image
                        src={typeof p.images?.[0] === 'string' ? p.images[0] : (p.images?.[0]?.url || '/placeholder-product.jpg')}
                        alt={p.name}
                        fill
                        loading="lazy"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold truncate">{p.name}</h4>
                      <p className="text-xs font-semibold text-amber-600">{formatPrice(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* 11. Instagram / Social Content */}
            <InstagramFeed />

            {/* 12. Offers */}
            <DiscountsOffersSection />

            {/* 13. Trust Section */}
            <TrustBadges />
          </Suspense>
        </div>
      </main>

      {/* 14. Footer */}
      <Footer />
    </div>
  );
}
