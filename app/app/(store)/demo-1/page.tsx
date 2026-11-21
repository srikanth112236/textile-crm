import { Metadata } from 'next';
import { HeroParallaxFlipSplit } from '@/components/store/home/heroes/HeroParallaxFlipSplit';
import { FindYourStyle } from '@/components/store/home/FindYourStyle';
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
import { serverGetJSON, type HomeProductPage } from '@/lib/api/serverFetch';
import type { IProduct } from '@/lib/api/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Demo 1: High-Street Minimalist | Mentoos Menswear',
  description: 'High-street fashion experience with asymmetric chamfered cards, interactive style finder, and hybrid parallax hero.',
};

const MOCK_STREET_DROPS: IProduct[] = [
  {
    _id: 'prod-d1-1',
    name: 'Heavyweight Boxy Oversized Tee',
    slug: 'heavyweight-boxy-oversized-tee',
    description: '240 GSM combed cotton drop-shoulder silhouette.',
    price: 899,
    compareAtPrice: 1299,
    images: [{ url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c1', name: 'T-Shirts', slug: 't-shirts' },
    status: 'active',
    sku: 'TEE-01',
    stock: 50,
    ratings: { average: 4.9, count: 128 },
    badge: 'NEW DROP',
  } as any,
  {
    _id: 'prod-d1-2',
    name: 'Multi-Pocket Cargo Joggers',
    slug: 'multi-pocket-cargo-joggers',
    description: 'Utility pocketing with tapered ribbed cuffs.',
    price: 1299,
    compareAtPrice: 1799,
    images: [{ url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c2', name: 'Joggers', slug: 'joggers' },
    status: 'active',
    sku: 'JOG-02',
    stock: 35,
    ratings: { average: 4.8, count: 96 },
    badge: 'TRENDING',
  } as any,
  {
    _id: 'prod-d1-3',
    name: 'Acid Wash Drop-Shoulder Hoodie',
    slug: 'acid-wash-drop-shoulder-hoodie',
    description: '380 GSM fleece hoodie with mineral dye treatment.',
    price: 1699,
    compareAtPrice: 2299,
    images: [{ url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c3', name: 'Hoodies', slug: 'hoodies' },
    status: 'active',
    sku: 'HOD-03',
    stock: 45,
    ratings: { average: 4.9, count: 82 },
    badge: 'HOT',
  } as any,
  {
    _id: 'prod-d1-4',
    name: 'Distressed Wash Denim Jacket',
    slug: 'distressed-wash-denim-jacket',
    description: 'Hand-abraded indigo wash with custom metallic hardware.',
    price: 2199,
    compareAtPrice: 3299,
    images: [{ url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c4', name: 'Jackets', slug: 'jackets' },
    status: 'active',
    sku: 'DNM-04',
    stock: 20,
    ratings: { average: 5.0, count: 64 },
    badge: 'LIMITED',
  } as any,
];

const MOCK_BEST_SELLERS: IProduct[] = [
  {
    _id: 'prod-d1-b1',
    name: 'Relaxed Cuban Linen Shirt',
    slug: 'relaxed-cuban-linen-shirt',
    description: '100% Normandy flax with camp collar.',
    price: 1399,
    compareAtPrice: 1999,
    images: [{ url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c5', name: 'Shirts', slug: 'shirts' },
    status: 'active',
    sku: 'LIN-01',
    stock: 60,
    ratings: { average: 4.9, count: 340 },
    badge: 'BESTSELLER',
  } as any,
  {
    _id: 'prod-d1-b2',
    name: 'Tailored Pleated Trousers',
    slug: 'tailored-pleated-trousers',
    description: 'Double front pleat with waist expanders.',
    price: 1499,
    compareAtPrice: 2199,
    images: [{ url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c6', name: 'Trousers', slug: 'trousers' },
    status: 'active',
    sku: 'TRS-02',
    stock: 40,
    ratings: { average: 4.8, count: 210 },
    badge: 'BESTSELLER',
  } as any,
  {
    _id: 'prod-d1-b3',
    name: 'Textured Slub Short Kurta',
    slug: 'textured-slub-short-kurta',
    description: 'Mandarin collar with coconut shell buttons.',
    price: 1199,
    compareAtPrice: 1599,
    images: [{ url: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c7', name: 'Ethnic Wear', slug: 'ethnic-wear' },
    status: 'active',
    sku: 'KRT-03',
    stock: 55,
    ratings: { average: 4.9, count: 185 },
    badge: 'FESTIVE',
  } as any,
  {
    _id: 'prod-d1-b4',
    name: 'Waffle Knit Resort Polo',
    slug: 'waffle-knit-resort-polo',
    description: 'Open collar with ribbed cuffs.',
    price: 999,
    compareAtPrice: 1499,
    images: [{ url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=80', isDefault: true }],
    category: { _id: 'c8', name: 'T-Shirts', slug: 't-shirts' },
    status: 'active',
    sku: 'POL-04',
    stock: 75,
    ratings: { average: 4.7, count: 142 },
    badge: 'TOP RATED',
  } as any,
];

export default async function Demo1Page() {
  const [newArrivalsRes, bestSellersRes] = await Promise.all([
    serverGetJSON<HomeProductPage>('/products?status=active&limit=8&sort=createdAt&order=desc'),
    serverGetJSON<HomeProductPage>('/products?status=active&limit=8&sort=best-selling&order=desc'),
  ]);

  const streetDrops = newArrivalsRes?.data && newArrivalsRes.data.length > 0 ? newArrivalsRes.data : MOCK_STREET_DROPS;
  const bestSellers = bestSellersRes?.data && bestSellersRes.data.length > 0 ? bestSellersRes.data : MOCK_BEST_SELLERS;

  return (
    <div className="relative w-full pb-20">
      {/* 1. Main Hero Banner: Hybrid Parallax + Flip */}
      <section id="sec-hero" className="w-full">
        <HeroParallaxFlipSplit />
      </section>

      <div className="container-page space-y-12 py-8 sm:space-y-16 sm:py-12">
        {/* 2. Shop by Category (Interactive Chamfered Style Finder) */}
        <section id="sec-category">
          <FindYourStyle />
        </section>

        {/* 3. New Arrivals */}
        <section id="sec-new-arrivals">
          <ProductSection
            eyebrow="Fresh Drop"
            title="NEW STREET ARRIVALS"
            subtitle="Engineered for high-street confidence, boxy silhouettes, and durable daily wear."
            href="/products?sort=createdAt&order=desc"
            products={streetDrops}
          />
        </section>

        {/* 4. Trending Now */}
        <section id="sec-trending">
          <TrendingRightNow />
        </section>

        {/* 5. Best Sellers */}
        <section id="sec-best-sellers">
          <ProductSection
            eyebrow="Customer Favourites"
            title="STREET BEST SELLERS"
            subtitle="Tried and reordered pieces that define the modern Indian street wardrobe."
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
        <section id="sec-trust">
          <ValueStrip />
        </section>
      </div>

      <DemoSwitcherBar currentDemo="demo-1" />
    </div>
  );
}
