'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, 
  X, 
  TrendingUp, 
  Clock, 
  Tag, 
  Sparkles, 
  ArrowRight,
  Filter,
  ChevronRight,
  Layers,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import type { ICategory } from '@/lib/api/types';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  'Oversized T-Shirt',
  'Black Linen Shirt',
  'Cargo Joggers',
  'Slim Fit Trousers',
  'Nehru Jacket',
  'Festive Kurta',
  'Gym Vest',
  'Printed Casual Shirt',
];

const RECENT_SEARCHES_KEY = 'mentoos_recent_searches';

interface ParsedQuery {
  cleanQuery: string;
  correctedQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  isSku?: boolean;
}

// Common spelling mistakes → correction (fuzzy search without backend change)
const TYPO_MAP: Record<string, string> = {
  shrit: 'shirt', shrits: 'shirts', teshirt: 't-shirt', tshirt: 't-shirt', tee: 't-shirt',
  trouser: 'trousers', trouzers: 'trousers', jins: 'jeans', jens: 'jeans',
  joger: 'joggers', jogger: 'joggers', joggerss: 'joggers', kurta: 'kurta', kurtha: 'kurta',
  jaket: 'jacket', jakcet: 'jacket', shooes: 'shoes', blak: 'black', balck: 'black',
  whiet: 'white', gren: 'green', bleu: 'blue', grayy: 'grey', overcoat: 'coat',
  sweatshirt: 'sweatshirt', swetshirt: 'sweatshirt', hoodie: 'hoodie', hodie: 'hoodie',
  ethinic: 'ethnic', formel: 'formal', casuel: 'casual', linen: 'linen', coton: 'cotton',
};

const KNOWN_COLORS_SMART = ['black', 'white', 'navy', 'beige', 'maroon', 'green', 'grey', 'gray', 'blue', 'red', 'beige', 'brown', 'olive', 'khaki'];

function correctTypos(q: string): { corrected: string; changed: boolean } {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  let changed = false;
  const fixed = words.map((w) => {
    const clean = w.replace(/[^a-z0-9-]/g, '');
    if (TYPO_MAP[clean]) {
      changed = true;
      return TYPO_MAP[clean];
    }
    return w;
  });
  return { corrected: fixed.join(' '), changed };
}

function looksLikeSku(q: string): boolean {
  const t = q.trim();
  // e.g. MT-TSH-001, SKU12345, ABC-123 — short alphanumeric with dash/digits
  return /^[a-z0-9]{2,}-[a-z0-9-]{2,}$/i.test(t) || (/^[a-z0-9-]{5,}$/i.test(t) && /\d/.test(t) && t.split(/\s+/).length === 1);
}

