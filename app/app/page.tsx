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
import { serverGetJSON, type HomeProductPage, type HomeCategoryPage } from '@/lib/api/serverFetch';
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

// The homepage is rendered per request: the backend may be waking up from a
// cold spin (Render free tier holds requests ~50s) or offline when this app
// deploys, and static prerender aborts the whole build. Streaming + a short
// per-call deadline keeps TTFB sane and the page resilient.
export const dynamic = 'force-dynamic';

async function getHomeData() {
  // Server-side fetches ride on native fetch (WHATWG URL internals) rather
  // than axios/follow-redirects, so no DEP0169 url.parse() warnings fire
  // during SSR. Each endpoint fails independently to [] so one slow or
  // broken endpoint never blanks the homepage, and AbortSignal caps every
  // call at 12s so a waking backend can never stall the render.
  const [newArrivalsRes, trendingRes, bestSellersRes, topRatedRes, categoriesResponse] =
    await Promise.all([
      serverGetJSON<HomeProductPage>('/products?status=active&limit=10&sort=createdAt&order=desc'),
      serverGetJSON<HomeProductPage>('/products/recommendations/trending?limit=10'),
      serverGetJSON<HomeProductPage>('/products?status=active&limit=10&sort=best-selling&order=desc'),
      serverGetJSON<HomeProductPage>('/products?status=active&limit=10&sort=rating&order=desc'),
      serverGetJSON<HomeCategoryPage>('/categories?status=active'),
    ]);

  // Trending needs recorded views/purchases — brand-new catalogs return [].
  // Fall back to top-rated so the section never vanishes.
  const topRated = topRatedRes?.data || [];
  const trending = (trendingRes?.data || []).length > 0 ? trendingRes!.data : topRated;

  return {
    newArrivals: newArrivalsRes?.data || [],
    trending: trending || [],
    bestSellers: bestSellersRes?.data || [],
    categories: categoriesResponse?.data || [],
  };
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
        <div className="container mx-auto px-4 py-6 space-y-10 sm:px-6 sm:space-y-14 lg:px-10">
          <Suspense fallback={<HomeLoadingSkeleton />}>
            {/* 1. Main Hero Banner — contained rounded card, never full-bleed */}

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
