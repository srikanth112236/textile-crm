'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check, 
  Sparkles, 
  RefreshCcw, 
  Tag, 
  Palette, 
  Ruler,
  SlidersHorizontal
} from 'lucide-react';
import { productsApi, ProductFilters } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import type { IProduct, ICategory } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { KeyboardShortcutsModal } from '@/components/admin/KeyboardShortcutsModal';

interface CategoryProductsClientProps {
  category: ICategory;
  initialProducts: IProduct[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  searchParams: {
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    color?: string;
    size?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}

const FALLBACK_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Beige', hex: '#E1D4C0' },
  { name: 'Maroon', hex: '#800020' },
  { name: 'Green', hex: '#2D5A27' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Blue', hex: '#2563EB' },
];

export function CategoryProductsClient({
  category,
  initialProducts,
  initialPagination,
  searchParams: initialSearchParams,
}: CategoryProductsClientProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  const { toast } = useToast();

  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [availableColors, setAvailableColors] = useState<Array<{ name: string; hex: string }>>(FALLBACK_COLORS);
  const [loading, setLoading] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Filter States
  const [minPriceInput, setMinPriceInput] = useState<string>(initialSearchParams.minPrice || '');
  const [maxPriceInput, setMaxPriceInput] = useState<string>(initialSearchParams.maxPrice || '');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialSearchParams.size ? initialSearchParams.size.split(',').filter(Boolean) : []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    initialSearchParams.color ? initialSearchParams.color.split(',').filter(Boolean) : []
  );

  // Load dynamic filter metadata for this specific category
  useEffect(() => {
    async function loadDynamicFilters() {
      try {
        const res = await productsApi.getFilters({ category: category.slug });
        if (res.data) {
          if (res.data.categories && res.data.categories.length > 0) {
            setCategories(res.data.categories);
          }
          if (res.data.sizes && res.data.sizes.length > 0) {
            setAvailableSizes(res.data.sizes);
          }
          if (res.data.colors && res.data.colors.length > 0) {
            setAvailableColors(res.data.colors);
          }
        }
      } catch (err) {
        console.error('Failed to load category dynamic filters:', err);
      }
    }
    loadDynamicFilters();
  }, [category.slug]);

  // Synchronize state when URL query params change
  useEffect(() => {
    const minP = currentSearchParams.get('minPrice') || '';
    const maxP = currentSearchParams.get('maxPrice') || '';
    const colorP = currentSearchParams.get('color') || '';
    const sizeP = currentSearchParams.get('size') || '';

    setMinPriceInput(minP);
    setMaxPriceInput(maxP);
    setSelectedColors(colorP ? colorP.split(',').filter(Boolean) : []);
    setSelectedSizes(sizeP ? sizeP.split(',').filter(Boolean) : []);

    const filters: ProductFilters = {
      page: parseInt(currentSearchParams.get('page') || '1', 10),
      limit: 20,
      category: category._id,
      minPrice: minP ? parseFloat(minP) : undefined,
      maxPrice: maxP ? parseFloat(maxP) : undefined,
      color: colorP || undefined,
      size: sizeP || undefined,
      sort: currentSearchParams.get('sort') || 'createdAt',
      order: (currentSearchParams.get('order') as any) || 'desc',
      status: 'active',
    };

    fetchProducts(filters);
  }, [currentSearchParams, category._id]);

  const fetchProducts = async (filters: ProductFilters) => {
    setLoading(true);
    try {
      const response = await productsApi.getProducts(filters);
      setProducts(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error: any) {
      console.error('Failed to fetch category products:', error);
      toast({
        title: 'Error Loading Products',
        description: 'Failed to filter products from database.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/categories/${category.slug}?${params.toString()}`);
  };

  const handlePriceApply = () => {
    updateURL({
      minPrice: minPriceInput || undefined,
      maxPrice: maxPriceInput || undefined,
      page: '1',
    });
  };

  const handlePricePreset = (min?: number, max?: number) => {
    const minStr = min ? min.toString() : '';
    const maxStr = max ? max.toString() : '';
    setMinPriceInput(minStr);
    setMaxPriceInput(maxStr);
    updateURL({
      minPrice: minStr || undefined,
      maxPrice: maxStr || undefined,
      page: '1',
    });
  };

  const handleSizeToggle = (sz: string) => {
    const updated = selectedSizes.includes(sz)
      ? selectedSizes.filter((s) => s !== sz)
      : [...selectedSizes, sz];
    setSelectedSizes(updated);
    updateURL({ size: updated.length > 0 ? updated.join(',') : undefined, page: '1' });
  };

  const handleColorToggle = (colorName: string) => {
    const updated = selectedColors.includes(colorName)
      ? selectedColors.filter((c) => c !== colorName)
      : [...selectedColors, colorName];
    setSelectedColors(updated);
    updateURL({ color: updated.length > 0 ? updated.join(',') : undefined, page: '1' });
  };

  const handleClearAllFilters = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setSelectedSizes([]);
    setSelectedColors([]);
    router.push(`/categories/${category.slug}`);
  };

  const handleSortChange = (value: string) => {
    const [sort, order] = value.split('-');
    updateURL({ sort, order: order as 'asc' | 'desc', page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    updateURL({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setShortcutsModalOpen(true);
      }
      if (e.key === 'Escape') {
        setShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters = Boolean(
    currentSearchParams.get('minPrice') ||
    currentSearchParams.get('maxPrice') ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0
  );

  const PRICE_PRESETS = [
    { label: 'Under ₹500', max: 500 },
    { label: '₹500 - ₹999', min: 500, max: 999 },
    { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
    { label: 'Above ₹2,000', min: 2000 },
  ];

  // Internally Scrollable Sidebar Content
  const SidebarContent = () => (
    <div className="space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm z-10">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-amber-500" />
          {category.name} Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
          >
            <RefreshCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Categories Navigation */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-500" />
          All Categories
        </label>
        <div className="space-y-1">
          <button
            onClick={() => router.push('/products')}
            className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            All Products
          </button>
          {categories.map((cat) => {
            const isCurrent = cat.slug === category.slug;
            return (
              <button
                key={cat._id}
                onClick={() => router.push(`/categories/${cat.slug}`)}
                className={cn(
                  'w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors',
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <span>{cat.name}</span>
                {isCurrent && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          💰 Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePricePreset(preset.min, preset.max)}
              className="text-[11px] font-bold p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500 hover:text-amber-500 transition-colors bg-white dark:bg-slate-900"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min ₹"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="text-xs h-8 rounded-xl"
          />
          <span className="text-xs text-slate-400 font-bold">-</span>
          <Input
            type="number"
            placeholder="Max ₹"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="text-xs h-8 rounded-xl"
          />
          <Button
            size="sm"
            onClick={handlePriceApply}
            className="h-8 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs rounded-xl px-3"
          >
            Go
          </Button>
        </div>
      </div>

      {/* Multi-Select Sizes Selector */}
      {availableSizes.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Ruler className="w-3.5 h-3.5 text-amber-500" />
            Available Sizes ({availableSizes.length})
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableSizes.map((sz) => {
              const isSelected = selectedSizes.includes(sz);
              return (
                <button
                  key={sz}
                  onClick={() => handleSizeToggle(sz)}
                  className={cn(
                    'h-8 min-w-[36px] px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1',
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  )}
                >
                  <span>{sz}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Multi-Select Colors Selector */}
      {availableColors.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            Available Colors ({availableColors.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((c) => {
              const isSelected = selectedColors.includes(c.name);
              return (
                <button
                  key={c.name}
                  onClick={() => handleColorToggle(c.name)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all',
                    isSelected
                      ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  )}
                >
                  <span className="w-3 h-3 rounded-full border border-slate-400" style={{ backgroundColor: c.hex }} />
                  <span>{c.name}</span>
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Desktop Sticky & Internally Scrollable Sidebar Panel */}
      <aside className="hidden lg:block lg:col-span-1 bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 h-fit max-h-[calc(100vh-6rem)] overflow-hidden sticky top-24 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Slide-out Trigger */}
      <div className="lg:hidden flex items-center justify-between col-span-1 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Button
          onClick={() => setShowMobileSidebar(true)}
          variant="outline"
          className="rounded-xl font-bold text-xs flex items-center gap-2 border-slate-300 dark:border-slate-700"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          Filter Products
          {hasActiveFilters && (
            <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] ml-1">
              Active
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile Slide-out Drawer */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 flex bg-slate-950/60 backdrop-blur-sm lg:hidden">
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-slate-900 h-full p-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Mentoos Filters
                </h4>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </div>
            <Button
              onClick={() => setShowMobileSidebar(false)}
              className="mt-4 w-full bg-amber-500 text-slate-950 font-bold text-xs py-3 rounded-xl hover:bg-amber-400"
            >
              Apply Filters ({pagination.total} Products)
            </Button>
          </div>
          <div className="flex-1" onClick={() => setShowMobileSidebar(false)} />
        </div>
      )}

      {/* Main Grid Content */}
      <main className="lg:col-span-3 space-y-6">
        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Active Filters:
            </span>
            {currentSearchParams.get('minPrice') && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-slate-800 dark:text-slate-200 text-xs font-semibold gap-1">
                Min: ₹{currentSearchParams.get('minPrice')}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => updateURL({ minPrice: undefined, page: '1' })} />
              </Badge>
            )}
            {currentSearchParams.get('maxPrice') && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-slate-800 dark:text-slate-200 text-xs font-semibold gap-1">
                Max: ₹{currentSearchParams.get('maxPrice')}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => updateURL({ maxPrice: undefined, page: '1' })} />
              </Badge>
            )}
            {selectedSizes.map((sz) => (
              <Badge key={sz} variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-slate-800 dark:text-slate-200 text-xs font-semibold gap-1">
                Size: {sz}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => handleSizeToggle(sz)} />
              </Badge>
            ))}
            {selectedColors.map((col) => (
              <Badge key={col} variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-slate-800 dark:text-slate-200 text-xs font-semibold gap-1">
                Color: {col}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => handleColorToggle(col)} />
              </Badge>
            ))}
            <button
              onClick={handleClearAllFilters}
              className="text-xs font-extrabold text-rose-500 hover:underline ml-auto"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Header Bar with Sort and Shortcuts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {category.name} Catalog
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} products
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={`${currentSearchParams.get('sort') || 'createdAt'}-${currentSearchParams.get('order') || 'desc'}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px] rounded-xl text-xs font-semibold">
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

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShortcutsModalOpen(true)}
              className="relative rounded-xl"
              title="Keyboard shortcuts (?)"
            >
              <span className="text-base font-bold">?</span>
            </Button>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Mentoos products match these filters</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">Try clearing some filters or changing your selection.</p>
            <Button onClick={handleClearAllFilters} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl">
              Reset All Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="rounded-xl text-xs font-bold"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
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
                        className={cn(
                          'min-w-[36px] h-9 rounded-xl text-xs font-bold',
                          pagination.page === pageNum ? 'bg-amber-500 text-slate-950 font-extrabold' : ''
                        )}
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
                  className="rounded-xl text-xs font-bold"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <KeyboardShortcutsModal open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen} />
    </div>
  );
}
