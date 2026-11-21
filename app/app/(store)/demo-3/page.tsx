import { Metadata } from 'next';
import { HeroFlipWordsLuxury } from '@/components/store/home/heroes/HeroFlipWordsLuxury';
import { CategoryRail } from '@/components/store/home/CategoryRail';
import { ElevateEverydayStyle } from '@/components/store/home/ElevateEverydayStyle';
import { ProductSection } from '@/components/store/home/ProductSection';
import { TrendingRightNow } from '@/components/store/home/TrendingRightNow';
import { ShopByFit } from '@/components/store/ShopByFit';
import { ShopByStyle } from '@/components/store/ShopByStyle';
import { ShopTheLook } from '@/components/store/ShopTheLook';
import { CustomerReviews } from '@/components/store/CustomerReviews';
import { UgcReels } from '@/components/store/UgcReels';
import { InstagramFeed } from '@/components/store/InstagramFeed';
import { ValueStrip } from '@/components/store/home/ValueStrip';
import { TrustBadges } from '@/components/store/TrustBadges';
import { DemoSwitcherBar } from '@/components/store/home/DemoSwitcherBar';
import { serverGetJSON, type HomeProductPage, type HomeCategoryPage } from '@/lib/api/serverFetch';
import type { IProduct } from '@/lib/api/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Demo 3: Warm Dark Luxury | Mentoos Menswear',
  description: 'Nocturne quiet luxury aesthetic with serif animated flip words, warm dark containers, and tailored proportions.',
};

const MOCK_LUXURY_DROPS: IProduct[] = [
  {
    _id: 'prod-d3-1',
    name: 'French Linen Relaxed Cuban Shirt',
    slug: 'french-linen-relaxed-cuban-shirt',
    description: '100% Normandy flax linen with camp collar and breezy resort silhouette.',
    price: 1399,
    compareAtPrice: 1999,
    images: [{ url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c1', name: 'Shirts', slug: 'shirts' },
    status: 'active',
    sku: 'LIN-01',
    stock: 60,
    ratings: { average: 4.9, count: 340 },
    badge: 'LUXURY LINEN',
  } as any,
  {
    _id: 'prod-d3-2',
    name: 'Tailored Pleated Formal Trousers',
    slug: 'tailored-pleated-formal-trousers',
    description: 'Double front pleat with expandable waist adjusters and clean straight taper.',
    price: 1499,
    compareAtPrice: 2199,
    images: [{ url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c2', name: 'Trousers', slug: 'trousers' },
    status: 'active',
    sku: 'TRS-02',
    stock: 40,
    ratings: { average: 4.8, count: 210 },
    badge: 'TAILORED',
  } as any,
  {
    _id: 'prod-d3-3',
    name: 'Heavyweight Boxy Oversized Tee',
    slug: 'heavyweight-boxy-oversized-tee',
    description: '240 GSM combed cotton drop-shoulder silhouette for effortless drape.',
    price: 899,
    compareAtPrice: 1299,
    images: [{ url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c3', name: 'T-Shirts', slug: 't-shirts' },
    status: 'active',
    sku: 'TEE-03',
    stock: 50,
    ratings: { average: 4.9, count: 128 },
    badge: '240 GSM',
  } as any,
  {
    _id: 'prod-d3-4',
    name: 'Structured Waffle Knit Resort Polo',
    slug: 'structured-waffle-knit-resort-polo',
    description: 'Honeycomb knit texture with open collar design and ribbed cuffs.',
    price: 999,
    compareAtPrice: 1499,
    images: [{ url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c4', name: 'T-Shirts', slug: 't-shirts' },
    status: 'active',
    sku: 'POL-04',
    stock: 75,
    ratings: { average: 4.7, count: 142 },
    badge: 'TEXTURED',
  } as any,
];

export default async function Demo3Page() {
  const [newArrivalsRes, bestSellersRes, categoriesRes] = await Promise.all([
    serverGetJSON<HomeProductPage>('/products?status=active&limit=8&sort=createdAt&order=desc'),
    serverGetJSON<HomeProductPage>('/products?status=active&limit=8&sort=best-selling&order=desc'),
    serverGetJSON<HomeCategoryPage>('/categories?status=active'),
  ]);

  const newArrivals = newArrivalsRes?.data && newArrivalsRes.data.length > 0 ? newArrivalsRes.data : MOCK_LUXURY_DROPS;
  const bestSellers = bestSellersRes?.data && bestSellersRes.data.length > 0 ? bestSellersRes.data : MOCK_LUXURY_DROPS;
  const categories = categoriesRes?.data || [];

  return (
    <div className="relative w-full pb-20">
      {/* 1. Main Hero Banner: Flip Words Luxury */}
      <section id="sec-hero" className="w-full">
        <HeroFlipWordsLuxury />
      </section>

      <div className="container-page space-y-12 py-8 sm:space-y-16 sm:py-12">
        {/* 2. Shop by Category */}
        <section id="sec-category">
          <CategoryRail categories={categories} />
        </section>

        {/* 3. New Arrivals (The Refined Edit) */}
        <section id="sec-new-arrivals">
          <ProductSection
            eyebrow="Quiet Luxury"
            title="THE REFINED ARRIVALS"
            subtitle="Understated luxury designed for modern men who value silhouette, premium cotton, and impeccable drape."
            href="/products?sort=createdAt&order=desc"
            products={newArrivals}
          />
        </section>

        {/* 4. Trending Now (Elevate Everyday Style Warm Luxury Container) */}
        <section id="sec-trending">
          <ElevateEverydayStyle />
        </section>

        {/* 5. Best Sellers */}
        <section id="sec-best-sellers">
          <ProductSection
            eyebrow="Tried & Restocked"
            title="LUXURY BEST SELLERS"
            subtitle="The garments Indian men keep reordering — calibrated fits, premium cotton, and all-day comfort."
            href="/products?sort=best-selling&order=desc"
            products={bestSellers}
            className="rounded-[26px] border border-line bg-sand/40 p-4 sm:p-6"
          />
        </section>

        {/* 6. Shop by Fit */}
        <section id="sec-fit">
          <ShopByFit />
        </section>

        {/* 7. Shop by Style */}
        <section id="sec-style">
          <ShopByStyle />
        </section>

        {/* 8. Shop The Look */}
        <section id="sec-shop-the-look">
          <ShopTheLook />
        </section>

        {/* 9. Customer Reviews */}
        <section id="sec-reviews">
          <CustomerReviews />
        </section>

        {/* 10. UGC Customer Videos */}
        <section id="sec-ugc">
          <UgcReels />
        </section>

        {/* 11. Instagram / Social Content */}
        <section id="sec-social">
          <InstagramFeed />
        </section>

        {/* 13. Trust Section */}
        <section id="sec-trust" className="space-y-6">
          <ValueStrip />
          <TrustBadges />
        </section>
      </div>

      <DemoSwitcherBar currentDemo="demo-3" />
    </div>
  );
}
