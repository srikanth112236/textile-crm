'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, AnalyticsData } from '@/lib/api/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';

export default function AnalyticsClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsApi.getAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error) || 'Failed to fetch analytics',
        variant: 'destructive',
      });
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span className="font-semibold">{Math.abs(growth).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">View comprehensive sales analytics and key metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">{formatPrice(analytics.overview.totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">All Time</span>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-2xl">{analytics.overview.totalOrders.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">All Time</span>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Order Value</CardDescription>
            <CardTitle className="text-2xl">{formatPrice(analytics.overview.averageOrderValue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Average</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">{analytics.overview.totalUsers.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Registered</span>
              <Users className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-2xl">{analytics.overview.totalProducts.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">In Catalog</span>
              <Package className="h-4 w-4 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Today</CardTitle>
            <CardDescription className="text-2xl font-bold">{formatPrice(analytics.revenue.today)}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue This Month</CardTitle>
            <CardDescription className="text-2xl font-bold">{formatPrice(analytics.revenue.thisMonth)}</CardDescription>
            {formatGrowth(analytics.revenue.growth)}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue This Year</CardTitle>
            <CardDescription className="text-2xl font-bold">{formatPrice(analytics.revenue.thisYear)}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Growth</CardTitle>
            <CardDescription className="flex items-center gap-2">
              {formatGrowth(analytics.revenue.growth)}
              <span className="text-sm text-muted-foreground">vs last month</span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Orders Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders Overview</CardTitle>
            <CardDescription>Order statistics and growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{analytics.orders.today}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{analytics.orders.thisMonth}</p>
                  {formatGrowth(analytics.orders.growth)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Value</p>
                <p className="text-2xl font-bold">{formatPrice(analytics.orders.averageValue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{analytics.orders.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
            <CardDescription>Current order status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Pending</span>
                <Badge variant="outline">{analytics.orders.byStatus.pending}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Processing</span>
                <Badge variant="default">{analytics.orders.byStatus.processing}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipped</span>
                <Badge variant="default">{analytics.orders.byStatus.shipped}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivered</span>
                <Badge variant="secondary">{analytics.orders.byStatus.delivered}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Cancelled</span>
                <Badge variant="destructive">{analytics.orders.byStatus.cancelled}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Refunded</span>
                <Badge variant="destructive">{analytics.orders.byStatus.refunded}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users and Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>User metrics and growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{analytics.users.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{analytics.users.thisMonth}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{analytics.users.admins}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Regular Users</p>
                <p className="text-2xl font-bold">{analytics.users.regular}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Statistics</CardTitle>
            <CardDescription>Product catalog metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{analytics.products.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{analytics.products.active}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-orange-600">{analytics.products.lowStock}</p>
                  {analytics.products.lowStock > 0 && (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      {analytics.products.topSelling.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.products.topSelling.map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{product.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.totalQuantity} units sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(product.totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      {analytics.recentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest order activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.recentOrders.slice(0, 5).map((order: any) => (
                <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.userId?.email || 'Unknown User'} • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(order.total)}</p>
                    <Badge variant="outline">{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
