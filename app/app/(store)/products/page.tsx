import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsListingClient } from '@/components/products/ProductsListingClient';
import { productsApi } from '@/lib/api/products';

export const metadata: Metadata = {
  title: 'Products | E-Commerce Platform',
  description: 'Browse our wide selection of products',
  openGraph: {
    title: 'Products | E-Commerce Platform',
    description: 'Browse our wide selection of products',
    type: 'website',
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

    const response = await productsApi.getProducts(filters);
    return response;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    };
  }
}

export default async function ProductsPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;
  const productsData = await getProducts(searchParams);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Products</h1>
        <p className="text-muted-foreground">Discover our amazing collection</p>
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading products...</div>}>
        <ProductsListingClient
          initialProducts={productsData.data}
          initialPagination={productsData.pagination}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

