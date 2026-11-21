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
  SlidersHorizontal,
  IndianRupee,
  Shirt,
  Layers,
  Shapes,
  PartyPopper,
  Star,
  Award,
  SearchX
} from 'lucide-react';
import { productsApi, ProductFilters } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import type { IProduct, ICategory } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';
import { cn, getErrorMessage } from '@/lib/utils';
import { KeyboardShortcutsModal } from '@/components/admin/KeyboardShortcutsModal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ActiveFilterChip } from './ActiveFilterChip';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

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
  const filterCategoryParam = searchParams.get('category') || '';
  const filterSearchParam = searchParams.get('search') || '';
  const { toast } = useToast();

  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [pagination, setPagination] = useState(initialPagination);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>(['S', 'M', 'L', 'XL', 'XXL']);
  const [availableColors, setAvailableColors] = useState<Array<{ name: string; hex: string }>>(FALLBACK_COLORS);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [sizeCounts, setSizeCounts] = useState<Record<string, number>>({});
  const [colorCounts, setColorCounts] = useState<Record<string, number>>({});
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 5000 });
  const [categoryQuery, setCategoryQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  // Multiple groups can stay open. Category + price are open by default so the
  // highest-intent filters are visible without an extra tap.
  const [openFilters, setOpenFilters] = useState<string[]>(['cat', 'price']);
  const fetchSeq = useRef(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const filterTriggerRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(showMobileSidebar, drawerRef, () => {
    setShowMobileSidebar(false);
    filterTriggerRef.current?.focus();
  });

  // Lock the page behind the mobile filter sheet.
  useEffect(() => {
    if (!showMobileSidebar) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showMobileSidebar]);

  const buildFilters = (page: number): ProductFilters => {
    const searchQ = filterSearchParam;
    return {
      page,
      limit: 20,
      category: filterCategoryParam || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice') as string) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice') as string) : undefined,
      search: searchQ || undefined,
      color: searchParams.get('color') || undefined,
      size: searchParams.get('size') || undefined,
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
  };

  // Load dynamic filter metadata (available sizes, colors, price range, categories)
  // Debounced + cached so route switches stay instant; fallbacks keep every section visible.
  useEffect(() => {
    import('@/lib/analytics').then((m) => m.funnel.viewList('product_listing')).catch(() => {});
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const cat = filterCategoryParam;
        const searchQ = filterSearchParam;

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
          setSizeCounts(res.data.sizeCounts || {});
          setColorCounts(res.data.colorCounts || {});
          setCategoryCounts(res.data.categoryCounts || {});
          if (typeof res.data.minPrice === 'number' && typeof res.data.maxPrice === 'number') {
            setPriceBounds({ min: res.data.minPrice, max: res.data.maxPrice });
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
      } finally {
        if (!cancelled) setFiltersLoaded(true);
      }
    }, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [filterCategoryParam, filterSearchParam]);

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

    const filters = buildFilters(parseInt(searchParams.get('page') || '1', 10));

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

    // Filter usage analytics: helps decide which facets deserve prominence.
    const filterKeys = new Set(['category','minPrice','maxPrice','color','size','fit','fabric','pattern','occasion','badge','minRating','minDiscount','inStock']);
    const changedFilters = Object.fromEntries(
      Object.entries(newParams).filter(([key, value]) => filterKeys.has(key) && value !== undefined)
    );
    if (Object.keys(changedFilters).length > 0) {
      import('@/lib/analytics')
        .then((m) => m.track('filter_applied', { page: 'product_listing', ...changedFilters }))
        .catch(() => {});
    }

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

  const prefetchPage = (page: number) => {
    if (page < 1 || page > pagination.pages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.prefetch(`/products?${params.toString()}`);
  };

  const handleLoadMore = async () => {
    if (loadingMore || pagination.page >= pagination.pages) return;
    const nextPage = pagination.page + 1;
    setLoadingMore(true);
    try {
      const response = await productsApi.getProducts(buildFilters(nextPage));
      const incoming = response.data || [];
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        return [...prev, ...incoming.filter((p) => !seen.has(p._id))];
      });
      setPagination((prev) => ({ ...prev, ...(response.pagination || {}), page: nextPage }));
    } catch (error: any) {
      if (error?.response?.status === 429) return;
      toast({
        title: 'Could not load more products',
        description: getErrorMessage(error) || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
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

  // Focus trap + Escape handling live in useFocusTrap above.

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

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (searchParams.get('minPrice') ? 1 : 0) +
    (searchParams.get('maxPrice') ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length +
    selectedFits.length +
    selectedFabrics.length +
    selectedPatterns.length +
    selectedOccasions.length +
    selectedBadges.length +
    (minRating ? 1 : 0) +
    (minDiscount ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (currentSearchTerm ? 1 : 0);

  const activeChips: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [
    ...(currentSearchTerm
      ? [{ key: 'search', label: 'Search', value: currentSearchTerm, onRemove: () => updateURL({ search: undefined, page: '1' }) }]
      : []),
    ...(activeCategoryObj
      ? [{ key: 'category', label: 'Category', value: activeCategoryObj.name, onRemove: () => handleCategorySelect('') }]
      : []),
    ...(searchParams.get('minPrice')
      ? [{ key: 'min', label: 'Min', value: `₹${searchParams.get('minPrice')}`, onRemove: () => updateURL({ minPrice: undefined, page: '1' }) }]
      : []),
    ...(searchParams.get('maxPrice')
      ? [{ key: 'max', label: 'Max', value: `₹${searchParams.get('maxPrice')}`, onRemove: () => updateURL({ maxPrice: undefined, page: '1' }) }]
      : []),
    ...selectedSizes.map((sz) => ({ key: `size-${sz}`, label: 'Size', value: sz, onRemove: () => handleSizeToggle(sz) })),
    ...selectedColors.map((col) => ({ key: `color-${col}`, label: 'Colour', value: col, onRemove: () => handleColorToggle(col) })),
    ...selectedFits.map((v) => ({ key: `fit-${v}`, label: 'Fit', value: v, onRemove: () => handleMultiToggle('fit', selectedFits, setSelectedFits, v) })),
    ...selectedFabrics.map((v) => ({ key: `fabric-${v}`, label: 'Fabric', value: v, onRemove: () => handleMultiToggle('fabric', selectedFabrics, setSelectedFabrics, v) })),
    ...selectedPatterns.map((v) => ({ key: `pattern-${v}`, label: 'Pattern', value: v, onRemove: () => handleMultiToggle('pattern', selectedPatterns, setSelectedPatterns, v) })),
    ...selectedOccasions.map((v) => ({ key: `occasion-${v}`, label: 'For', value: v, onRemove: () => handleMultiToggle('occasion', selectedOccasions, setSelectedOccasions, v) })),
    ...selectedBadges.map((v) => ({ key: `badge-${v}`, label: 'Badge', value: v, onRemove: () => handleMultiToggle('badge', selectedBadges, setSelectedBadges, v) })),
    ...(minRating ? [{ key: 'rating', label: 'Rating', value: `${minRating}★+`, onRemove: () => { setMinRating(''); updateURL({ minRating: undefined, page: '1' }); } }] : []),
    ...(minDiscount ? [{ key: 'discount', label: 'Discount', value: `${minDiscount}%+`, onRemove: () => { setMinDiscount(''); updateURL({ minDiscount: undefined, page: '1' }); } }] : []),
    ...(inStockOnly ? [{ key: 'stock', label: 'Stock', value: 'In stock', onRemove: () => { setInStockOnly(false); updateURL({ inStock: undefined, page: '1' }); } }] : []),
  ];


  const PRICE_PRESETS = [
    { label: 'Under ₹500', max: 500 },
    { label: '₹500 - ₹999', min: 500, max: 999 },
    { label: '₹1,000 - ₹1,999', min: 1000, max: 1999 },
    { label: 'Above ₹2,000', min: 2000 },
  ];

  // Best-practice sidebar: ONE accordion open at a time (type="single" collapsible)
  // so the panel stays compact and the shopper never scrolls past walls of options.
  // Every section carries the same amber icon treatment for visual rhythm.
  const SidebarContent = ({ embedded = false }: { embedded?: boolean } = {}) => {
    const sectionLabel = 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5';
    const sectionIcon = 'w-3.5 h-3.5 text-amber-500 shrink-0';
    const pill = (active: boolean) =>
      cn(
        'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all',
        active
          ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold'
          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
      );
    const filteredCategories = categories.filter((cat) =>
      cat.name.toLowerCase().includes(categoryQuery.trim().toLowerCase())
    );
    const visibleCategories = showAllCategories ? filteredCategories : filteredCategories.slice(0, 8);
    return (
    <div>
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            <Filter className="h-4 w-4 text-amber-500" />
            Filter Products
            {activeFilterCount > 0 && (
              <Badge className="bg-amber-500 text-[10px] text-slate-950">{activeFilterCount}</Badge>
            )}
          </h3>
          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
            >
              <RefreshCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>
      )}

      <Accordion
        type="multiple"
        value={openFilters}
        onValueChange={setOpenFilters}
        className="w-full"
      >
        {/* 1. Categories */}
        <AccordionItem value="cat" className="border-b border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
            <span className={sectionLabel}><Tag className={sectionIcon} /> Categories{categories.length > 0 ? ` (${categories.length})` : ''}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1">
              <Input
                aria-label="Search categories"
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                placeholder="Search categories…"
                className="mb-2 h-8 rounded-xl text-xs"
              />
              <button
                onClick={() => handleCategorySelect('')}
                aria-pressed={!selectedCategory}
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
              {visibleCategories.map((cat) => {
                const isSelected = selectedCategory === cat._id || selectedCategory === cat.slug;
                const count = categoryCounts[cat._id];
                const disabled = count === 0 && !isSelected;
                return (
                  <button
                    key={cat._id}
                    onClick={() => { if (!disabled) handleCategorySelect(cat._id); }}
                    aria-pressed={isSelected}
                    disabled={disabled}
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition-colors',
                      disabled
                        ? 'opacity-45 cursor-not-allowed'
                        : isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {typeof count === 'number' && (
                        <span className={cn('text-[10px] font-bold', isSelected ? 'text-slate-900/70' : 'text-slate-400')}>{count}</span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                );
              })}
              {filteredCategories.length > 8 && (
                <button
                  onClick={() => setShowAllCategories((v) => !v)}
                  className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  {showAllCategories ? 'Show less' : `Show all ${filteredCategories.length} categories`}
                </button>
              )}
              {filteredCategories.length === 0 && (
                <p className="px-3 py-2 text-[11px] text-slate-500">
                  {filtersLoaded ? `No categories match “${categoryQuery}”.` : 'Loading categories…'}
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Price */}
        <AccordionItem value="price" className="border-b border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
            <span className={sectionLabel}><IndianRupee className={sectionIcon} /> Price Range (₹)</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {PRICE_PRESETS.map((preset, idx) => {
                  const active =
                    String(preset.min ?? '') === minPriceInput &&
                    String(preset.max ?? '') === maxPriceInput;
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePricePreset(preset.min, preset.max)}
                      aria-pressed={active}
                      className={cn(
                        'text-[11px] font-bold p-1.5 rounded-lg border transition-colors bg-white dark:bg-slate-900',
                        active
                          ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500 hover:text-amber-600'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Min</span>
                  <span className="font-mono">₹{Number(minPriceInput) || priceBounds.min}</span>
                </label>
                <input
                  type="range"
                  aria-label="Minimum price slider"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={50}
                  value={Number(minPriceInput) || priceBounds.min}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMinPriceInput(v <= priceBounds.min ? '' : String(v));
                  }}
                  onPointerUp={handlePriceApply}
                  onKeyUp={(e) => { if (e.key === 'Enter') handlePriceApply(); }}
                  className="w-full accent-amber-500"
                />
                <label className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Max</span>
                  <span className="font-mono">₹{Number(maxPriceInput) || priceBounds.max}</span>
                </label>
                <input
                  type="range"
                  aria-label="Maximum price slider"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={50}
                  value={Number(maxPriceInput) || priceBounds.max}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setMaxPriceInput(v >= priceBounds.max ? '' : String(v));
                  }}
                  onPointerUp={handlePriceApply}
                  onKeyUp={(e) => { if (e.key === 'Enter') handlePriceApply(); }}
                  className="w-full accent-amber-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  aria-label="Minimum price"
                  placeholder="Min ₹"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  onBlur={handlePriceApply}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePriceApply(); }}
                  className="text-xs h-8 rounded-xl"
                />
                <span className="text-xs text-slate-400 font-bold">-</span>
                <Input
                  type="number"
                  aria-label="Maximum price"
                  placeholder="Max ₹"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  onBlur={handlePriceApply}
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
            <span className={sectionLabel}><Ruler className={sectionIcon} /> Size {selectedSizes.length > 0 ? `(${selectedSizes.length})` : ''}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.map((sz) => {
                const isSelected = selectedSizes.includes(sz);
                const count = sizeCounts[sz];
                const noStock = count === 0;
                return (
                  <button
                    key={sz}
                    onClick={() => handleSizeToggle(sz)}
                    aria-pressed={isSelected}
                    title={typeof count === 'number' ? (count === 0 ? `${sz} — no products` : `${sz} — ${count} products`) : sz}
                    className={cn(
                      'h-8 min-w-[36px] px-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1',
                      noStock && !isSelected
                        ? 'opacity-45 cursor-not-allowed border-slate-200 dark:border-slate-800'
                        : isSelected
                          ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                    )}
                    disabled={noStock && !isSelected}
                  >
                    <span>{sz}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    {!isSelected && typeof count === 'number' && count > 0 && <span className="text-[9px] text-slate-400 font-semibold">{count}</span>}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Color */}
        <AccordionItem value="color" className="border-b border-slate-200 dark:border-slate-800">
          <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
            <span className={sectionLabel}><Palette className={sectionIcon} /> Color {selectedColors.length > 0 ? `(${selectedColors.length})` : ''}</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c) => {
                const isSelected = selectedColors.includes(c.name);
                const count = colorCounts[c.name];
                const noStock = count === 0;
                return (
                  <button
                    key={c.name}
                    onClick={() => handleColorToggle(c.name)}
                    aria-pressed={isSelected}
                    disabled={noStock && !isSelected}
                    title={typeof count === 'number' ? (count === 0 ? `${c.name} — no products` : `${c.name} — ${count} products`) : c.name}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all',
                      noStock && !isSelected
                        ? 'opacity-45 cursor-not-allowed border-slate-200 dark:border-slate-800'
                        : isSelected
                          ? 'border-amber-500 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    )}
                  >
                    <span className="w-3 h-3 rounded-full border border-slate-400" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                    {!isSelected && typeof count === 'number' && count > 0 && <span className="text-[9px] text-slate-400 font-semibold">{count}</span>}
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5-8. Fit / Fabric / Pattern / Occasion — always rendered */}
        {[
          { title: 'Fit', options: availableFits, key: 'fit' as const, current: selectedFits, set: setSelectedFits, Icon: Shirt },
          { title: 'Fabric', options: availableFabrics, key: 'fabric' as const, current: selectedFabrics, set: setSelectedFabrics, Icon: Layers },
          { title: 'Pattern', options: availablePatterns, key: 'pattern' as const, current: selectedPatterns, set: setSelectedPatterns, Icon: Shapes },
          { title: 'Occasion', options: availableOccasions, key: 'occasion' as const, current: selectedOccasions, set: setSelectedOccasions, Icon: PartyPopper },
        ].map((group) => (
          <AccordionItem key={group.key} value={group.key} className="border-b border-slate-200 dark:border-slate-800">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-wider hover:no-underline py-3">
              <span className={sectionLabel}>
                <group.Icon className={sectionIcon} />
                {group.title} {group.current.length > 0 ? `(${group.current.length})` : ''}
              </span>
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
            <span className={sectionLabel}><Star className={sectionIcon} /> Rating &amp; Offers</span>
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
            <span className={sectionLabel}><Award className={sectionIcon} /> Badges {selectedBadges.length > 0 ? `(${selectedBadges.length})` : ''}</span>
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
      {/* Desktop filter rail — page scrolls, no nested scroll trap */}
      <aside className="hidden h-fit lg:col-span-1 lg:block lg:sticky lg:top-24">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/60">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile FILTER | SORT bar (doc §7) */}
      <div className="lg:hidden col-span-1 grid grid-cols-2 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden sticky top-16 z-30 bg-white dark:bg-slate-900 shadow-sm">
        <button
          ref={filterTriggerRef}
          onClick={() => setShowMobileSidebar(true)}
          aria-expanded={showMobileSidebar}
          aria-controls="filter-drawer"
          className="py-3 text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 border-r border-slate-200 dark:border-slate-800"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
          Filter
          {hasActiveFilters && (
            <Badge className="bg-amber-500 text-slate-950 text-[10px]">{activeFilterCount}</Badge>
          )}
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

      {/* Mobile full-height filter sheet */}
      {showMobileSidebar && (
        <div
          id="filter-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
          className="fixed inset-0 z-[60] lg:hidden"
        >
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div>
                <p className="text-sm font-extrabold tracking-tight text-slate-950 dark:text-slate-100">Filters</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activeFilterCount} active · {pagination.total} results
                </p>
              </div>
              <button
                onClick={() => setShowMobileSidebar(false)}
                aria-label="Close filters"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {activeChips.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {activeChips.map((chip) => (
                    <ActiveFilterChip
                      key={`drawer-${chip.key}`}
                      label={chip.label}
                      value={chip.value}
                      onRemove={chip.onRemove}
                    />
                  ))}
                </div>
              )}
              <SidebarContent embedded />
            </div>

            <div className="flex gap-2 border-t border-slate-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-900">
              <Button
                variant="outline"
                onClick={handleClearAllFilters}
                disabled={!hasActiveFilters}
                className="flex-1 rounded-xl text-xs font-bold"
              >
                Clear all
              </Button>
              <Button
                onClick={() => setShowMobileSidebar(false)}
                className="flex-[1.4] rounded-xl bg-slate-950 text-xs font-extrabold text-white hover:bg-amber-500 hover:text-slate-950"
              >
                Show {pagination.total} results
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Main Grid Content */}
      <section aria-label="Product results" className="lg:col-span-3 space-y-6">
        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div
            role="region"
            aria-label="Active filters"
            className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3"
          >
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Active Filters:
            </span>
            {activeChips.map((chip) => (
              <ActiveFilterChip
                key={chip.key}
                label={chip.label}
                value={chip.value}
                onRemove={chip.onRemove}
              />
            ))}
            <button
              onClick={handleClearAllFilters}
              className="ml-auto text-xs font-extrabold text-rose-600 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Header Bar with Sort and Shortcuts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {activeCategoryObj ? activeCategoryObj.name : 'Mentoos Products'}
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5" aria-live="polite">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} products
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Select
              value={`${searchParams.get('sort') || 'createdAt'}-${searchParams.get('order') || 'desc'}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger aria-label="Sort products" className="w-[180px] rounded-xl text-xs font-semibold">
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
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center dark:border-slate-800 dark:bg-slate-900/40">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm dark:bg-slate-800">
              <SearchX className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-slate-100">
              No products match these filters
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Try removing a filter, widening the price range, or start from a category.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                onClick={handleClearAllFilters}
                className="rounded-xl bg-slate-950 text-xs font-bold text-white hover:bg-amber-500 hover:text-slate-950"
              >
                Clear all filters
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/categories')}
                className="rounded-xl text-xs font-bold"
              >
                Browse categories
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            {loading && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
                <span className="rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
                  Updating results…
                </span>
              </div>
            )}
            <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6', loading && 'opacity-60')}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Mobile load-more: append instead of jumping pages */}
            {pagination.page < pagination.pages && (
              <div className="pt-6 sm:hidden">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs py-3 hover:bg-amber-400 disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : `Load more products (${Math.max(0, pagination.total - products.length)} left)`}
                </Button>
              </div>
            )}

            {/* Pagination Controls (desktop/tablet) */}
            {pagination.pages > 1 && (
              <div className="hidden sm:flex flex-wrap items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  onMouseEnter={() => prefetchPage(pagination.page - 1)}
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
                        onMouseEnter={() => prefetchPage(pageNum)}
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
                  onMouseEnter={() => prefetchPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded-xl text-xs font-bold"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <KeyboardShortcutsModal open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen} />
    </div>
  );
}
