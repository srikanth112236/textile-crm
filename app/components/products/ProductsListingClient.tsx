'use client';

import { useState, useEffect, useRef } from 'react';
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
import { cn, getErrorMessage } from '@/lib/utils';
import { KeyboardShortcutsModal } from '@/components/admin/KeyboardShortcutsModal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ProductsListingClientProps {
  initialProducts: IProduct[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  searchParams: {
    page?: string;
    category?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
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

const FALLBACK_FITS = ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Oversized', 'Tapered'];
const FALLBACK_FABRICS = ['Cotton', 'Linen', 'Polyester', 'Denim', 'Silk Blend', 'Wool Blend'];
const FALLBACK_PATTERNS = ['Solid', 'Striped', 'Checked', 'Printed', 'Graphic', 'Textured'];
const FALLBACK_OCCASIONS = ['Casual', 'Formal', 'Party', 'Sports', 'Festive', 'Travel'];

export function ProductsListingClient({
  initialProducts,
  initialPagination,
  searchParams: initialSearchParams,
}: ProductsListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [selectedCategory, setSelectedCategory] = useState<string>(initialSearchParams.category || '');
  const [minPriceInput, setMinPriceInput] = useState<string>(initialSearchParams.minPrice || '');
  const [maxPriceInput, setMaxPriceInput] = useState<string>(initialSearchParams.maxPrice || '');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialSearchParams.size ? initialSearchParams.size.split(',').filter(Boolean) : []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    initialSearchParams.color ? initialSearchParams.color.split(',').filter(Boolean) : []
  );
  const [selectedFits, setSelectedFits] = useState<string[]>([]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<string>('');
  const [minDiscount, setMinDiscount] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [availableFits, setAvailableFits] = useState<string[]>(FALLBACK_FITS);
  const [availableFabrics, setAvailableFabrics] = useState<string[]>(FALLBACK_FABRICS);
  const [availablePatterns, setAvailablePatterns] = useState<string[]>(FALLBACK_PATTERNS);
  const [availableOccasions, setAvailableOccasions] = useState<string[]>(FALLBACK_OCCASIONS);
  const fetchSeq = useRef(0);

  // Load dynamic filter metadata (available sizes, colors, price range, categories)
  // Debounced + cached so route switches stay instant; fallbacks keep every section visible.
  useEffect(() => {
    import('@/lib/analytics').then((m) => m.funnel.viewList('product_listing')).catch(() => {});
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const cat = searchParams.get('category') || '';
        const searchQ = searchParams.get('search') || '';

        const res = await productsApi.getFilters({ category: cat || undefined, search: searchQ || undefined });
        if (cancelled) return;
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
          // Always keep Fit/Fabric/Pattern/Occasion visible: backend distinct may be empty
          // when products don't set those fields yet — fall back to curated lists.
          setAvailableFits(res.data.fits && res.data.fits.length > 0 ? res.data.fits : FALLBACK_FITS);
          setAvailableFabrics(res.data.fabrics && res.data.fabrics.length > 0 ? res.data.fabrics : FALLBACK_FABRICS);
          setAvailablePatterns(res.data.patterns && res.data.patterns.length > 0 ? res.data.patterns : FALLBACK_PATTERNS);
          setAvailableOccasions(res.data.occasions && res.data.occasions.length > 0 ? res.data.occasions : FALLBACK_OCCASIONS);
        }
      } catch (err) {
        if (!cancelled) {
          // 429s already surface via the countdown banner — stay quiet here
          if ((err as any)?.isRateLimited || (err as any)?.status === 429 || (err as any)?.response?.status === 429) {
            return;
          }
          // Fallbacks so sidebar never looks empty on network failure
          setAvailableFits((prev) => (prev.length > 0 ? prev : FALLBACK_FITS));
          setAvailableFabrics((prev) => (prev.length > 0 ? prev : FALLBACK_FABRICS));
          setAvailablePatterns((prev) => (prev.length > 0 ? prev : FALLBACK_PATTERNS));
          setAvailableOccasions((prev) => (prev.length > 0 ? prev : FALLBACK_OCCASIONS));
          console.error('Failed to load dynamic filter options:', err);
        }
      }
    }, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchParams]);

  // Synchronize state when URL searchParams change
  // Uses request id so rapid filter clicks never stack slow requests.
  // Skips the first client fetch: SSR already rendered this exact URL's data
  // (saves one full backend round-trip on every route entry).
  const skippedFirstFetch = useRef(false);
  useEffect(() => {
    if (!skippedFirstFetch.current) {
      skippedFirstFetch.current = true;
      const cat0 = searchParams.get('category') || '';
      const csv0 = (k: string) => (searchParams.get(k) || '').split(',').filter(Boolean);
      setSelectedCategory(cat0);
      setMinPriceInput(searchParams.get('minPrice') || '');
      setMaxPriceInput(searchParams.get('maxPrice') || '');
      setSelectedColors(csv0('color'));
      setSelectedSizes(csv0('size'));
      setSelectedFits(csv0('fit'));
      setSelectedFabrics(csv0('fabric'));
      setSelectedPatterns(csv0('pattern'));
      setSelectedOccasions(csv0('occasion'));
      setSelectedBadges(csv0('badge'));
      setMinRating(searchParams.get('minRating') || '');
      setMinDiscount(searchParams.get('minDiscount') || '');
      setInStockOnly(searchParams.get('inStock') === 'true');
      return;
    }
    const cat = searchParams.get('category') || '';
    const minP = searchParams.get('minPrice') || '';
    const maxP = searchParams.get('maxPrice') || '';
    const searchQ = searchParams.get('search') || '';
    const colorP = searchParams.get('color') || '';
    const sizeP = searchParams.get('size') || '';
    const csv = (k: string) => (searchParams.get(k) || '').split(',').filter(Boolean);

    setSelectedCategory(cat);
    setMinPriceInput(minP);
    setMaxPriceInput(maxP);
    setSelectedColors(colorP ? colorP.split(',').filter(Boolean) : []);
    setSelectedSizes(sizeP ? sizeP.split(',').filter(Boolean) : []);
    setSelectedFits(csv('fit'));
    setSelectedFabrics(csv('fabric'));
    setSelectedPatterns(csv('pattern'));
    setSelectedOccasions(csv('occasion'));
    setSelectedBadges(csv('badge'));
    setMinRating(searchParams.get('minRating') || '');
    setMinDiscount(searchParams.get('minDiscount') || '');
    setInStockOnly(searchParams.get('inStock') === 'true');

    const filters: ProductFilters = {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: 20,
      category: cat || undefined,
      minPrice: minP ? parseFloat(minP) : undefined,
      maxPrice: maxP ? parseFloat(maxP) : undefined,
      search: searchQ || undefined,
      color: colorP || undefined,
      size: sizeP || undefined,
      fit: searchParams.get('fit') || undefined,
      fabric: searchParams.get('fabric') || undefined,
      pattern: searchParams.get('pattern') || undefined,
      occasion: searchParams.get('occasion') || undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating') as string) : undefined,
      minDiscount: searchParams.get('minDiscount') ? parseFloat(searchParams.get('minDiscount') as string) : undefined,
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      badge: searchParams.get('badge') || undefined,
      sort: searchParams.get('sort') || 'createdAt',
      order: (searchParams.get('order') as any) || 'desc',
      status: 'active',
    };

    const reqId = ++fetchSeq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await productsApi.getProducts(filters);
        if (reqId !== fetchSeq.current) return; // stale response
        setProducts(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      } catch (error: any) {
        if (reqId !== fetchSeq.current) return;
        // Don't toast on abort/cancel; only on real errors, and use safe string
        if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') return;
        // 429s already surface via the countdown banner — stay quiet here
        if (error?.isRateLimited || error?.status === 429 || error?.response?.status === 429) return;
        console.error('Failed to fetch products from DB:', error);
        toast({
          title: 'Error Loading Products',
          description: getErrorMessage(error) || 'Failed to filter products from database.',
          variant: 'destructive',
        });
      } finally {
        if (reqId === fetchSeq.current) setLoading(false);
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const fetchProducts = async (filters: ProductFilters) => {
    // Kept for backwards-compat; main flow is the debounced effect above.
    setLoading(true);
    try {
      const response = await productsApi.getProducts(filters);
      setProducts(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error: any) {
      console.error('Failed to fetch products from DB:', error);
      toast({
        title: 'Error Loading Products',
        description: getErrorMessage(error) || 'Failed to filter products from database.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // replace (not push) + scroll:false keeps filter clicks instant and avoids
    // history spam + full server reload storms on every size/color toggle.
    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

  const handleCategorySelect = (catId: string) => {
    const newCat = selectedCategory === catId ? '' : catId;
    setSelectedCategory(newCat);
    updateURL({ category: newCat || undefined, page: '1' });
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

  // Toggle multi-select size
  const handleSizeToggle = (sz: string) => {
    const updated = selectedSizes.includes(sz)
      ? selectedSizes.filter((s) => s !== sz)
      : [...selectedSizes, sz];
    setSelectedSizes(updated);
    updateURL({ size: updated.length > 0 ? updated.join(',') : undefined, page: '1' });
  };

  // Toggle multi-select color
  const handleColorToggle = (colorName: string) => {
    const updated = selectedColors.includes(colorName)
      ? selectedColors.filter((c) => c !== colorName)
      : [...selectedColors, colorName];
    setSelectedColors(updated);
    updateURL({ color: updated.length > 0 ? updated.join(',') : undefined, page: '1' });
  };

  // Generic multi-select toggle for URL-backed filters
  const handleMultiToggle = (
    key: 'fit' | 'fabric' | 'pattern' | 'occasion' | 'badge',
    current: string[],
    set: (v: string[]) => void,
    value: string
  ) => {
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    set(updated);
    updateURL({ [key]: updated.length > 0 ? updated.join(',') : undefined, page: '1' });
  };

  const handleClearAllFilters = () => {
    setSelectedCategory('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedFits([]);
    setSelectedFabrics([]);
    setSelectedPatterns([]);
    setSelectedOccasions([]);
    setSelectedBadges([]);
    setMinRating('');
    setMinDiscount('');
    setInStockOnly(false);
    router.replace('/products', { scroll: true });
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

  const activeCategoryObj = categories.find((c) => c._id === selectedCategory || c.slug === selectedCategory);
  const currentSearchTerm = searchParams.get('search');
  const hasActiveFilters = Boolean(
    selectedCategory ||
    searchParams.get('minPrice') ||
    searchParams.get('maxPrice') ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    selectedFits.length > 0 ||
    selectedFabrics.length > 0 ||
    selectedPatterns.length > 0 ||
    selectedOccasions.length > 0 ||
    selectedBadges.length > 0 ||
    minRating ||
    minDiscount ||
    inStockOnly ||
    currentSearchTerm
  );

  const chipCls = 'bg-white dark:bg-slate-900 border-amber-400 text-slate-800 dark:text-slate-200 text-xs font-semibold gap-1';

  const PRICE_PRESETS = [
    { label: 'Under ₹500', max: 500 },
    { label: '₹500 - ₹999', min: 500, max: 999 },
    { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
    { label: 'Above ₹2,000', min: 2000 },
  ];

  // Best-practice sidebar: EVERY section is an independent accordion item
  // (type="multiple") so any/all can collapse — fixes "only one dropdown collapses".
  // All attribute groups always render (with fallbacks) — fixes "options missed".
  const SidebarContent = () => {
    const sectionLabel = 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5';
    const pill = (active: boolean) =>
      cn(
        'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all',
        active
          ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold'
          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
      );
    return (
    <div className="max-h-[calc(100vh-7rem)] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-amber-500" />
          Filter Products
        </h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
          >
            <RefreshCcw className="w-3 h-3" />
            Reset All
          </button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={['cat', 'price', 'size', 'color', 'fit', 'fabric', 'pattern', 'occasion', 'rating', 'badges']} className="w-full">
        {/* 1. Categories */}
        <AccordionItem value="cat" className="border-b border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
            <span className={sectionLabel}><Tag className="w-3.5 h-3.5 text-amber-500" /> Categories ({categories.length})</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1">
              <button
                onClick={() => handleCategorySelect('')}
                className={cn(
                  'w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors',
                  !selectedCategory
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <span>All Categories</span>
                {!selectedCategory && <Check className="w-3.5 h-3.5" />}
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat._id || selectedCategory === cat.slug;
                return (
                  <button
                    key={cat._id}
                    onClick={() => handleCategorySelect(cat._id)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors',
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Price */}
        <AccordionItem value="price" className="border-b border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
            <span className={sectionLabel}>💰 Price Range (₹)</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePriceApply(); }}
                  className="text-xs h-8 rounded-xl"
                />
                <span className="text-xs text-slate-400 font-bold">-</span>
                <Input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePriceApply(); }}
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
          </AccordionContent>
        </AccordionItem>

        {/* 3. Size */}
        <AccordionItem value="size" className="border-b border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
            <span className={sectionLabel}><Ruler className="w-3.5 h-3.5 text-amber-500" /> Size {selectedSizes.length > 0 ? `(${selectedSizes.length})` : ''}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((sz) => {
                const isSelected = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    onClick={() => handleSizeToggle(sz)}
                    aria-pressed={isSelected}
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
          </AccordionContent>
        </AccordionItem>

        {/* 4. Color */}
        <AccordionItem value="color" className="border-b border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
            <span className={sectionLabel}><Palette className="w-3.5 h-3.5 text-amber-500" /> Color {selectedColors.length > 0 ? `(${selectedColors.length})` : ''}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c) => {
                const isSelected = selectedColors.includes(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => handleColorToggle(c.name)}
                    aria-pressed={isSelected}
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
          </AccordionContent>
        </AccordionItem>

        {/* 5-8. Fit / Fabric / Pattern / Occasion — always rendered */}
        {[
          { title: 'Fit', options: availableFits, key: 'fit' as const, current: selectedFits, set: setSelectedFits },
          { title: 'Fabric', options: availableFabrics, key: 'fabric' as const, current: selectedFabrics, set: setSelectedFabrics },
          { title: 'Pattern', options: availablePatterns, key: 'pattern' as const, current: selectedPatterns, set: setSelectedPatterns },
          { title: 'Occasion', options: availableOccasions, key: 'occasion' as const, current: selectedOccasions, set: setSelectedOccasions },
        ].map((group) => (
          <AccordionItem key={group.key} value={group.key} className="border-b border-slate-200 dark:border-slate-800">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
              <span className={sectionLabel}>{group.title} {group.current.length > 0 ? `(${group.current.length})` : ''}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((opt) => {
                  const isSelected = group.current.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => handleMultiToggle(group.key, group.current, group.set, opt)}
                      aria-pressed={isSelected}
                      className={pill(isSelected)}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1" />}{opt}
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}

        {/* 9. Rating / Discount / Availability */}
        <AccordionItem value="rating" className="border-b border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
            <span className={sectionLabel}>Rating & Offers</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">Customer Rating</div>
                <div className="flex flex-wrap gap-1.5">
                  {[4, 3].map((r) => (
                    <button
                      key={r}
                      onClick={() => { const v = minRating === String(r) ? '' : String(r); setMinRating(v); updateURL({ minRating: v || undefined, page: '1' }); }}
                      className={pill(minRating === String(r))}
                    >
                      {r}★ & above
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">Discount</div>
                <div className="flex flex-wrap gap-1.5">
                  {[10, 25, 50].map((d) => (
                    <button
                      key={d}
                      onClick={() => { const v = minDiscount === String(d) ? '' : String(d); setMinDiscount(v); updateURL({ minDiscount: v || undefined, page: '1' }); }}
                      className={pill(minDiscount === String(d))}
                    >
                      {d}%+ off
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-500 mb-1.5">Availability</div>
                <button
                  onClick={() => { setInStockOnly(!inStockOnly); updateURL({ inStock: !inStockOnly ? 'true' : undefined, page: '1' }); }}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all',
                    inStockOnly
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  )}
                >
                  In stock only
                </button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 10. Badges */}
        <AccordionItem value="badges" className="border-b-0">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
            <span className={sectionLabel}>Badges {selectedBadges.length > 0 ? `(${selectedBadges.length})` : ''}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-1.5">
              {['new', 'bestseller', 'trending', 'sale', 'limited'].map((b) => {
                const isSelected = selectedBadges.includes(b);
                return (
                  <button
                    key={b}
                    onClick={() => handleMultiToggle('badge', selectedBadges, setSelectedBadges, b)}
                    aria-pressed={isSelected}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border transition-all',
                      isSelected
                        ? 'bg-rose-500 border-rose-500 text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-rose-400'
                    )}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
    );
  };

  const activeSort = `${searchParams.get('sort') || 'createdAt'}-${searchParams.get('order') || 'desc'}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Desktop Sticky & Internally Scrollable Left Sidebar Filter Panel */}
      <aside className="hidden lg:block lg:col-span-1 bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 sticky top-24 shadow-sm h-fit max-h-[calc(100vh-6rem)] overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile FILTER | SORT bar (doc §7) */}
      <div className="lg:hidden col-span-1 grid grid-cols-2 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden sticky top-16 z-30 bg-white dark:bg-slate-900 shadow-sm">
        <button
          onClick={() => setShowMobileSidebar(true)}
          className="py-3 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 border-r border-slate-200 dark:border-slate-800"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          Filter
          {hasActiveFilters && <Badge className="bg-amber-500 text-slate-950 text-[10px]">On</Badge>}
        </button>
        <select
          value={activeSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="py-3 text-xs font-extrabold uppercase tracking-wider text-center bg-transparent focus:outline-none"
          aria-label="Sort products"
        >
          <option value="createdAt-desc">Sort: Newest</option>
          <option value="recommended-desc">Sort: Recommended</option>
          <option value="best-selling-desc">Sort: Best Selling</option>
          <option value="price-asc">Sort: Price Low→High</option>
          <option value="price-desc">Sort: Price High→Low</option>
          <option value="discount-desc">Sort: Discount</option>
          <option value="rating-desc">Sort: Rating</option>
        </select>
      </div>

      {/* Mobile Slide-out Drawer Trigger (legacy, kept for desktop parity) */}
      <div className="lg:hidden hidden items-center justify-between col-span-1 pb-4 border-b border-slate-200 dark:border-slate-800">
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
            {activeCategoryObj && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-slate-800 dark:text-slate-200 text-xs font-semibold gap-1">
                Category: {activeCategoryObj.name}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => handleCategorySelect('')} />
              </Badge>
            )}
            {searchParams.get('minPrice') && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-slate-800 dark:text-slate-200 text-xs font-semibold gap-1">
                Min: ₹{searchParams.get('minPrice')}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => updateURL({ minPrice: undefined, page: '1' })} />
              </Badge>
            )}
            {searchParams.get('maxPrice') && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-slate-800 dark:text-slate-200 text-xs font-semibold gap-1">
                Max: ₹{searchParams.get('maxPrice')}
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
              <Badge key={col} variant="outline" className={chipCls}>
                Color: {col}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => handleColorToggle(col)} />
              </Badge>
            ))}
            {selectedFits.map((v) => (
              <Badge key={`fit-${v}`} variant="outline" className={chipCls}>
                Fit: {v}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => handleMultiToggle('fit', selectedFits, setSelectedFits, v)} />
              </Badge>
            ))}
            {selectedFabrics.map((v) => (
              <Badge key={`fabric-${v}`} variant="outline" className={chipCls}>
                Fabric: {v}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => handleMultiToggle('fabric', selectedFabrics, setSelectedFabrics, v)} />
              </Badge>
            ))}
            {selectedPatterns.map((v) => (
              <Badge key={`pattern-${v}`} variant="outline" className={chipCls}>
                Pattern: {v}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => handleMultiToggle('pattern', selectedPatterns, setSelectedPatterns, v)} />
              </Badge>
            ))}
            {selectedOccasions.map((v) => (
              <Badge key={`occasion-${v}`} variant="outline" className={chipCls}>
                For: {v}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => handleMultiToggle('occasion', selectedOccasions, setSelectedOccasions, v)} />
              </Badge>
            ))}
            {selectedBadges.map((v) => (
              <Badge key={`badge-${v}`} variant="outline" className={chipCls}>
                {v}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => handleMultiToggle('badge', selectedBadges, setSelectedBadges, v)} />
              </Badge>
            ))}
            {minRating && (
              <Badge variant="outline" className={chipCls}>
                {minRating}★+
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => { setMinRating(''); updateURL({ minRating: undefined, page: '1' }); }} />
              </Badge>
            )}
            {minDiscount && (
              <Badge variant="outline" className={chipCls}>
                {minDiscount}%+ off
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => { setMinDiscount(''); updateURL({ minDiscount: undefined, page: '1' }); }} />
              </Badge>
            )}
            {inStockOnly && (
              <Badge variant="outline" className={chipCls}>
                In stock
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500" onClick={() => { setInStockOnly(false); updateURL({ inStock: undefined, page: '1' }); }} />
              </Badge>
            )}
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
              {activeCategoryObj ? activeCategoryObj.name : 'Mentoos Products'}
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} products
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={`${searchParams.get('sort') || 'createdAt'}-${searchParams.get('order') || 'desc'}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px] rounded-xl text-xs font-semibold">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended-desc">Recommended</SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="best-selling-desc">Best Selling</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="discount-desc">Discount</SelectItem>
                <SelectItem value="rating-desc">Customer Rating</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
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
