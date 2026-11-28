import { Metadata } from 'next';
import { Suspense } from 'react';
import { Header } from '@/components/navigation/Header';
import { Footer } from '@/components/navigation/Footer';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Main Flagship Hero: Hybrid Parallax Columns + Flip Words
import { HeroParallaxFlipSplit } from '@/components/store/home/heroes/HeroParallaxFlipSplit';

// Architecture Sections
import { CategoryRail } from '@/components/store/home/CategoryRail';
import { ProductSection } from '@/components/store/home/ProductSection';
import { TrendingRightNow } from '@/components/store/home/TrendingRightNow';
import { ShopByFit } from '@/components/store/ShopByFit';
import { ShopByStyle } from '@/components/store/ShopByStyle';
import { ShopTheLook } from '@/components/store/ShopTheLook';
import { CustomerReviews } from '@/components/store/CustomerReviews';
import { UgcReels } from '@/components/store/UgcReels';
import { InstagramFeed } from '@/components/store/InstagramFeed';
import { CommunityBand } from '@/components/store/home/CommunityBand';
import { ValueStrip } from '@/components/store/home/ValueStrip';
import { TrustBadges } from '@/components/store/TrustBadges';
import { DemoSwitcherBar } from '@/components/store/home/DemoSwitcherBar';

import { serverGetJSON, type HomeProductPage, type HomeCategoryPage } from '@/lib/api/serverFetch';
import { Skeleton } from '@/components/ui/skeleton';
import type { IProduct } from '@/lib/api/types';

export const metadata: Metadata = {
  title: "Mentoos | Modern Men's Fashion, Oversized Tees & Luxury Apparel",
  description: "Shop premium menswear engineered for drape, comfort, and presence. Heavyweight 240 GSM tees, linen shirts, cargo joggers, and festive kurtas.",
  alternates: { canonical: '/' },
  openGraph: {
    title: "Mentoos | Modern Men's Fashion & Luxury Apparel",
    description: "Shop premium menswear engineered for drape, comfort, and presence. Heavyweight 240 GSM tees, linen shirts, cargo joggers, and festive kurtas.",
    type: 'website',
    url: '/',
  },
};

export const dynamic = 'force-dynamic';

