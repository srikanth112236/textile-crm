import { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchResultsClient } from '@/components/products/SearchResultsClient';
import { productsApi } from '@/lib/api/products';

export const metadata: Metadata = {
  title: 'Search Results | Mentoos',
  description: 'Search the Mentoos catalogue for oversized tees, shirts, trousers, joggers and ethnic wear.',
  robots: 'noindex, nofollow', // Search result pages are intentionally not indexed
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    category?: string;
    color?: string;
    size?: string;
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
      size: searchParams.size,
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

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-52 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

async function SearchResultsData({
  searchParams,
}: {
  searchParams: Awaited<SearchPageProps['searchParams']>;
}) {
  const searchResults = await getSearchResults(searchParams);

  return (
    <>
      {searchParams.q && (
        <p className="text-muted-foreground mb-6">
          {searchResults.pagination.total > 0
            ? `Found ${searchResults.pagination.total} result${searchResults.pagination.total === 1 ? '' : 's'} for "${searchParams.q}"`
            : `No results found for "${searchParams.q}"`}
        </p>
      )}
      <SearchResultsClient
        initialProducts={searchResults.data}
        initialPagination={searchResults.pagination}
        searchParams={searchParams}
        fallback={(searchResults as any).fallback || null}
      />
    </>
  );
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Search Results</h1>
      </div>

      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResultsData searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

