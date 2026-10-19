'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  analyticsApi,
  type SalesForecast,
  type CustomerLifetimeValue,
  type ConversionFunnel,
  type ProductPerformance,
  type RevenueByCategory,
} from '@/lib/api/analytics';
import { formatPrice } from '@/lib/utils';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';

export default function AdvancedAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('forecast');
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<SalesForecast | null>(null);
  const [clv, setClv] = useState<CustomerLifetimeValue | null>(null);
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [products, setProducts] = useState<ProductPerformance | null>(null);
  const [categoryRevenue, setCategoryRevenue] = useState<RevenueByCategory | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDataForTab(activeTab);
  }, [activeTab]);

  const fetchDataForTab = async (tab: string) => {
    try {
      setLoading(true);
      switch (tab) {
        case 'forecast':
          if (!forecast) {
            const forecastRes = await analyticsApi.getSalesForecast(30);
            setForecast(forecastRes.data);
          }
          break;
        case 'clv':
          if (!clv) {
            const clvRes = await analyticsApi.getCustomerLifetimeValue();
            setClv(clvRes.data);
          }
          break;
        case 'funnel':
          if (!funnel) {
            const funnelRes = await analyticsApi.getConversionFunnel(30);
            setFunnel(funnelRes.data);
          }
          break;
        case 'products':
          if (!products) {
            const productsRes = await analyticsApi.getProductPerformance(20);
            setProducts(productsRes.data);
          }
          break;
        case 'categories':
          if (!categoryRevenue) {
            const categoryRes = await analyticsApi.getRevenueByCategory();
            setCategoryRevenue(categoryRes.data);
          }
          break;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-3 py-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">Deep insights into your business performance</p>
        </div>
        <Link href="/admin/analytics">
          <Button variant="outline">Back to Overview</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="forecast">Sales Forecast</TabsTrigger>
          <TabsTrigger value="clv">Customer Value</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        {/* Sales Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          {loading && !forecast ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : forecast ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Avg Daily Revenue</CardDescription>
                    <CardTitle>{formatPrice(forecast.avgDailyRevenue)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Avg Daily Orders</CardDescription>
                    <CardTitle>{forecast.avgDailyOrders.toFixed(1)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Trend</CardDescription>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant={forecast.trend === 'growing' ? 'default' : forecast.trend === 'declining' ? 'destructive' : 'secondary'}>
                        {forecast.trend}
                      </Badge>
                      <span className="text-sm">{forecast.trendPercentage}%</span>
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Projected Monthly Revenue</CardDescription>
                    <CardTitle>{formatPrice(forecast.projectedMonthlyRevenue)}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Forecast Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>30-Day Sales Forecast</CardTitle>
                  <CardDescription>Projected revenue for the next 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {forecast.forecast.slice(0, 10).map((day) => (
                      <div key={day.day} className="flex items-center gap-4">
                        <span className="w-24 text-sm text-muted-foreground">{day.date}</span>
                        <Progress value={Math.min(100, (day.projectedRevenue / forecast.avgDailyRevenue) * 50)} className="flex-1" />
                        <span className="w-24 text-right font-medium">{formatPrice(day.projectedRevenue)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Customer Lifetime Value Tab */}
        <TabsContent value="clv" className="space-y-4">
          {loading && !clv ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : clv ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardDescription>Average CLV</CardDescription>
                    <CardTitle className="text-3xl">{formatPrice(clv.avgCLV)}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Total Customers</CardDescription>
                    <CardTitle className="text-3xl">{clv.totalCustomers.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>VIP Customers</CardDescription>
                    <CardTitle className="text-3xl">{clv.segments.vip.count}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {clv.segments.vip.percentage}% of customers
                    </p>
                  </CardHeader>
                </Card>
              </div>

              {/* Segments */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(clv.segments).map(([key, segment]) => (
                      <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold capitalize">{key}</h4>
                          <p className="text-sm text-muted-foreground">{segment.count} customers ({segment.percentage}%)</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(segment.totalRevenue)}</p>
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {clv.topCustomers.slice(0, 10).map((customer, idx) => (
                      <div key={customer.userId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center font-bold text-muted-foreground">{idx + 1}</span>
                          <div>
                            <p className="font-medium">{customer.name || customer.email}</p>
                            <p className="text-sm text-muted-foreground">{customer.orderCount} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(customer.totalSpent)}</p>
                          <p className="text-sm text-muted-foreground">Avg: {formatPrice(customer.avgOrderValue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Conversion Funnel Tab */}
        <TabsContent value="funnel" className="space-y-4">
          {loading && !funnel ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : funnel ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>{funnel.period}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {funnel.funnel.map((stage, idx) => (
                      <div key={stage.stage} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{stage.stage}</span>
                          <span className="text-muted-foreground">{stage.count.toLocaleString()} ({stage.percentage}%)</span>
                        </div>
                        <Progress value={stage.percentage} className="h-8" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Drop-off Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funnel.dropOffRates.map((rate) => (
                      <div key={`${rate.from}-${rate.to}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{rate.from} → {rate.to}</p>
                        </div>
                        <div className="flex gap-4">
                          <Badge variant="destructive">Drop-off: {rate.dropOffRate}%</Badge>
                          <Badge variant="default">Conversion: {rate.conversionRate}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Overall Conversion Rate:</strong> {funnel.overallConversionRate}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Product Performance Tab */}
        <TabsContent value="products" className="space-y-4">
          {loading && !products ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : products ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {products.summary.topPerformers.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-green-600">{formatPrice(p.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Needs Attention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {products.summary.worstPerformers.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-red-600">{formatPrice(p.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Products Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminTable>
                    <AdminTableHeader>
                      <AdminTableRow>
                        <AdminTableHead>Product</AdminTableHead>
                        <AdminTableHead className="text-right">Revenue</AdminTableHead>
                        <AdminTableHead className="text-right">Quantity</AdminTableHead>
                        <AdminTableHead className="text-right">Orders</AdminTableHead>
                        <AdminTableHead className="text-right">Avg Order</AdminTableHead>
                        <AdminTableHead className="text-right">Stock</AdminTableHead>
                      </AdminTableRow>
                    </AdminTableHeader>
                    <AdminTableBody>
                      {products.products.slice(0, 15).map((p) => (
                        <AdminTableRow key={p.productId}>
                          <AdminTableCell>
                            <div className="font-medium truncate max-w-[220px]">{p.name}</div>
                            <div className="font-mono text-xs text-muted-foreground">{p.sku}</div>
                          </AdminTableCell>
                          <AdminTableCell className="text-right text-[13px] font-medium whitespace-nowrap">{formatPrice(p.totalRevenue)}</AdminTableCell>
                          <AdminTableCell className="text-right text-[13px] whitespace-nowrap">{p.totalQuantity}</AdminTableCell>
                          <AdminTableCell className="text-right text-[13px] whitespace-nowrap">{p.orderCount}</AdminTableCell>
                          <AdminTableCell className="text-right text-[13px] whitespace-nowrap">{formatPrice(p.avgOrderValue)}</AdminTableCell>
                          <AdminTableCell className="text-right">
                            <Badge variant={p.currentStock < 10 ? 'destructive' : 'secondary'} className="text-[11px]">
                              {p.currentStock}
                            </Badge>
                          </AdminTableCell>
                        </AdminTableRow>
                      ))}
                    </AdminTableBody>
                  </AdminTable>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Revenue by Category Tab */}
        <TabsContent value="categories" className="space-y-4">
          {loading && !categoryRevenue ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categoryRevenue ? (
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Total: {formatPrice(categoryRevenue.totalRevenue)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryRevenue.categories.map((cat) => (
                    <div key={cat.categoryId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cat.categoryName}</span>
                        <span>{formatPrice(cat.totalRevenue)} ({cat.percentage}%)</span>
                      </div>
                      <Progress value={cat.percentage} className="h-4" />
                      <p className="text-xs text-muted-foreground">
                        {cat.totalQuantity} items sold in {cat.orderCount} orders
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

