'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { productsApi, ProductFilters } from '@/lib/api/products';
import type { IProduct, ICategory } from '@/lib/api/types';
import { categoriesApi } from '@/lib/api/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Filter, Copy, Loader2, Upload, Download, Layers3 } from 'lucide-react';
import { productImportApi } from '@/lib/api/productImport';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { KeyboardShortcutsModal } from '@/components/admin/KeyboardShortcutsModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading products…</div>}>
      <AdminProductsContent />
    </Suspense>
  );
}

function AdminProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: IProduct | null }>({
    open: false,
    product: null,
  });
  const [duplicateDialog, setDuplicateDialog] = useState<{ open: boolean; product: IProduct | null; loading: boolean }>({
    open: false,
    product: null,
    loading: false,
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkPricePct, setBulkPricePct] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [categories, setCategories] = useState<ICategory[]>([]);
  
  // Cache for product counts with timestamp
  const [countsCache, setCountsCache] = useState<{
    data: Record<string, number>;
    timestamp: number;
  }>({ data: {}, timestamp: 0 });
  
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await productImportApi.exportCatalogue({
        status: filters.status,
        search: filters.search,
        category: (filters as any).category,
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `mentoos-products-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Export ready', description: 'The filtered catalogue has been downloaded.' });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error?.response?.data?.error || error?.message || 'Could not export the catalogue.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getProducts(filters);
      setProducts(response.data);
      setPagination(response.pagination);
      
      // Invalidate cache when products change (e.g., after create/delete)
      // This ensures counts stay accurate
      setCountsCache({ data: {}, timestamp: 0 });
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bulkOpen || categories.length > 0) return;
    categoriesApi.getCategories('active')
      .then((response) => setCategories(response.data || []))
      .catch(() => setCategories([]));
  }, [bulkOpen, categories.length]);

  const flatCategories = (() => {
    const out: Array<{ id: string; name: string; depth: number }> = [];
    const walk = (list: ICategory[], depth = 0) => {
      for (const category of list || []) {
        out.push({ id: category._id, name: category.name, depth });
        if (category.children?.length) walk(category.children, depth + 1);
      }
    };
    walk(categories);
    return out;
  })();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const pageIds = products.map((product) => product._id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : pageIds);
  };

  const applyBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    const hasStatus = Boolean(bulkStatus);
    const hasCategory = Boolean(bulkCategory);
    const pricePct = bulkPricePct.trim() === '' ? null : Number(bulkPricePct);
    const stockValue = bulkStock.trim() === '' ? null : Number(bulkStock);

    if (!hasStatus && !hasCategory && pricePct === null && stockValue === null) {
      toast({ title: 'Nothing to update', description: 'Choose at least one bulk change.', variant: 'destructive' });
      return;
    }
    if (pricePct !== null && !Number.isFinite(pricePct)) {
      toast({ title: 'Invalid price change', description: 'Use a number, e.g. -10 or 15.', variant: 'destructive' });
      return;
    }
    if (stockValue !== null && (!Number.isInteger(stockValue) || stockValue < 0)) {
      toast({ title: 'Invalid stock', description: 'Stock must be a whole number >= 0.', variant: 'destructive' });
      return;
    }

    setBulkSaving(true);
    try {
      const updates = selectedIds.map((id) => {
        const product = products.find((p) => p._id === id);
        const data: Partial<IProduct> = {};
        if (hasStatus) data.status = bulkStatus as IProduct['status'];
        if (hasCategory) data.category = bulkCategory;
        if (pricePct !== null && product) {
          data.price = Math.max(0, Math.round(product.price * (1 + pricePct / 100)));
        }
        if (stockValue !== null) data.stock = stockValue;
        return productsApi.updateProduct(id, data);
      });
      const results = await Promise.allSettled(updates);
      const failed = results.filter((result) => result.status === 'rejected').length;
      const updated = results.length - failed;
      toast({
        title: failed > 0 ? `${updated} updated, ${failed} failed` : `${updated} products updated`,
        description: failed > 0 ? 'Some products could not be updated. Check variant stock rules.' : 'Bulk edit applied.',
        variant: failed > 0 ? 'destructive' : undefined,
      });
      setSelectedIds([]);
      setBulkOpen(false);
      setBulkStatus('');
      setBulkCategory('');
      setBulkPricePct('');
      setBulkStock('');
      await fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Bulk edit failed',
        description: error?.response?.data?.error || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBulkSaving(false);
    }
  };

  useEffect(() => {
    // Read filters from URL params
    const status = searchParams.get('status');
    const lowStock = searchParams.get('lowStock');
    const recent = searchParams.get('recent');
    const page = searchParams.get('page');
    const search = searchParams.get('search');
    
    // When status is 'all' or not provided, don't filter by status (show all)
    // This allows admin/superadmin to see all products regardless of status
    const statusFilter = status && status !== 'all' ? status : undefined;
    
    setFilters({
      page: page ? parseInt(page) : 1,
      limit: 20,
      status: statusFilter,
      search: search || undefined,
      lowStock: lowStock === 'true',
      recent: recent === 'true',
    });
    
    // Update search query from URL
    if (search) {
      setSearchQuery(search);
    } else {
      setSearchQuery('');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  // Fetch status counts with caching
  useEffect(() => {
    const fetchStatusCounts = async () => {
      const now = Date.now();
      
      // Check if cache is still valid
      if (countsCache.timestamp && (now - countsCache.timestamp) < CACHE_DURATION && Object.keys(countsCache.data).length > 0) {
        setStatusCounts(countsCache.data);
        return;
      }
      
      try {
        const statuses = ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued'];
        const counts: Record<string, number> = {};
        
        // Fetch all products count
        const allResponse = await productsApi.getProducts({ limit: 1 });
        counts.all = allResponse.pagination.total;
        
        // Fetch counts for each status
        for (const status of statuses) {
          const response = await productsApi.getProducts({ status, limit: 1 });
          counts[status] = response.pagination.total;
        }
        
        // Fetch low stock and recent counts
        try {
          const lowStockResponse = await productsApi.getProducts({ lowStock: true, limit: 1 });
          counts.lowStock = lowStockResponse.pagination.total;
        } catch (error) {
          counts.lowStock = 0;
        }
        
        try {
          const recentResponse = await productsApi.getProducts({ recent: true, limit: 1 });
          counts.recent = recentResponse.pagination.total;
        } catch (error) {
          counts.recent = 0;
        }
        
        // Update cache and state
        setCountsCache({ data: counts, timestamp: now });
        setStatusCounts(counts);
      } catch (error) {
        console.error('Failed to fetch status counts:', error);
      }
    };
    
    fetchStatusCounts();
  }, [countsCache.timestamp, CACHE_DURATION]);

  const handleDelete = async () => {
    if (!deleteDialog.product) return;

    try {
      await productsApi.deleteProduct(deleteDialog.product._id);
      setDeleteDialog({ open: false, product: null });
      // Invalidate cache on delete
      setCountsCache({ data: {}, timestamp: 0 });
      fetchProducts();
      toast({
        title: 'Product Deleted',
        description: 'Product has been successfully deleted.',
      });
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateDialog.product) return;

    setDuplicateDialog((prev) => ({ ...prev, loading: true }));
    try {
      const response = await productsApi.duplicateProduct(duplicateDialog.product._id);
      setDuplicateDialog({ open: false, product: null, loading: false });
      // Invalidate cache on duplicate
      setCountsCache({ data: {}, timestamp: 0 });
      fetchProducts();
      toast({
        title: 'Product Duplicated',
        description: `Created "${response.data.product.name}" as a draft.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/products/${response.data.product._id}`)}
          >
            Edit
          </Button>
        ),
      });
    } catch (error: any) {
      console.error('Failed to duplicate product:', error);
      setDuplicateDialog((prev) => ({ ...prev, loading: false }));
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to duplicate product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    params.set('page', '1'); // Reset to first page on new search
    router.push(`/admin/products?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/admin/products?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      discontinued: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };
    return (
      <span
        className={`px-2 py-1 text-[11px] font-semibold rounded-full ${styles[status] || styles.inactive}`}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const currentStatus = searchParams?.get('status') || 'all';
  const currentLowStock = searchParams?.get('lowStock');
  const currentRecent = searchParams?.get('recent');

  // Determine current filter value for select
  const getCurrentFilterValue = () => {
    if (currentLowStock === 'true') return 'lowStock';
    if (currentRecent === 'true') return 'recent';
    return currentStatus;
  };

  const handleStatusChange = (value: string, showToast = false) => {
    const params = new URLSearchParams();
    let filterName = '';
    
    if (value === 'lowStock') {
      params.set('lowStock', 'true');
      filterName = 'Low Stock';
    } else if (value === 'recent') {
      params.set('recent', 'true');
      filterName = 'Recently Added';
    } else if (value && value !== 'all') {
      params.set('status', value);
      filterName = value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
    } else {
      filterName = 'All Products';
    }
    
    // Preserve search query
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    
    if (showToast) {
      toast({
        title: 'Filter Changed',
        description: `Showing ${filterName} products`,
        duration: 2000,
      });
    }
    
    router.push(`/admin/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + D for drafts
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleStatusChange('draft', true);
      }
      
      // Ctrl/Cmd + A for all products
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleStatusChange('all', true);
      }
      
      // Ctrl/Cmd + L for low stock
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleStatusChange('lowStock', true);
      }
      
      // Ctrl/Cmd + R for recent
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleStatusChange('recent', true);
      }
      
      // Ctrl/Cmd + N for new product
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        router.push('/admin/products/new');
        toast({
          title: 'Creating New Product',
          description: 'Opening product creation form...',
          duration: 2000,
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, router]);

  const allSelected = products.length > 0 && products.every((product) => selectedIds.includes(product._id));

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Link href="/admin/products/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV/XLSX
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Select value={getCurrentFilterValue()} onValueChange={(value) => handleStatusChange(value, false)}>
                    <SelectTrigger aria-label="Filter products by status" className="w-[180px]">
                      <SelectValue placeholder="Filter products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="draft">Drafts</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="discontinued">Discontinued</SelectItem>
                      <SelectItem value="lowStock">Low Stock</SelectItem>
                      <SelectItem value="recent">Recently Added</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold">Keyboard Shortcuts:</p>
                  <p>Ctrl/Cmd + A: All Products</p>
                  <p>Ctrl/Cmd + D: Drafts</p>
                  <p>Ctrl/Cmd + L: Low Stock</p>
                  <p>Ctrl/Cmd + R: Recently Added</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found</p>
          <Link href="/admin/products/new">
            <Button className="mt-4">Create your first product</Button>
          </Link>
        </div>
      ) : (
        <>
          {selectedIds.length > 0 && (
            <div className="sticky top-2 z-30 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <Layers3 className="h-4 w-4" />
                {selectedIds.length} selected
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="h-8 bg-slate-950 text-xs text-white hover:bg-amber-500 hover:text-slate-950" onClick={() => setBulkOpen(true)}>
                  Bulk edit
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setSelectedIds([])}>
                  Clear selection
                </Button>
              </div>
            </div>
          )}
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                    <AdminTableHead className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all products on this page"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                      />
                    </AdminTableHead>
                    <AdminTableHead>Image</AdminTableHead>
                    <AdminTableHead>Name</AdminTableHead>
                    <AdminTableHead>SKU</AdminTableHead>
                    <AdminTableHead>Price</AdminTableHead>
                    <AdminTableHead>Stock</AdminTableHead>
                    <AdminTableHead>Status</AdminTableHead>
                    <AdminTableHead className="text-right">Actions</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
                  {products.map((product) => (
                    <AdminTableRow key={product._id} className={selectedIds.includes(product._id) ? 'bg-amber-50/60' : ''}>
                      <AdminTableCell>
                        <input
                          type="checkbox"
                          aria-label={`Select ${product.name}`}
                          checked={selectedIds.includes(product._id)}
                          onChange={() => toggleSelect(product._id)}
                          className="h-4 w-4 rounded border-slate-300 accent-amber-500"
                        />
                      </AdminTableCell>
                      <AdminTableCell>
                        {product.images && product.images.length > 0 ? (() => {
                          // Handle both string and object formats for images
                          const firstImage = product.images[0];
                          const imageUrl = typeof firstImage === 'string' 
                            ? firstImage 
                            : firstImage?.url || '';
                          
                          if (!imageUrl) {
                            return (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">No image</span>
                              </div>
                            );
                          }
                          
                          // Convert backend URL to frontend proxy URL if needed
                          let displayUrl = imageUrl;
                          if (imageUrl.includes('/uploads/')) {
                            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                              // Full backend URL - extract path and convert to frontend proxy
                              const urlObj = new URL(imageUrl);
                              displayUrl = `/api/images${urlObj.pathname}`;
                            } else if (imageUrl.startsWith('/uploads/')) {
                              // Relative backend path - convert to frontend proxy
                              displayUrl = `/api/images${imageUrl}`;
                            }
                            // If it already starts with /api/images, keep it as is
                          }
                          
                          return (
                            <img
                              src={displayUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                // Fallback to placeholder on error
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-12 h-12 bg-muted rounded flex items-center justify-center"><span class="text-xs text-muted-foreground">No image</span></div>';
                                }
                              }}
                            />
                          );
                        })() : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )}
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="max-w-[220px]">
                          <div className="font-medium truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {product.description}
                          </div>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell className="font-mono text-xs max-w-[140px] truncate">{product.sku}</AdminTableCell>
                      <AdminTableCell className="font-medium whitespace-nowrap">
                        ${product.price.toFixed(2)}
                      </AdminTableCell>
                      <AdminTableCell>{product.stock}</AdminTableCell>
                      <AdminTableCell>{getStatusBadge(product.status)}</AdminTableCell>
                      <AdminTableCell className="text-right">
                        <RowActions
                          label={`Actions for ${product.name}`}
                          items={[
                            {
                              label: 'Edit product',
                              icon: <Edit className="h-3.5 w-3.5 mr-2" />,
                              onSelect: () => router.push(`/admin/products/${product._id}`),
                            },
                            {
                              label: 'Duplicate product',
                              icon: <Copy className="h-3.5 w-3.5 mr-2" />,
                              onSelect: () =>
                                setDuplicateDialog({ open: true, product, loading: false }),
                            },
                            {
                              label: 'Delete product',
                              icon: <Trash2 className="h-3.5 w-3.5 mr-2" />,
                              danger: true,
                              onSelect: () =>
                                setDeleteDialog({ open: true, product }),
                            },
                          ]}
                        />
                      </AdminTableCell>
                    </AdminTableRow>
                  ))}
            </AdminTableBody>
          </AdminTable>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.product?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Confirmation Dialog */}
      <AlertDialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog({ open, product: null, loading: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Product</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a copy of &quot;{duplicateDialog.product?.name}&quot; including all variants, attributes, and images.
              <br /><br />
              The duplicate will be created as a <strong>draft</strong> with a new unique SKU.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={duplicateDialog.loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicate} disabled={duplicateDialog.loading}>
              {duplicateDialog.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Duplicating...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk edit {selectedIds.length} products</DialogTitle>
            <DialogDescription>
              Only the fields you set here will change. Leave a field blank to keep it as-is.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="bulk-status">Status</Label>
              <select
                id="bulk-status"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">No change</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            <div>
              <Label htmlFor="bulk-category">Category</Label>
              <select
                id="bulk-category"
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">No change</option>
                {flatCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {'— '.repeat(category.depth)}{category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bulk-price">Price change (%)</Label>
                <Input
                  id="bulk-price"
                  type="number"
                  placeholder="e.g. -10"
                  value={bulkPricePct}
                  onChange={(e) => setBulkPricePct(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label htmlFor="bulk-stock">Set stock</Label>
                <Input
                  id="bulk-stock"
                  type="number"
                  min={0}
                  placeholder="e.g. 50"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                  className="mt-1 h-9"
                />
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Products with variants derive stock and price from their variant SKUs; use the variant editor for those.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)} disabled={bulkSaving}>
              Cancel
            </Button>
            <Button
              onClick={applyBulkEdit}
              disabled={bulkSaving || selectedIds.length === 0}
              className="bg-slate-950 text-white hover:bg-amber-500 hover:text-slate-950"
            >
              {bulkSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying…</> : 'Apply to selected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen} />
    </div>
  );
}

