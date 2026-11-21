import { Metadata } from 'next';
import { HeroParallaxColumns } from '@/components/store/home/heroes/HeroParallaxColumns';
import { EditorialRunwayHero } from '@/components/store/home/EditorialRunwayHero';
import { CategoryRail } from '@/components/store/home/CategoryRail';
import { HeritageCraftsmanship } from '@/components/store/home/HeritageCraftsmanship';
import { ProductSection } from '@/components/store/home/ProductSection';
import { TrendingRightNow } from '@/components/store/home/TrendingRightNow';
import { ShopByFit } from '@/components/store/ShopByFit';
import { ShopByStyle } from '@/components/store/ShopByStyle';
import { ShopTheLook } from '@/components/store/ShopTheLook';
import { CustomerReviews } from '@/components/store/CustomerReviews';
import { UgcReels } from '@/components/store/UgcReels';
import { InstagramFeed } from '@/components/store/InstagramFeed';
import { ValueStrip } from '@/components/store/home/ValueStrip';
import { DemoSwitcherBar } from '@/components/store/home/DemoSwitcherBar';
import { serverGetJSON, type HomeProductPage, type HomeCategoryPage } from '@/lib/api/serverFetch';
import type { IProduct } from '@/lib/api/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Demo 2: Editorial Runway & Craftsmanship | Mentoos Menswear',
  description: 'PashPine-inspired editorial runway lookbook with 3-column parallax columns and heritage craftsmanship story.',
};

const MOCK_BEST_SELLERS: IProduct[] = [
  {
    _id: 'prod-d2-1',
    name: 'French Linen Relaxed Cuban Shirt',
    slug: 'french-linen-relaxed-cuban-shirt',
    description: '100% Normandy flax linen with camp collar.',
    price: 1399,
    compareAtPrice: 1999,
    images: [{ url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c1', name: 'Shirts', slug: 'shirts' },
    status: 'active',
    sku: 'LIN-01',
    stock: 60,
    ratings: { average: 4.9, count: 340 },
    badge: 'BESTSELLER',
  } as any,
  {
    _id: 'prod-d2-2',
    name: 'Tailored Pleated Formal Trousers',
    slug: 'tailored-pleated-formal-trousers',
    description: 'Double front pleat with expandable waist adjusters.',
    price: 1499,
    compareAtPrice: 2199,
    images: [{ url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c2', name: 'Trousers', slug: 'trousers' },
    status: 'active',
    sku: 'TRS-02',
    stock: 40,
    ratings: { average: 4.8, count: 210 },
    badge: 'BESTSELLER',
  } as any,
  {
    _id: 'prod-d2-3',
    name: 'Textured Slub Short Kurta',
    slug: 'textured-slub-short-kurta',
    description: 'Mandarin collar with coconut shell buttons.',
    price: 1199,
    compareAtPrice: 1599,
    images: [{ url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c3', name: 'Ethnic Wear', slug: 'ethnic-wear' },
    status: 'active',
    sku: 'KRT-03',
    stock: 55,
    ratings: { average: 4.9, count: 185 },
    badge: 'FESTIVE PICK',
  } as any,
  {
    _id: 'prod-d2-4',
    name: 'Structured Waffle Knit Resort Polo',
    slug: 'structured-waffle-knit-resort-polo',
    description: 'Honeycomb knit texture with open collar design.',
    price: 999,
    compareAtPrice: 1499,
    images: [{ url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c4', name: 'T-Shirts', slug: 't-shirts' },
    status: 'active',
    sku: 'POL-04',
    stock: 75,
    ratings: { average: 4.7, count: 142 },
    badge: 'TOP RATED',
  } as any,
];

export default async function Demo2Page() {
  const [newArrivalsRes, bestSellersRes, categoriesRes] = await Promise.all([
    serverGetJSON<HomeProductPage>('/products?status=active&limit=8&sort=createdAt&order=desc'),
    serverGetJSON<HomeProductPage>('/products?status=active&limit=8&sort=best-selling&order=desc'),
    serverGetJSON<HomeCategoryPage>('/categories?status=active'),
  ]);

  const newArrivals = newArrivalsRes?.data && newArrivalsRes.data.length > 0 ? newArrivalsRes.data : MOCK_BEST_SELLERS;
  const bestSellers = bestSellersRes?.data && bestSellersRes.data.length > 0 ? bestSellersRes.data : MOCK_BEST_SELLERS;
  const categories = categoriesRes?.data || [];

  return (
    <div className="relative w-full pb-20">
      {/* 1. Main Hero Banner: 3-Col Parallax Columns */}
      <section id="sec-hero" className="w-full">
        <HeroParallaxColumns />
      </section>

      <div className="container-page space-y-12 py-8 sm:space-y-16 sm:py-12">
        {/* 2. Shop by Category (Category Rail) */}
        <section id="sec-category">
          <CategoryRail categories={categories} />
        </section>

        {/* 3. New Arrivals (PashPine Runway Drop Header) */}
        <section id="sec-new-arrivals" className="space-y-6">
          <EditorialRunwayHero />
          <ProductSection
            eyebrow="Runway Selections"
            title="NEW RUNWAY ARRIVALS"
            subtitle="The latest models and silhouettes fresh off the seasonal editorial drop."
            href="/products?sort=createdAt&order=desc"
            products={newArrivals}
          />
        </section>

        {/* 4. Trending Now (Heritage Craftsmanship Story) */}
        <section id="sec-trending">
          <HeritageCraftsmanship />
        </section>

        {/* 5. Best Sellers */}
        <section id="sec-best-sellers">
          <ProductSection
            eyebrow="Signature Essentials"
            title="CUSTOMER BEST SELLERS"
            subtitle="Garments that stand the test of time — curated fabrics, durable stitches, and versatile draping."
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

        {/* 11. Instagram Social Lookbook */}
        <section id="sec-social">
          <InstagramFeed />
        </section>

        {/* 13. Trust Section */}
        <section id="sec-trust">
          <ValueStrip />
        </section>
      </div>

      <DemoSwitcherBar currentDemo="demo-2" />
    </div>
  );
}