function parseNaturalQuery(rawQuery: string): ParsedQuery {
  let clean = rawQuery.trim().replace(/\s+/g, ' ');
  let maxPrice: number | undefined = undefined;
  let minPrice: number | undefined = undefined;

  const underMatch = clean.match(/(?:under|below|<|less than)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (underMatch) {
    maxPrice = parseInt(underMatch[1], 10);
    clean = clean.replace(underMatch[0], '').trim();
  }

  const aboveMatch = clean.match(/(?:above|over|>|more than)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i);
  if (aboveMatch) {
    minPrice = parseInt(aboveMatch[1], 10);
    clean = clean.replace(aboveMatch[0], '').trim();
  }

  // Bare price talk without under/above: "vest price 999", "shirt with 999",
  // "tee at 999", "kurta around 1500" → treat as max-price intent so the
  // number never becomes a dead text token that zeroes the results.
  if (maxPrice === undefined && minPrice === undefined) {
    const barePrice = clean.match(/(?:price|with(?:in)?|at|around|about|below)\s*(?:rs\.?|inr|₹)?\s*(\d{3,6})/i);
    if (barePrice) {
      maxPrice = parseInt(barePrice[1], 10);
      clean = clean.replace(barePrice[0], '').trim();
    }
  }

  // Detect color token: "Black Shirt" → color=Black, keep full query for token search
  const lower = ` ${clean.toLowerCase()} `;
  const foundColor = KNOWN_COLORS_SMART.find((c) => lower.includes(` ${c} `));
  const color =
    foundColor === 'gray' || foundColor === 'grey'
      ? 'Grey'
      : foundColor
        ? foundColor.charAt(0).toUpperCase() + foundColor.slice(1)
        : undefined;

  // Typo-tolerant correction
  const { corrected, changed } = correctTypos(clean);

  return { cleanQuery: changed ? corrected : clean, correctedQuery: changed ? corrected : undefined, minPrice, maxPrice, color, isSku: looksLikeSku(clean) };
}

export function SmartSearchModal({ isOpen, onClose }: SmartSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [matchingCategories, setMatchingCategories] = useState<ICategory[]>([]);
  const [allCategories, setAllCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [parsed, setParsed] = useState<ParsedQuery>({ cleanQuery: '' });
  const [fallbackNote, setFallbackNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Stale-guard: rapid typing fires overlapping debounced requests; only the
  // latest may write results (gap #3).
  const searchSeq = useRef(0);

  // Load categories and recent searches
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (e) {
      console.warn('Could not load recent searches:', e);
    }

    async function loadAllCats() {
      try {
        const res = await categoriesApi.getCategories('active');
        if (res.data) {
          setAllCategories(res.data);
        }
      } catch (err: any) {
        // 404 means backend route missing or server not ready — degrade gracefully
        if (err?.response?.status === 404) {
          console.warn('Categories API returned 404 — check backend URL & route');
        } else {
          console.error('Error fetching categories for smart search:', err);
        }
        setAllCategories([]); // empty fallback so search still works
      }
    }
    loadAllCats();
  }, []);

  // Prefetch matched routes for instant navigation
  useEffect(() => {
    if (matchingCategories.length > 0) {
      matchingCategories.forEach((cat) => {
        router.prefetch(`/categories/${cat.slug}`);
      });
    }
    if (results.length > 0) {
      results.forEach((p) => {
        router.prefetch(`/products/${p._id}`);
      });
    }
  }, [matchingCategories, results, router]);

  // Focus input on open & handle body overflow
  useEffect(() => {
    if (isOpen) {
      setIsNavigating(false);
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search API fetch with quick debounce
  useEffect(() => {
    if (!query.trim()) {
      searchSeq.current++;
      setResults([]);
      setMatchingCategories([]);
      setParsed({ cleanQuery: '' });
      setFallbackNote(null);
      setLoading(false);
      return;
    }

    const parsedQuery = parseNaturalQuery(query);
    setParsed(parsedQuery);

    setLoading(true);
    const reqId = ++searchSeq.current;
    const timer = setTimeout(async () => {
      try {
        const searchTerm = parsedQuery.cleanQuery.toLowerCase();
        const tokens = searchTerm.split(/\s+/).filter(Boolean);

        // Match Categories — token-aware so "black shirt" matches "Shirts"
        const catMatches = allCategories.filter(c => {
          const hay = `${c.name} ${c.slug} ${c.description || ''}`.toLowerCase();
          return tokens.some((t) => hay.includes(t)) || hay.includes(searchTerm);
        });
        if (reqId !== searchSeq.current) return;
        setMatchingCategories(catMatches.slice(0, 6));

        // Fetch Matching Products — pass color when detected ("Black Shirt"),
        // backend tokenizes multi-word queries so order/extra words don't break it.
        const response = await productsApi.getProducts({
          search: parsedQuery.cleanQuery || undefined,
          color: parsedQuery.color,
          minPrice: parsedQuery.minPrice,
          maxPrice: parsedQuery.maxPrice,
          limit: 8,
          status: 'active',
        });
        if (reqId !== searchSeq.current) return;
        const rows = response.data || [];
        const fb = (response as any).fallback;
        if (reqId !== searchSeq.current) return;
        setFallbackNote(
          fb?.relaxed && rows.length > 0
            ? fb.strategy === 'popular' || fb.strategy === 'category'
              ? `No exact matches — showing popular picks${fb.appliedQuery ? ` for "${fb.appliedQuery}"` : ''}.`
              : `No exact matches — showing closest results${fb.appliedQuery ? ` for "${fb.appliedQuery}"` : ''}.`
            : null
        );
        // Client-side SKU exact-match boost mirrors the backend ranking so the
        // typed code surfaces first even inside the 8-row suggestion window.
        const rawQ = parsedQuery.cleanQuery.trim();
        if (rawQ && !rawQ.includes(' ') && /\d/.test(rawQ)) {
          const qLower = rawQ.toLowerCase();
          rows.sort((a: any, b: any) => {
            const aExact = String(a?.sku || '').toLowerCase() === qLower ? 0 : 1;
            const bExact = String(b?.sku || '').toLowerCase() === qLower ? 0 : 1;
            return aExact - bExact;
          });
        }
        setResults(rows);
      } catch (err) {
        if (reqId !== searchSeq.current) return;
        console.error('Smart search error:', err);
        setResults([]);
        setMatchingCategories([]);
        setFallbackNote(null);
      } finally {
        if (reqId === searchSeq.current) setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query, allCategories]);

  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    try {
      const updated = [searchTerm, ...recentSearches.filter((s) => s.toLowerCase() !== searchTerm.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent search:', e);
    }
  };

  const handleSelectSearch = (searchTerm: string) => {
    saveRecentSearch(searchTerm);
    setIsNavigating(true);
    onClose();
    import('@/lib/analytics').then((m) => m.funnel.search(searchTerm)).catch(() => {});
    // Carry smart-detected color + price into /search so View All / Enter
    // shows the same filtered set as the modal suggestions (gap #1).
    const pq = parseNaturalQuery(searchTerm);
    const sp = new URLSearchParams();
    sp.set('q', pq.cleanQuery || searchTerm.trim());
    if (pq.color) sp.set('color', pq.color);
    if (pq.minPrice !== undefined) sp.set('minPrice', String(pq.minPrice));
    if (pq.maxPrice !== undefined) sp.set('maxPrice', String(pq.maxPrice));
    startTransition(() => {
      router.push(`/search?${sp.toString()}`);
    });
  };

  const handleCategoryClick = (categorySlug: string, categoryName: string) => {
    saveRecentSearch(categoryName);
    setIsNavigating(true);
    onClose();
    startTransition(() => {
      router.push(`/categories/${categorySlug}`);
    });
  };

  const handleProductClick = (productId: string, productName: string) => {
    saveRecentSearch(productName);
    setIsNavigating(true);
    onClose();
    startTransition(() => {
      router.push(`/products/${productId}`);
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-16 px-3 sm:px-4 bg-slate-950/70 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {isNavigating || isPending ? (
            <Loader2 className="w-5 h-5 text-amber-500 mr-3 shrink-0 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-amber-500 mr-3 shrink-0 animate-pulse" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleSelectSearch(query);
              }
            }}
            placeholder="Search Mentoos for 'Shirts', 'Black Tee', 'Joggers under 999', 'Kurtas'..."
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base font-medium focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors mr-2"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-200/60 dark:bg-slate-800 rounded-lg transition-colors border border-slate-300/40 dark:border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Smart detection pills: price / color / SKU / typo */}
        {(parsed.maxPrice !== undefined || parsed.minPrice !== undefined || parsed.color || parsed.isSku || parsed.correctedQuery) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs font-medium text-amber-700 dark:text-amber-400 flex-wrap">
            <Filter className="w-3.5 h-3.5 shrink-0" />
            <span>Smart Search:</span>
            {parsed.maxPrice !== undefined && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                Max Price: ₹{parsed.maxPrice}
              </Badge>
            )}
            {parsed.minPrice !== undefined && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                Min Price: ₹{parsed.minPrice}
              </Badge>
            )}
            {parsed.color && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-amber-400 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                Color: {parsed.color}
              </Badge>
            )}
            {parsed.isSku && (
              <Badge variant="outline" className="bg-white dark:bg-slate-900 border-violet-400 text-violet-700 dark:text-violet-300 text-xs font-semibold">
                SKU / Product code search
              </Badge>
            )}
            {parsed.correctedQuery && (
              <span className="text-amber-700 dark:text-amber-300">
                Did you mean “<button className="underline font-bold" onClick={() => setQuery(parsed.correctedQuery || '')}>{parsed.correctedQuery}</button>”?
              </span>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* State 1: Empty Query - Show Recent & Popular Searches */}
          {!query.trim() && (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Recent Searches
                    </h4>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors font-semibold"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSearch(term)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 transition-all shadow-sm"
                      >
                        <span>{term}</span>
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-3">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  Popular Categories & Trends
                </h4>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSearch(term)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:border-amber-500 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* State 2: Query Typed - Structured Results */}
          {query.trim() && (
            <div className="space-y-6">
              {/* Category Matches */}
              {matchingCategories.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    Matching Categories ({matchingCategories.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {matchingCategories.map((cat) => (
                      <button
                        key={cat._id}
                        onMouseEnter={() => router.prefetch(`/categories/${cat.slug}`)}
                        onClick={() => handleCategoryClick(cat.slug, cat.name)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-sm"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Matches */}
              <div>
                {fallbackNote && !loading && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{fallbackNote}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    {loading ? 'Searching products...' : `Matching Products (${results.length})`}
                  </span>
                  <button
                    onClick={() => handleSelectSearch(query)}
                    className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    View All Results
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 animate-pulse bg-slate-50 dark:bg-slate-800/50">
                        <div className="w-16 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : results.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.map((product) => {
                      const firstImage = Array.isArray(product.images) && product.images.length > 0
                        ? typeof product.images[0] === 'string'
                          ? product.images[0]
                          : product.images[0]?.url || '/placeholder-product.jpg'
                        : '/placeholder-product.jpg';

                      const mrp = product.compareAtPrice || Math.round(product.price * 1.3);
                      const discount = Math.round(((mrp - product.price) / mrp) * 100);

                      return (
                        <div
                          key={product._id}
                          onMouseEnter={() => router.prefetch(`/products/${product._id}`)}
                          onClick={() => handleProductClick(product._id, product.name)}
                          className="group flex gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                            <Image
                              src={firstImage}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="64px"
                            />
                            {discount > 0 && (
                              <span className="absolute top-1 left-1 bg-rose-500 text-white text-[10px] font-extrabold px-1 py-0.5 rounded">
                                {discount}% OFF
                              </span>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                                {product.category?.name || 'Mentoos'}
                              </span>
                              <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                {product.name}
                              </h5>
                              {product.sku && (
                                <span className="text-[10px] font-mono text-slate-400">SKU: {product.sku}</span>
                              )}
                            </div>

                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                                ₹{product.price}
                              </span>
                              {mrp > product.price && (
                                <span className="text-[11px] text-slate-400 line-through">
                                  ₹{mrp}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      No matching Mentoos products found for "{query}".
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try searching for "T-Shirt", "Shirt", "Joggers", "Kurtas", or "Trousers".
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Mentoos Smart Search Active
          </span>
          {query.trim() && (
            <Button
              size="sm"
              onClick={() => handleSelectSearch(query)}
              className="bg-slate-900 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors"
            >
              See All Results ({results.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