const FALLBACK_NEW_ARRIVALS: IProduct[] = [
  {
    _id: 'prod-home-1',
    name: 'Heavyweight Boxy Oversized Tee',
    slug: 'heavyweight-boxy-oversized-tee',
    description: '240 GSM combed cotton drop-shoulder silhouette for effortless streetwear drape.',
    price: 899,
    compareAtPrice: 1299,
    images: [{ url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'cat-1', name: 'T-Shirts', slug: 't-shirts' },
    status: 'active',
    sku: 'TEE-OVR-01',
    stock: 50,
    ratings: { average: 4.9, count: 128 },
    badge: 'NEW DROP',
  } as any,
  {
    _id: 'prod-home-2',
    name: 'Multi-Pocket Cargo Joggers',
    slug: 'multi-pocket-cargo-joggers',
    description: 'Utility pocketing with tapered ribbed cuffs and ergonomic stretch cotton twill.',
    price: 1299,
    compareAtPrice: 1799,
    images: [{ url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'cat-2', name: 'Joggers', slug: 'joggers' },
    status: 'active',
    sku: 'CRG-JOG-02',
    stock: 35,
    ratings: { average: 4.8, count: 96 },
    badge: 'TRENDING',
  } as any,
  {
    _id: 'prod-home-3',
    name: 'Distressed Wash Denim Jacket',
    slug: 'distressed-wash-denim-jacket',
    description: 'Hand-abraded indigo wash with custom metallic hardware and relaxed chest drop.',
    price: 2199,
    compareAtPrice: 3299,
    images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'cat-3', name: 'Jackets', slug: 'jackets' },
    status: 'active',
    sku: 'DNM-JKT-03',
    stock: 20,
    ratings: { average: 5.0, count: 64 },
    badge: 'LIMITED',
  } as any,
  {
    _id: 'prod-home-4',
    name: 'Acid Wash Drop-Shoulder Hoodie',
    slug: 'acid-wash-drop-shoulder-hoodie',
    description: '380 GSM fleece hoodie with mineral dye treatment and lined thermal hood.',
    price: 1699,
    compareAtPrice: 2299,
    images: [{ url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'cat-4', name: 'Hoodies', slug: 'hoodies' },
    status: 'active',
    sku: 'HOD-ACD-04',
    stock: 45,
    ratings: { average: 4.9, count: 82 },
    badge: 'HOT',
  } as any,
];

const FALLBACK_BEST_SELLERS: IProduct[] = [
  {
    _id: 'prod-best-1',
    name: 'French Linen Relaxed Cuban Shirt',
    slug: 'french-linen-relaxed-cuban-shirt',
    description: '100% Normandy flax linen with camp collar and breezy resort silhouette.',
    price: 1399,
    compareAtPrice: 1999,
    images: [{ url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'cat-5', name: 'Shirts', slug: 'shirts' },
    status: 'active',
    sku: 'SHT-LIN-05',
    stock: 60,
    ratings: { average: 4.9, count: 340 },
    badge: 'BESTSELLER',
  } as any,
  {
    _id: 'prod-best-2',
    name: 'Tailored Pleated Formal Trousers',
    slug: 'tailored-pleated-formal-trousers',
    description: 'Double front pleat with expandable waist adjusters and clean straight taper.',
    price: 1499,
    compareAtPrice: 2199,
    images: [{ url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'cat-6', name: 'Trousers', slug: 'trousers' },
    status: 'active',
    sku: 'TRS-PLT-06',
    stock: 40,
    ratings: { average: 4.8, count: 210 },
    badge: 'BESTSELLER',
  } as any,
  {
    _id: 'prod-best-3',
    name: 'Textured Slub Short Kurta',
    slug: 'textured-slub-short-kurta',
    description: 'Mandarin collar with coconut shell buttons and airy textured cotton weave.',
    price: 1199,
    compareAtPrice: 1599,
    images: [{ url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'cat-7', name: 'Ethnic Wear', slug: 'ethnic-wear' },
    status: 'active',
    sku: 'KRT-SLB-07',
    stock: 55,
    ratings: { average: 4.9, count: 185 },
    badge: 'FESTIVE PICK',
  } as any,
  {
    _id: 'prod-best-4',
    name: 'Structured Waffle Knit Resort Polo',
    slug: 'structured-waffle-knit-resort-polo',
    description: 'Honeycomb knit texture with open collar design and ribbed cuffs.',
    price: 999,
    compareAtPrice: 1499,
    images: [{ url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'cat-8', name: 'T-Shirts', slug: 't-shirts' },
    status: 'active',
    sku: 'POL-WFL-08',
    stock: 75,
    ratings: { average: 4.7, count: 142 },
    badge: 'TOP RATED',
  } as any,
];

async function getHomeData() {
  const [newArrivalsRes, bestSellersRes, topRatedRes, categoriesResponse] =
    await Promise.all([
      serverGetJSON<HomeProductPage>('/products?status=active&limit=10&sort=createdAt&order=desc'),
      serverGetJSON<HomeProductPage>('/products?status=active&limit=10&sort=best-selling&order=desc'),
      serverGetJSON<HomeProductPage>('/products?status=active&limit=10&sort=rating&order=desc'),
      serverGetJSON<HomeCategoryPage>('/categories?status=active'),
    ]);

  const topRated = topRatedRes?.data || [];
  const bestSellers = (bestSellersRes?.data || []).length > 0
    ? bestSellersRes!.data || []
    : topRated;

  return {
    newArrivals: newArrivalsRes?.data || [],
    bestSellers,
    categories: categoriesResponse?.data || [],
  };
}

function HomeLoadingSkeleton() {
  return (
    <div className="space-y-10 py-8">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

async function HomeContent() {
  const { newArrivals, bestSellers, categories } = await getHomeData();

  const displayNewArrivals = newArrivals.length > 0 ? newArrivals : FALLBACK_NEW_ARRIVALS;
  const displayBestSellers = bestSellers.length > 0 ? bestSellers : FALLBACK_BEST_SELLERS;

  return (
    <div className="container-page space-y-12 py-8 sm:space-y-16 sm:py-12">
      {/* 2. SHOP BY CATEGORY */}
      <section id="sec-category" className="scroll-mt-20">
        <div className="mb-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-800">
            Curated Wardrobe
          </p>
          <h2 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
            SHOP BY CATEGORY
          </h2>
        </div>
        <CategoryRail categories={categories} />
      </section>

      {/* 3. NEW ARRIVALS */}
      <section id="sec-new-arrivals" className="scroll-mt-20">
        <ProductSection
          eyebrow="Fresh In This Week"
          title="NEW ARRIVALS"
          subtitle="Just-landed fits, heavyweight 240 GSM tees, and tailored menswear drops."
          href="/products?sort=createdAt&order=desc"
          products={displayNewArrivals}
        />
      </section>

      {/* 4. TRENDING NOW */}
      <section id="sec-trending" className="scroll-mt-20">
        <TrendingRightNow />
      </section>

      {/* 5. BEST SELLERS */}
      <section id="sec-best-sellers" className="scroll-mt-20">
        <ProductSection
          eyebrow="Customer Favourites"
          title="BEST SELLERS"
          subtitle="The garments Indian men keep reordering — calibrated fits, premium cotton, and all-day comfort."
          href="/products?sort=best-selling&order=desc"
          products={displayBestSellers}
          className="rounded-[26px] border border-line bg-sand/40 p-4 sm:p-6"
        />
      </section>

      {/* 6. SHOP BY FIT */}
      <section id="sec-fit" className="scroll-mt-20">
        <ShopByFit />
      </section>

      {/* 7. SHOP BY STYLE */}
      <section id="sec-style" className="scroll-mt-20">
        <ShopByStyle />
      </section>

      {/* 8. SHOP THE LOOK */}
      <section id="sec-shop-the-look" className="scroll-mt-20">
        <ShopTheLook />
      </section>

      {/* 9. CUSTOMER REVIEWS */}
      <section id="sec-reviews" className="scroll-mt-20">
        <CustomerReviews />
      </section>

      {/* 10. UGC / CUSTOMER VIDEOS */}
      <section id="sec-ugc" className="scroll-mt-20">
        <UgcReels />
      </section>

      {/* 11. INSTAGRAM / SOCIAL CONTENT */}
      <section id="sec-social" className="scroll-mt-20 space-y-6">
        <InstagramFeed />
        <CommunityBand />
      </section>

      {/* 12. TRUST SECTION */}
      <section id="sec-trust" className="scroll-mt-20 space-y-6">
        <ValueStrip />
        <TrustBadges />
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper font-sans text-ink">
      <Header>
        <ThemeToggle className="ml-4" />
      </Header>

      <main id="main-content" className="w-full flex-1">
        {/* 1. MAIN HERO BANNER (Top Parallax + Flip Words Masterpiece) */}
        <section id="sec-hero" className="w-full">
          <HeroParallaxFlipSplit />
        </section>

        {/* 2-12. Flagship Storefront Sections */}
        <Suspense fallback={<HomeLoadingSkeleton />}>
          <HomeContent />
        </Suspense>
      </main>

      <Footer />
      {/* Discreet floating switcher bar to toggle between the 5 alternative hero demos */}
      <DemoSwitcherBar currentDemo="home" />
    </div>
  );
}