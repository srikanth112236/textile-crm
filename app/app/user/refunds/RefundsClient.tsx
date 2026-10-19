'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getUserOrders, Order, PaymentStatus } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { exportToCSV } from '@/lib/utils/export';
import { Search, Eye, RefreshCw, XCircle, Download } from 'lucide-react';

export default function RefundsClient() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    calculateTotal();
  }, [orders]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      // Get user's orders and filter for refunded ones
      const response = await getUserOrders(page, 20);
      if (response.success && response.data) {
        let refundedOrders = (response.data.orders || []).filter(
          (order) => order.paymentStatus === PaymentStatus.REFUNDED
        );

        // Apply date range filter if provided
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          refundedOrders = refundedOrders.filter((order) => {
            const refundDate = new Date(order.updatedAt || order.createdAt);
            return refundDate >= start;
          });
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          refundedOrders = refundedOrders.filter((order) => {
            const refundDate = new Date(order.updatedAt || order.createdAt);
            return refundDate <= end;
          });
        }

        setOrders(refundedOrders);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotal(response.data.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to load refunds:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load refunds. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const total = orders.reduce((sum, order) => {
      return sum + (order.refundAmount || order.total);
    }, 0);
    setTotalRefunded(total);
  };

  const handleSearch = () => {
    loadRefunds();
  };

  const filteredOrders = useMemo(() => {
    return searchQuery
      ? orders.filter(
          (order) =>
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order._id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : orders;
  }, [orders, searchQuery]);

  const handleExport = () => {
    try {
      const exportData = filteredOrders.map((order) => ({
        'Order Number': order.orderNumber,
        'Original Amount': order.total.toFixed(2),
        'Refund Amount': (order.refundAmount || order.total).toFixed(2),
        'Refund Date': new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        'Refund Notes': order.refundNotes || '',
      }));

      const headers = [
        { key: 'Order Number', label: 'Order Number' },
        { key: 'Original Amount', label: 'Original Amount' },
        { key: 'Refund Amount', label: 'Refund Amount' },
        { key: 'Refund Date', label: 'Refund Date' },
        { key: 'Refund Notes', label: 'Refund Notes' },
      ];

      const dateRange = startDate || endDate
        ? `_${startDate || 'all'}_to_${endDate || 'all'}`
        : '';
      const filename = `my_refunds_${new Date().toISOString().split('T')[0]}${dateRange}.csv`;

      exportToCSV(exportData, headers, filename);
      toast({
        title: 'Success',
        description: 'Refunds exported successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Export Error',
        description: error.message || 'Failed to export refunds',
        variant: 'destructive',
      });
    }
  };

  const handleDateFilter = () => {
    setPage(1);
    loadRefunds();
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
    loadRefunds();
  };

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <XCircle className="h-8 w-8 text-red-600" />
            My Refunds
          </h1>
          <p className="text-muted-foreground mt-1">View your refund history</p>
        </div>
        <Button onClick={loadRefunds} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Refunded Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPrice(totalRefunded)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Showing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
            <div className="text-sm text-muted-foreground">of {total} refunds</div>
          </CardContent>
        </Card>
      </div>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Refund Records</CardTitle>
              <CardDescription>Your refund history</CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" disabled={filteredOrders.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleDateFilter} className="w-full">
                Apply Filter
              </Button>
              {(startDate || endDate) && (
                <Button variant="outline" onClick={clearDateFilter}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {searchQuery && (
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                loadRefunds();
              }}>
                Clear
              </Button>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No refunds found</h2>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'No refunds have been processed yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Order Number</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Original Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Refund Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Refund Notes</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="font-medium">#{order.orderNumber}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{formatPrice(order.total)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-red-600">
                              -{formatPrice(order.refundAmount || order.total)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(order.updatedAt || order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {order.refundNotes || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/user/orders/${order._id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && !searchQuery && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} refunds
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || loading}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || loading}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

