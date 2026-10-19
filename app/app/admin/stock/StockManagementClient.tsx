'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, ProductFilters } from '@/lib/api/products';
import type { IProduct } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, AlertTriangle, TrendingDown, TrendingUp, Edit, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';

export default function StockManagementClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 50, // Show more items for stock management
    sort: 'stock',
    order: 'asc', // Sort by stock ascending (low stock first)
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [stockStats, setStockStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadProducts();
  }, [filters]);

  useEffect(() => {
    calculateStats();
  }, [products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getProducts(filters);
      setProducts(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats = {
      total: products.length,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
    };

    products.forEach((product) => {
      stats.totalValue += product.stock * product.price;
      if (product.stock === 0) {
        stats.outOfStock++;
      } else if (product.stock <= 10) {
        stats.lowStock++;
      } else {
        stats.inStock++;
      }
    });

    setStockStats(stats);
  };

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchQuery || undefined,
      page: 1,
    }));
  };

  const handleFilterChange = (filterType: 'all' | 'lowStock' | 'outOfStock' | 'inStock') => {
    const newFilters: ProductFilters = {
      ...filters,
      page: 1,
    };

    switch (filterType) {
      case 'lowStock':
        newFilters.lowStock = true;
        break;
      case 'outOfStock':
        newFilters.status = 'out_of_stock';
        break;
      case 'inStock':
        newFilters.status = 'active';
        break;
      default:
        delete newFilters.lowStock;
        delete newFilters.status;
    }

    setFilters(newFilters);
  };

  const getImageUrl = (image: string | { url: string; altText?: string }): string => {
    if (typeof image === 'string') return image;
    return image.url;
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive" className="text-[11px]">Out of Stock</Badge>;
    } else if (stock <= 10) {
      return <Badge variant="outline" className="border-orange-500 text-orange-700 dark:text-orange-400 text-[11px]">Low Stock</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[11px]">In Stock</Badge>;
    }
  };

  return (
    <div className="px-3 py-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Management
          </h1>
          <p className="text-muted-foreground mt-1">Monitor and manage product inventory levels</p>
        </div>
        <Button onClick={loadProducts} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stock Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              In Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stockStats.inStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stockStats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stockStats.outOfStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stockStats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>View and manage stock levels for all products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={!filters.lowStock && !filters.status ? 'default' : 'outline'}
                onClick={() => handleFilterChange('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filters.lowStock ? 'default' : 'outline'}
                onClick={() => handleFilterChange('lowStock')}
                size="sm"
              >
                Low Stock
              </Button>
              <Button
                variant={filters.status === 'out_of_stock' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('outOfStock')}
                size="sm"
              >
                Out of Stock
              </Button>
              <Button
                variant={filters.status === 'active' && !filters.lowStock ? 'default' : 'outline'}
                onClick={() => handleFilterChange('inStock')}
                size="sm"
              >
                In Stock
              </Button>
            </div>
          </div>

          {/* Products Table */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div>
              <AdminTable>
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead>Image</AdminTableHead>
                    <AdminTableHead>Product Name</AdminTableHead>
                    <AdminTableHead>SKU</AdminTableHead>
                    <AdminTableHead>Price</AdminTableHead>
                    <AdminTableHead>Stock Level</AdminTableHead>
                    <AdminTableHead>Status</AdminTableHead>
                    <AdminTableHead>Stock Value</AdminTableHead>
                    <AdminTableHead className="text-right">Actions</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {products.map((product) => (
                    <AdminTableRow key={product._id}>
                      <AdminTableCell>
                        {product.images && product.images.length > 0 ? (
                          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={getImageUrl(product.images[0])}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="font-medium truncate max-w-[220px]">{product.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                          {product.description}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell className="font-mono text-xs">{product.sku}</AdminTableCell>
                      <AdminTableCell className="font-medium whitespace-nowrap">${product.price.toFixed(2)}</AdminTableCell>
                      <AdminTableCell>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="text-lg font-bold">{product.stock}</span>
                          <span className="text-xs text-muted-foreground">units</span>
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>{getStockBadge(product.stock)}</AdminTableCell>
                      <AdminTableCell className="font-medium whitespace-nowrap">
                        ${(product.stock * product.price).toFixed(2)}
                      </AdminTableCell>
                      <AdminTableCell className="text-right">
                        <RowActions
                          label={`Actions for ${product.name}`}
                          items={[
                            {
                              label: 'Edit',
                              icon: <Edit className="h-3.5 w-3.5 mr-2" />,
                              onSelect: () => router.push(`/admin/products/${product._id}`),
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
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} products
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

