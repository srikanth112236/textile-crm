'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { productsApi, ProductFilters } from '@/lib/api/products';
import type { IProduct } from '@/lib/api/types';
import { KeyboardShortcutsModal } from '@/components/admin/KeyboardShortcutsModal';
import { useToast } from '@/hooks/use-toast';

interface SearchResultsClientProps {
  initialProducts: IProduct[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  searchParams: {
    q?: string;
    page?: string;
    category?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
  fallback?: {
    relaxed: boolean;
    strategy?: string;
    appliedQuery?: string;
  } | null;
}

export function SearchResultsClient({
  initialProducts,
  initialPagination,
  searchParams: initialSearchParams,
  fallback: initialFallback,
}: SearchResultsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [fallback, setFallback] = useState(initialFallback || null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchParams.q || '');
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Sync when the server re-renders with new ?q/?color/?price params (e.g.
  // SmartSearch "View All" carries color+price). Without this, carried params
  // update the URL but the grid keeps showing the first SSR payload.
  useEffect(() => {
    setProducts(initialProducts);
    setPagination(initialPagination);
    setFallback(initialFallback || null);
  }, [initialProducts, initialPagination, initialFallback]);
  useEffect(() => {
    setSearchQuery(initialSearchParams.q || '');
  }, [initialSearchParams.q]);

  const updateURL = (newParams: Record<string, string | undefined>) => {
    // Preserve existing params (sort/page/q) — previously dropped them, and
    // use replace + scroll:false so typing/sorting never triggers full reloads.
    const params = new URLSearchParams(
      Object.entries(initialSearchParams).filter(([, v]) => v !== undefined && v !== '') as [string, string][]
    );

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.replace(`/search?${params.toString()}`, { scroll: false } as any);
  };

  const handleSearch = () => {
    updateURL({ q: searchQuery || undefined, page: '1' });
  };

  const handleSortChange = (value: string) => {
    const [sort, order] = value.split('-');
    updateURL({ ...initialSearchParams, sort, order: order as 'asc' | 'desc', page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    updateURL({ ...initialSearchParams, page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + F for search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
          toast({
            title: 'Search Focused',
            description: 'Type to search products',
            duration: 2000,
          });
        }
      }

      // ? key for shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setShortcutsModalOpen(true);
      }

      // Esc key to close modals
      if (e.key === 'Escape') {
        setShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} className="sm:w-auto">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShortcutsModalOpen(true)}
          className="relative"
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <span className="text-lg font-bold">?</span>
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
        </Button>
      </div>

      {/* Active smart-search filters carried from the modal (color/price) */}
      {(initialSearchParams.color || initialSearchParams.minPrice || initialSearchParams.maxPrice) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-amber-700">Smart filters:</span>
          {initialSearchParams.color && (
            <button
              onClick={() => updateURL({ color: undefined, page: '1' })}
              className="px-2.5 py-1 rounded-full border border-amber-400 bg-amber-500/10 font-semibold hover:bg-amber-500/20"
              title="Clear color filter"
            >
              Color: {initialSearchParams.color} ✕
            </button>
          )}
          {initialSearchParams.minPrice && (
            <button
              onClick={() => updateURL({ minPrice: undefined, page: '1' })}
              className="px-2.5 py-1 rounded-full border border-amber-400 bg-amber-500/10 font-semibold hover:bg-amber-500/20"
              title="Clear min price"
            >
              Min ₹{initialSearchParams.minPrice} ✕
            </button>
          )}
          {initialSearchParams.maxPrice && (
            <button
              onClick={() => updateURL({ maxPrice: undefined, page: '1' })}
              className="px-2.5 py-1 rounded-full border border-amber-400 bg-amber-500/10 font-semibold hover:bg-amber-500/20"
              title="Clear max price"
            >
              Max ₹{initialSearchParams.maxPrice} ✕
            </button>
          )}
        </div>
      )}

      {/* Relaxed-results note when nothing matched exactly */}
      {fallback?.relaxed && products.length > 0 && (
        <div className="mb-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-700">
          {fallback.strategy === 'popular' || fallback.strategy === 'category'
            ? `No exact matches — showing popular picks${fallback.appliedQuery ? ` for "${fallback.appliedQuery}"` : ''}.`
            : `No exact matches — showing closest results${fallback.appliedQuery ? ` for "${fallback.appliedQuery}"` : ''}.`}
        </div>
      )}

      {/* Sort */}
      {products.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <Select
            value={`${initialSearchParams.sort || 'createdAt'}-${initialSearchParams.order || 'desc'}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No products found</p>
          <Button variant="outline" onClick={() => router.push('/products')}>
            Browse All Products
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'default' : 'outline'}
                      onClick={() => handlePageChange(pageNum)}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen} />
    </div>
  );
}

