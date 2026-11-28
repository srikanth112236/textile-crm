import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsListingClient } from '@/components/products/ProductsListingClient';
import { serverGetJSON, type Paged } from '@/lib/api/serverFetch';
import type { IProduct } from '@/lib/api/types';
import { Marquee, Reveal } from '@/components/store/StoreMotion';
import { Ruler, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: "Shop Men's Fashion & Apparel | Mentoos",
  description:
    'Browse oversized tees, shirts, trousers, joggers and ethnic wear at Mentoos. Filter by size, colour, price, fit and fabric.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: "Shop Men's Fashion & Apparel | Mentoos",
    description:
      'Browse oversized tees, shirts, trousers, joggers and ethnic wear at Mentoos. Filter by size, colour, price, fit and fabric.',
    type: 'website',
    url: '/products',
  },
};

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    color?: string;
    size?: string;
    fit?: string;
    fabric?: string;
    pattern?: string;
    occasion?: string;
    minRating?: string;
    minDiscount?: string;
    inStock?: string;
    badge?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }>;
}

async function getProducts(searchParams: Awaited<ProductsPageProps['searchParams']>) {
  try {
    const filters = {
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: 20,
      category: searchParams.category,
      status: searchParams.status || 'active', // Only show active products to customers
      minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
      search: searchParams.search,
      color: searchParams.color,
      size: searchParams.size,
      fit: searchParams.fit,
      fabric: searchParams.fabric,
      pattern: searchParams.pattern,
      occasion: searchParams.occasion,
      minRating: searchParams.minRating ? parseFloat(searchParams.minRating) : undefined,
      minDiscount: searchParams.minDiscount ? parseFloat(searchParams.minDiscount) : undefined,
      inStock: searchParams.inStock === 'true' ? true : undefined,
      badge: searchParams.badge,
      sort: searchParams.sort || 'createdAt',
      order: searchParams.order || 'desc',
    };

    // Ride on native fetch instead of axios: axios resolves redirects through
    // follow-redirects, which calls the legacy url.parse() and emits a DEP0169
    // warning on every server render of this route.
    const qs = new URLSearchParams();
    qs.set('page', String(filters.page));
    qs.set('limit', String(filters.limit));
    qs.set('status', filters.status);
    qs.set('sort', filters.sort);
    qs.set('order', filters.order);
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;
      if (['page', 'limit', 'status', 'sort', 'order', 'inStock'].includes(key)) continue;
      qs.set(key, String(value));
    }
    if (filters.inStock === true) qs.set('inStock', 'true');

    const response = await serverGetJSON<Paged<IProduct>>(`/products?${qs.toString()}`);
    if (!response) {
      return {
        success: true,
        data: [] as IProduct[],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      };
    }
    return {
      success: response.success ?? true,
      data: response.data ?? [],
      pagination: {
        page: response.pagination?.page ?? 1,
        limit: response.pagination?.limit ?? 20,
        total: response.pagination?.total ?? 0,
        pages: response.pagination?.pages ?? 0,
      },
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return {
      success: true,
      data: [] as IProduct[],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    };
  }
}

function ProductsListingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="hidden h-[440px] animate-pulse rounded-2xl bg-sand lg:col-span-1 lg:block" />
      <div className="grid grid-cols-2 gap-4 lg:col-span-3 lg:grid-cols-3 lg:gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-sand" />
        ))}
      </div>
    </div>
  );
}

async function ProductsListingData({
  searchParams,
}: {
  searchParams: Awaited<ProductsPageProps['searchParams']>;
}) {
  const productsData = await getProducts(searchParams);
  return (
    <ProductsListingClient
      initialProducts={productsData.data}
      initialPagination={productsData.pagination}
      searchParams={searchParams}
    />
  );
}

const MARQUEE_ITEMS = [
  '240 GSM heavyweight cotton',
  'Pure French flax linen',
  'Free shipping over ₹999',
  '7-day easy exchange',
  'COD available',
  'Made for Indian fits',
  'Cut & sewn in India',
];

export default async function ProductsPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;
  const categoryLabel = searchParams.category
    ? searchParams.category.replace(/-/g, ' ')
    : null;

  return (
    <div className="bg-paper">
      {/* Editorial listing hero — part of the shell so first paint never waits on the API. */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full opacity-70"
          style={{ background: 'radial-gradient(circle, rgba(183,121,31,0.18), transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 h-[280px] w-[280px] rounded-full opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(31,122,77,0.10), transparent 70%)' }}
        />

        <div className="container-page relative pb-7 pt-9 sm:pt-11">
          <Reveal>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.32em] text-ink-subtle">
              <span className="h-px w-8 bg-ink/25" />
              The collection{categoryLabel ? ` · ${categoryLabel}` : ' · Vol. 04'}
            </div>
          </Reveal>

          <div className="mt-3.5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Reveal delay={70}>
              <h1 className="max-w-xl text-[25px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[32px]">
                Everyday essentials,
                <span className="text-brand"> cut for real bodies.</span>
              </h1>
            </Reveal>
            <Reveal delay={150} className="max-w-xs sm:text-right">
              <p className="text-[12px] leading-relaxed text-ink-muted">
                Filter by fit, fabric and occasion. Every piece is pre-shrunk, garment-washed and built to outlast the season.
              </p>
            </Reveal>
          </div>

        </div>

        <Marquee
          items={MARQUEE_ITEMS}
          className="border-t border-line bg-sand/70 py-2 text-ink-muted"
          duration={34}
        />
      </section>

      <div className="container-page py-7">
        <Suspense fallback={<ProductsListingSkeleton />}>
          <ProductsListingData searchParams={searchParams} />
        </Suspense>

        {/* Service band -------------------------------------------------- */}
        <section className="mt-12 border-t border-line pt-8">
          <Reveal>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-ink-subtle">The Mentoos promise</p>
          </Reveal>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Truck, title: 'Free shipping over ₹999', body: 'Dispatched in 24–48h, delivered in 3–5 working days.' },
              { icon: RotateCcw, title: '7-day easy exchange', body: 'Size wrong? Swap it at your doorstep, no questions.' },
              { icon: ShieldCheck, title: 'Secure payments', body: 'UPI, cards and COD. Card data never touches our servers.' },
              { icon: Ruler, title: 'Fit-first sizing', body: 'Cut for Indian proportions, with a size guide on every piece.' },
            ].map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 70}>
                <div className="group h-full rounded-2xl border border-line bg-white p-4 transition-all duration-500 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand text-[rgb(var(--color-brand))] transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-3 text-[13px] font-bold text-ink">{title}</h3>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* Closing editorial band ------------------------------------------- */}
      <section className="relative overflow-hidden bg-ink py-10 text-paper">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <Reveal>
              <h2 className="max-w-md text-[22px] font-extrabold leading-[1.12] tracking-tight sm:text-[28px]">
                Fewer, better pieces.<br />
                <span className="text-brand-soft">Built to be worn out.</span>
              </h2>
            </Reveal>
            <Reveal delay={90}>
              <p className="max-w-xs text-[12px] leading-relaxed text-paper/70">
                Heavyweight cotton, pure flax and relaxed tailoring — restocked in small runs so the fit stays consistent.
              </p>
            </Reveal>
          </div>
        </div>
        <Marquee
          items={['New arrivals weekly', 'Small-batch production', 'Garment washed', 'No middlemen markups', 'Made in India']}
          className="mt-7 border-t border-paper/15 py-2 text-paper/60"
          duration={30}
          reverse
        />
      </section>
    </div>
  );
}
