import { HeroParallaxFlipSplit } from '@/components/store/home/heroes/HeroParallaxFlipSplit';
import { HeroParallaxColumns } from '@/components/store/home/heroes/HeroParallaxColumns';
import { HeroFlipWordsLuxury } from '@/components/store/home/heroes/HeroFlipWordsLuxury';
import { HeroInfiniteDiagonalParallax } from '@/components/store/home/heroes/HeroInfiniteDiagonalParallax';
import { HeroDualColumnFlipCurator } from '@/components/store/home/heroes/HeroDualColumnFlipCurator';

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

import type { IProduct, ICategory } from '@/lib/api/types';

const MOCK_NEW_ARRIVALS: IProduct[] = [
  {
    _id: 'prod-demo-1',
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
    _id: 'prod-demo-2',
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
    _id: 'prod-demo-3',
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
    _id: 'prod-demo-4',
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

const MOCK_BEST_SELLERS: IProduct[] = [
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

interface EditorialLandingTemplateProps {
  heroVariant: 1 | 2 | 3 | 4 | 5;
  demoTitle?: string;
  demoSubtitle?: string;
  newArrivals?: IProduct[];
  bestSellers?: IProduct[];
  categories?: ICategory[];
}

export function EditorialLandingTemplate({
  heroVariant,
  newArrivals,
  bestSellers,
  categories = [],
}: EditorialLandingTemplateProps) {
  const displayNewArrivals = newArrivals && newArrivals.length > 0 ? newArrivals : MOCK_NEW_ARRIVALS;
  const displayBestSellers = bestSellers && bestSellers.length > 0 ? bestSellers : MOCK_BEST_SELLERS;

  const renderHero = () => {
    switch (heroVariant) {
      case 1:
        return <HeroParallaxFlipSplit />;
      case 2:
        return <HeroParallaxColumns />;
      case 3:
        return <HeroFlipWordsLuxury />;
      case 4:
        return <HeroInfiniteDiagonalParallax />;
      case 5:
        return <HeroDualColumnFlipCurator />;
      default:
        return <HeroParallaxFlipSplit />;
    }
  };

  return (
    <div className="relative w-full pb-20">
      {/* 1. HERO BANNER */}
      <section id="sec-hero" className="w-full scroll-mt-20">
        {renderHero()}
      </section>

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

      {/* Floating Demo Switcher Pill */}
      <DemoSwitcherBar currentDemo={`demo-${heroVariant}`} />
    </div>
  );
}
