import { Metadata } from 'next';
import { HeroInfiniteDiagonalParallax } from '@/components/store/home/heroes/HeroInfiniteDiagonalParallax';
import { CategoryRail } from '@/components/store/home/CategoryRail';
import { TrendingRightNow } from '@/components/store/home/TrendingRightNow';
import { ProductSection } from '@/components/store/home/ProductSection';
import { BentoGridSection } from '@/components/store/BentoGridSection';
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
  title: 'Demo 4: Diagonal Skew Parallax | Mentoos Menswear',
  description: 'Kinetic high-energy street luxury with dynamic -4 degree skewed multi-speed parallax and bento lookbook.',
};

const MOCK_KINETIC_DROPS: IProduct[] = [
  {
    _id: 'prod-d4-1',
    name: 'Multi-Pocket Cargo Joggers',
    slug: 'multi-pocket-cargo-joggers',
    description: 'Utility pocketing with tapered ribbed cuffs and ergonomic stretch cotton twill.',
    price: 1299,
    compareAtPrice: 1799,
    images: [{ url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c1', name: 'Joggers', slug: 'joggers' },
    status: 'active',
    sku: 'JOG-01',
    stock: 35,
    ratings: { average: 4.8, count: 96 },
    badge: 'TRENDING',
  } as any,
  {
    _id: 'prod-d4-2',
    name: 'Distressed Wash Denim Jacket',
    slug: 'distressed-wash-denim-jacket',
    description: 'Hand-abraded indigo wash with custom metallic hardware and relaxed chest drop.',
    price: 2199,
    compareAtPrice: 3299,
    images: [{ url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c2', name: 'Jackets', slug: 'jackets' },
    status: 'active',
    sku: 'DNM-02',
    stock: 20,
    ratings: { average: 5.0, count: 64 },
    badge: 'LIMITED',
  } as any,
  {
    _id: 'prod-d4-3',
    name: 'Heavyweight Boxy Oversized Tee',
    slug: 'heavyweight-boxy-oversized-tee',
    description: '240 GSM combed cotton drop-shoulder silhouette for effortless streetwear drape.',
    price: 899,
    compareAtPrice: 1299,
    images: [{ url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c3', name: 'T-Shirts', slug: 't-shirts' },
    status: 'active',
    sku: 'TEE-03',
    stock: 50,
    ratings: { average: 4.9, count: 128 },
    badge: 'NEW DROP',
  } as any,
  {
    _id: 'prod-d4-4',
    name: 'Acid Wash Drop-Shoulder Hoodie',
    slug: 'acid-wash-drop-shoulder-hoodie',
    description: '380 GSM fleece hoodie with mineral dye treatment and lined thermal hood.',
    price: 1699,
    compareAtPrice: 2299,
    images: [{ url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c4', name: 'Hoodies', slug: 'hoodies' },
    status: 'active',
    sku: 'HOD-04',
    stock: 45,
    ratings: { average: 4.9, count: 82 },
    badge: 'HOT',
  } as any,
];

export default async function Demo4Page() {
  const [newArrivalsRes, bestSellersRes, categoriesRes] = await Promise.all([
    serverGetJSON<HomeProductPage>('/products?status=active&limit=8&sort=createdAt&order=desc'),
    serverGetJSON<HomeProductPage>('/products?status=active&limit=8&sort=best-selling&order=desc'),
    serverGetJSON<HomeCategoryPage>('/categories?status=active'),
  ]);

  const streetDrops = newArrivalsRes?.data && newArrivalsRes.data.length > 0 ? newArrivalsRes.data : MOCK_KINETIC_DROPS;
  const bestSellers = bestSellersRes?.data && bestSellersRes.data.length > 0 ? bestSellersRes.data : MOCK_KINETIC_DROPS;
  const categories = categoriesRes?.data || [];

  return (
    <div className="relative w-full pb-20">
      {/* 1. Main Hero Banner: Diagonal Skew Parallax */}
      <section id="sec-hero" className="w-full">
        <HeroInfiniteDiagonalParallax />
      </section>

      <div className="container-page space-y-12 py-8 sm:space-y-16 sm:py-12">
        {/* 2. Shop by Category */}
        <section id="sec-category">
          <CategoryRail categories={categories} />
        </section>

        {/* 3. New Street Arrivals */}
        <section id="sec-new-arrivals">
          <ProductSection
            eyebrow="Kinetic Energy"
            title="STREET ESSENTIALS"
            subtitle="Drop-shoulder proportions, rugged utility cargo hardware, and heavyweight French Terry."
            href="/products?sort=createdAt&order=desc"
            products={streetDrops}
          />
        </section>

        {/* 4. Trending Now */}
        <section id="sec-trending">
          <TrendingRightNow />
        </section>

        {/* 5. Best Sellers (Street Bento Grid) */}
        <section id="sec-best-sellers" className="space-y-6">
          <BentoGridSection />
          <ProductSection
            eyebrow="Top Rated"
            title="KINETIC BEST SELLERS"
            subtitle="Heavy rotation garments engineered for skate and streetwear movement."
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

        {/* 10. Motion UGC Reels */}
        <section id="sec-ugc">
          <UgcReels />
        </section>

        {/* 11. Instagram Live Feed */}
        <section id="sec-social">
          <InstagramFeed />
        </section>

        {/* 13. Trust Value Strip */}
        <section id="sec-trust">
          <ValueStrip />
        </section>
      </div>

      <DemoSwitcherBar currentDemo="demo-4" />
    </div>
  );
}
