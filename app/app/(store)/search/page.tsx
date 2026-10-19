import { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchResultsClient } from '@/components/products/SearchResultsClient';
import { productsApi } from '@/lib/api/products';

export const metadata: Metadata = {
  title: 'Search Products | E-Commerce Platform',
  description: 'Search for products in our catalog',
  robots: 'noindex, nofollow', // Search pages are typically not indexed
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }>;
}

async function getSearchResults(searchParams: Awaited<SearchPageProps['searchParams']>) {
  try {
    const query = searchParams.q || '';
    
    if (!query.trim()) {
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

    const filters = {
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: 20,
      search: query,
      category: searchParams.category,
      color: searchParams.color,
      minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
      sort: searchParams.sort || 'createdAt',
      order: searchParams.order || 'desc',
      status: 'active', // Only show active products
    };

    const response = await productsApi.getProducts(filters);
    return response;
  } catch (error) {
    console.error('Failed to fetch search results:', error);
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

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const searchResults = await getSearchResults(searchParams);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Search Results</h1>
        {searchParams.q && (
          <p className="text-muted-foreground">
            {searchResults.pagination.total > 0
              ? `Found ${searchResults.pagination.total} result${searchResults.pagination.total === 1 ? '' : 's'} for "${searchParams.q}"`
              : `No results found for "${searchParams.q}"`}
          </p>
        )}
      </div>

      <Suspense fallback={<div className="text-center py-12">Loading search results...</div>}>
        <SearchResultsClient
          initialProducts={searchResults.data}
          initialPagination={searchResults.pagination}
          searchParams={searchParams}
          fallback={(searchResults as any).fallback || null}
        />
      </Suspense>
    </div>
  );
}

