'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getUserOrders, Order, PaymentStatus } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/utils';
import { exportToCSV } from '@/lib/utils/export';
import { DollarSign, Search, Eye, RefreshCw, CreditCard, Download } from 'lucide-react';

const getPaymentStatusBadge = (status: PaymentStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case PaymentStatus.CONFIRMED:
      return 'default';
    case PaymentStatus.PENDING:
      return 'outline';
    case PaymentStatus.REFUNDED:
      return 'destructive';
    default:
      return 'outline';
  }
};

const getPaymentStatusLabel = (status: PaymentStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function PaymentsClient() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    calculateTotal();
  }, [orders]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      // Get user's orders (only confirmed payments, excluding refunded)
      const response = await getUserOrders(page, 20);
      if (response.success && response.data) {
        let confirmedPayments = (response.data.orders || []).filter(
          (order) => order.paymentStatus === PaymentStatus.CONFIRMED && !order.refundAmount
        );

        // Apply date range filter if provided
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          confirmedPayments = confirmedPayments.filter((order) => new Date(order.createdAt) >= start);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          confirmedPayments = confirmedPayments.filter((order) => new Date(order.createdAt) <= end);
        }

        setOrders(confirmedPayments);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotal(response.data.pagination?.total || 0);
      }
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load payments. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const total = orders.reduce((sum, order) => {
      if (order.paymentStatus === PaymentStatus.CONFIRMED && !order.refundAmount) {
        return sum + order.total;
      }
      return sum;
    }, 0);
    setTotalAmount(total);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadPayments();
    } else {
      loadPayments();
    }
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
        'Date': new Date(order.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        'Amount': order.total.toFixed(2),
        'Payment Status': order.paymentStatus,
        'Payment Method': order.paymentMethod,
      }));

      const headers = [
        { key: 'Order Number', label: 'Order Number' },
        { key: 'Date', label: 'Date' },
        { key: 'Amount', label: 'Amount' },
        { key: 'Payment Status', label: 'Payment Status' },
        { key: 'Payment Method', label: 'Payment Method' },
      ];

      const dateRange = startDate || endDate
        ? `_${startDate || 'all'}_to_${endDate || 'all'}`
        : '';
      const filename = `my_payments_${new Date().toISOString().split('T')[0]}${dateRange}.csv`;

      exportToCSV(exportData, headers, filename);
      toast({
        title: 'Success',
        description: 'Payments exported successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Export Error',
        description: error.message || 'Failed to export payments',
        variant: 'destructive',
      });
    }
  };

  const handleDateFilter = () => {
    setPage(1);
    loadPayments();
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
    loadPayments();
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
            <DollarSign className="h-8 w-8" />
            My Payments
          </h1>
          <p className="text-muted-foreground mt-1">View your payment history</p>
        </div>
        <Button onClick={loadPayments} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Showing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
            <div className="text-sm text-muted-foreground">of {total} payments</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>Your confirmed payments</CardDescription>
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
                loadPayments();
              }}>
                Clear
              </Button>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No payments found</h2>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'No payment records yet'}
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
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Payment Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Payment Method</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="font-medium">#{order.orderNumber}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{formatPrice(order.total)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={getPaymentStatusBadge(order.paymentStatus)}>
                              {getPaymentStatusLabel(order.paymentStatus)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm capitalize">{order.paymentMethod}</td>
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
                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} payments
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

