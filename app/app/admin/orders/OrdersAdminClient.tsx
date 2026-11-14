'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getAllOrders,
  getOrderStats,
  updateOrderStatus,
  confirmPayment,
  refundOrder,
  Order,
  OrderStats,
  OrderStatus,
  PaymentStatus,
  UpdateOrderStatusRequest,
  RefundOrderRequest,
} from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, cn } from '@/lib/utils';
import { Eye, CheckCircle2, XCircle, RefreshCw, DollarSign, Loader2 } from 'lucide-react';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';

const getStatusBadgeVariant = (status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'outline';
    case OrderStatus.PROCESSING:
      return 'default';
    case OrderStatus.SHIPPED:
      return 'default';
    case OrderStatus.DELIVERED:
      return 'secondary';
    case OrderStatus.CANCELLED:
      return 'destructive';
    case OrderStatus.REFUNDED:
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: OrderStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const PAGE_SIZE = 20;

export default function OrdersAdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // The URL is the single source of truth for filters. Sidebar links such as
  // /admin/orders?status=processing now always render matching rows (a local
  // state copy used to go stale and keep showing every status).
  const statusParam = searchParams.get('status') || '';
  const paymentParam = searchParams.get('paymentStatus') || '';
  const statusFilter = Object.values(OrderStatus).includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : undefined;
  const paymentStatusFilter = Object.values(PaymentStatus).includes(paymentParam as PaymentStatus)
    ? (paymentParam as PaymentStatus)
    : undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const urlSearch = searchParams.get('q') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updateStatusDialog, setUpdateStatusDialog] = useState(false);
  const [confirmPaymentDialog, setConfirmPaymentDialog] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [statusNotes, setStatusNotes] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState<'source' | 'upi' | 'bank'>('source');
  const [refundUpiId, setRefundUpiId] = useState('');
  const [refundBankName, setRefundBankName] = useState('');
  const [refundBankAccount, setRefundBankAccount] = useState('');
  const [refundBankIfsc, setRefundBankIfsc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Keep the search box aligned with sidebar / back-forward navigation.
  useEffect(() => {
    setSearchTerm(urlSearch);
    // Don't overwrite what the user is currently typing.
    if (searchBoxRef.current && document.activeElement === searchBoxRef.current) return;
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Debounce typing, then reflect it in the URL.
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (searchTerm === urlSearch) return;
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) params.set('q', searchTerm);
    else params.delete('q');
    params.delete('page');
    const qs = params.toString();
    router.replace(qs ? `/admin/orders?${qs}` : '/admin/orders', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getOrderStats();
      if (res.success) setStats(res.data);
    } catch {
      /* counters are non-critical — keep the page usable */
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    try {
      const response = await getAllOrders(
        page,
        PAGE_SIZE,
        statusFilter,
        paymentStatusFilter,
        undefined,
        searchTerm || undefined
      );
      // Ignore a slow response from an older filter (this used to overwrite
      // the filtered list with unfiltered rows).
      if (requestId !== requestRef.current) return;
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
        setPagination(response.data.pagination || { page, limit: PAGE_SIZE, total: 0, pages: 0 });
      }
    } catch (error: any) {
      if (requestId !== requestRef.current) return;
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load orders.',
        variant: 'destructive',
      });
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  }, [page, statusFilter, paymentStatusFilter, searchTerm, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
    // Keep tab counters live while the page is open (e.g. storefront orders).
    const timer = setInterval(fetchStats, 60000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  const updateUrl = (updates: Record<string, string | null>, mode: 'push' | 'replace' = 'push') => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
    });
    if (!('page' in updates)) params.delete('page');
    const qs = params.toString();
    const url = qs ? `/admin/orders?${qs}` : '/admin/orders';
    if (mode === 'push') router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  };

  const handleStatusFilterChange = (value: string) => {
    updateUrl({ status: value === 'all' ? null : value });
  };

  const handlePaymentStatusFilterChange = (value: string) => {
    updateUrl({ paymentStatus: value === 'all' ? null : value });
  };

  const refreshAll = async () => {
    await Promise.all([fetchOrders(), fetchStats()]);
    // Let the sidebar refresh its counters immediately after a status change.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('admin:orders-changed'));
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    setActionLoading(true);
    try {
      const data: UpdateOrderStatusRequest = {
        status: newStatus,
        notes: statusNotes || undefined,
      };
      await updateOrderStatus(selectedOrder._id, data);
      toast({
        title: 'Success',
        description: 'Order status updated successfully.',
      });
      setUpdateStatusDialog(false);
      setStatusNotes('');
      await refreshAll();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update order status.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    
    setActionLoading(true);
    try {
      await confirmPayment(selectedOrder._id, {
        notes: paymentNotes || undefined,
      });
      toast({
        title: 'Success',
        description: 'Payment confirmed successfully.',
      });
      setConfirmPaymentDialog(false);
      setPaymentNotes('');
      await refreshAll();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to confirm payment.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder || !refundNotes.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Refund notes are required.',
        variant: 'destructive',
      });
      return;
    }
    
    const hasOnlineMoney = Boolean((selectedOrder as any).razorpayPaymentId);
    const method = hasOnlineMoney ? 'source' : refundMethod;
    if (method === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(refundUpiId.trim())) {
      toast({ title: 'Validation Error', description: 'Enter a valid UPI ID (e.g. name@okbank).', variant: 'destructive' });
      return;
    }
    if (method === 'bank' && (!refundBankName.trim() || !refundBankAccount.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(refundBankIfsc.trim().toUpperCase()))) {
      toast({ title: 'Validation Error', description: 'Bank name, account number and valid IFSC are required.', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    try {
      const data: RefundOrderRequest = {
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
        notes: refundNotes,
        refundMethod: method,
        upiId: method === 'upi' ? refundUpiId.trim() : undefined,
        bankAccountName: method === 'bank' ? refundBankName.trim() : undefined,
        bankAccountNumber: method === 'bank' ? refundBankAccount.trim() : undefined,
        bankIfsc: method === 'bank' ? refundBankIfsc.trim().toUpperCase() : undefined,
      };
      const res = await refundOrder(selectedOrder._id, data);
      toast({
        title: 'Success',
        description: (res as any)?.message || 'Order refunded successfully.',
      });
      setRefundDialog(false);
      setRefundAmount('');
      setRefundNotes('');
      setRefundUpiId('');
      setRefundBankName('');
      setRefundBankAccount('');
      setRefundBankIfsc('');
      await refreshAll();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to refund order.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openUpdateStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNotes('');
    setUpdateStatusDialog(true);
  };

  const openConfirmPaymentDialog = (order: Order) => {
    setSelectedOrder(order);
    setPaymentNotes('');
    setConfirmPaymentDialog(true);
  };

  const openRefundDialog = (order: Order) => {
    setSelectedOrder(order);
    setRefundAmount('');
    setRefundNotes('');
    setRefundMethod(((order as any)?.refundMethod as any) || 'source');
    setRefundUpiId((order as any)?.refundUpiId || '');
    setRefundBankName((order as any)?.refundBankName || '');
    setRefundBankAccount((order as any)?.refundBankAccount || '');
    setRefundBankIfsc((order as any)?.refundBankIfsc || '');
    setRefundDialog(true);
  };

  const tabItems = [
    { key: 'all', label: 'All Orders', href: '/admin/orders', count: stats?.total },
    { key: OrderStatus.PENDING, label: 'Pending', href: '/admin/orders?status=pending', count: stats?.byStatus?.pending },
    { key: OrderStatus.PROCESSING, label: 'Processing', href: '/admin/orders?status=processing', count: stats?.byStatus?.processing },
    { key: OrderStatus.DELIVERED, label: 'Delivered', href: '/admin/orders?status=delivered', count: stats?.byStatus?.delivered },
    { key: 'returns', label: 'Returns & Exchange', href: '/admin/returns', count: stats?.returns?.total },
  ];
  const isTabActive = (key: string) => (key === 'all' ? !statusFilter : statusFilter === key);
  const pendingPayments = stats?.byPaymentStatus?.pending ?? 0;

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Order Management</h1>
          <p className="text-xs text-muted-foreground">
            {stats ? `${stats.total} total orders · ${pendingPayments} awaiting payment` : 'Loading order summary…'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll} disabled={loading} className="h-8">
          <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Accurate status tabs (same numbers as the admin sidebar) */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {tabItems.map((tab) => {
          const active = isTabActive(tab.key);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                'rounded-xl border bg-white px-3 py-2.5 transition-all dark:bg-slate-900',
                active
                  ? 'border-amber-500 ring-1 ring-amber-500/30'
                  : 'border-slate-200 hover:border-amber-300 dark:border-slate-800 dark:hover:border-amber-700'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={cn(
                  'block text-[10px] font-extrabold uppercase tracking-widest',
                  active ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                )}
              >
                {tab.label}
              </span>
              <span className="mt-0.5 block text-xl font-extrabold tabular-nums">
                {tab.count ?? '—'}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <Label>Search</Label>
          <Input
            ref={searchBoxRef}
            placeholder="Order #, customer name, email, phone or AWB…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
            <SelectTrigger aria-label="Filter orders by status">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(OrderStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Payment Status</Label>
          <Select value={paymentStatusFilter || 'all'} onValueChange={handlePaymentStatusFilterChange}>
            <SelectTrigger aria-label="Filter orders by payment status">
              <SelectValue placeholder="All Payment Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment Statuses</SelectItem>
              {Object.values(PaymentStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filter Indicators */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {statusFilter && <Badge className="bg-amber-500 text-slate-950 text-[10px] font-extrabold">Status: {getStatusLabel(statusFilter)}</Badge>}
        {paymentStatusFilter && <Badge className="bg-violet-500 text-white text-[10px] font-extrabold">Payment: {paymentStatusFilter}</Badge>}
        {searchTerm && <Badge className="bg-sky-600 text-white text-[10px] font-extrabold">Search: {searchTerm}</Badge>}
        {(statusFilter || paymentStatusFilter || searchTerm) && (
          <Button
            size="sm"
            variant="outline"
            className="h-5 px-2 text-[10px] font-extrabold"
            onClick={() => {
              setSearchInput('');
              setSearchTerm('');
              router.push('/admin/orders');
            }}
          >
            Clear filters
          </Button>
        )}
        {pagination.total > 0 && (
          <span className="ml-auto text-[11px] font-medium text-muted-foreground">
            {pagination.total} {pagination.total === 1 ? 'order' : 'orders'} matching
          </span>
        )}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <>
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Order #</AdminTableHead>
                <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Customer</AdminTableHead>
                <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Total</AdminTableHead>
                <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</AdminTableHead>
                <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Payment</AdminTableHead>
                <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">AWB / Tracking</AdminTableHead>
                <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Date</AdminTableHead>
                <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {orders.map((order) => (
                <AdminTableRow key={order._id}>
                  <AdminTableCell>
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className="font-mono text-xs font-medium hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </AdminTableCell>
                  <AdminTableCell>
                    {order.userId && typeof order.userId === 'object' ? (
                      <div className="max-w-[220px]">
                        <div className="font-medium truncate">
                          {(order.userId as any).name || (order.userId as any).email || 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(order.userId as any).email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="font-medium whitespace-nowrap">{formatPrice(order.total)}</AdminTableCell>
                  <AdminTableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="text-[11px]">
                      {getStatusLabel(order.status)}
                    </Badge>
                  </AdminTableCell>
                  <AdminTableCell>
                    <Badge
                      variant={
                        order.paymentStatus === PaymentStatus.CONFIRMED ? 'default' : 'outline'
                      }
                      className="text-[11px]"
                    >
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </Badge>
                  </AdminTableCell>
                  <AdminTableCell className="font-mono text-xs">
                    {(order as any).shiprocketAWB || (order as any).trackingNumber || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <RowActions
                      label={`Actions for ${order.orderNumber}`}
                      items={[
                        {
                          label: 'View details',
                          icon: <Eye className="h-3.5 w-3.5 mr-2" />,
                          onSelect: () => router.push(`/admin/orders/${order._id}`),
                        },
                        ...(order.paymentStatus === PaymentStatus.PENDING
                          ? [
                              {
                                label: 'Confirm payment',
                                icon: <DollarSign className="h-3.5 w-3.5 mr-2" />,
                                onSelect: () => openConfirmPaymentDialog(order),
                              },
                            ]
                          : []),
                        {
                          label: 'Update status',
                          icon: <RefreshCw className="h-3.5 w-3.5 mr-2" />,
                          onSelect: () => openUpdateStatusDialog(order),
                        },
                        ...(order.paymentStatus === PaymentStatus.CONFIRMED &&
                        order.status !== OrderStatus.REFUNDED
                          ? [
                              {
                                label: 'Refund',
                                icon: <XCircle className="h-3.5 w-3.5 mr-2" />,
                                danger: true,
                                onSelect: () => openRefundDialog(order),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateUrl({ page: String(page - 1) })}
                disabled={page <= 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateUrl({ page: String(page + 1) })}
                disabled={page >= pagination.pages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Update Status Dialog */}
      <Dialog open={updateStatusDialog} onOpenChange={setUpdateStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OrderStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmPaymentDialog} onOpenChange={setConfirmPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Confirm payment for order #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Payment Notes (Optional)</Label>
              <Textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any notes about this payment confirmation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialog} onOpenChange={setRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Order</DialogTitle>
            <DialogDescription>
              Process a refund for order #{selectedOrder?.orderNumber} (Total: {selectedOrder ? formatPrice(selectedOrder.total) : ''})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Refund Amount (Leave empty for full refund)</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder={`Max: ${selectedOrder ? formatPrice(selectedOrder.total) : ''}`}
                min={0}
                max={selectedOrder?.total}
              />
            </div>
            <div>
              <Label>Refund Notes *</Label>
              <Textarea
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                placeholder="Reason for refund..."
                rows={3}
                required
              />
            </div>
            {(selectedOrder as any)?.razorpayPaymentId ? (
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/60 p-2.5">
                Online payment detected — refund goes back to the source via Razorpay automatically in 5–7 working days. No UPI/bank details needed.
              </p>
            ) : (
              <>
                <div>
                  <Label>Refund via</Label>
                  <Select value={refundMethod} onValueChange={(v) => setRefundMethod(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source">Original source (if any)</SelectItem>
                      <SelectItem value="upi">Customer UPI ID</SelectItem>
                      <SelectItem value="bank">Bank transfer (NEFT/IMPS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {refundMethod === 'upi' && (
                  <div>
                    <Label>Customer UPI ID *</Label>
                    <Input value={refundUpiId} onChange={(e) => setRefundUpiId(e.target.value)} placeholder="name@okbank" className="font-mono" />
                  </div>
                )}
                {refundMethod === 'bank' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Account holder name *</Label>
                      <Input value={refundBankName} onChange={(e) => setRefundBankName(e.target.value)} placeholder="As per bank records" />
                    </div>
                    <div>
                      <Label>Account number *</Label>
                      <Input value={refundBankAccount} onChange={(e) => setRefundBankAccount(e.target.value)} placeholder="Digits only" className="font-mono" inputMode="numeric" />
                    </div>
                    <div>
                      <Label>IFSC *</Label>
                      <Input value={refundBankIfsc} onChange={(e) => setRefundBankIfsc(e.target.value.toUpperCase())} placeholder="HDFC0001234" className="font-mono uppercase" maxLength={11} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefund} disabled={actionLoading || !refundNotes.trim()} variant="destructive">
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Process Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

