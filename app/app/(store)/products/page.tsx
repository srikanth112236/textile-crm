import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsListingClient } from '@/components/products/ProductsListingClient';
import { serverGetJSON, type Paged } from '@/lib/api/serverFetch';
import type { IProduct } from '@/lib/api/types';

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="hidden lg:block lg:col-span-1 h-[520px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
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

export default async function ProductsPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Heading is part of the initial shell so first paint is not blocked by the API. */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Products</h1>
        <p className="text-muted-foreground">Discover our amazing collection</p>
      </div>

      <Suspense fallback={<ProductsListingSkeleton />}>
        <ProductsListingData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

