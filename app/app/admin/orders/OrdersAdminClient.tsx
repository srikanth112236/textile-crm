'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getAllOrders,
  updateOrderStatus,
  confirmPayment,
  refundOrder,
  Order,
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
import { formatPrice } from '@/lib/utils';
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

export default function OrdersAdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | undefined>(undefined);
  const [orderNumberFilter, setOrderNumberFilter] = useState('');
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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getAllOrders(
        pagination.page,
        pagination.limit,
        statusFilter,
        paymentStatusFilter,
        undefined
      );
      if (response.success && response.data) {
        let filteredOrders = response.data.orders || [];
        
        // Filter by order number if provided
        if (orderNumberFilter.trim()) {
          filteredOrders = filteredOrders.filter((order) =>
            order.orderNumber.toLowerCase().includes(orderNumberFilter.toLowerCase())
          );
        }
        
        setOrders(filteredOrders);
        setPagination(response.data.pagination || pagination);
      }
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load orders.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Read filters from URL params
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      setStatusFilter(status as OrderStatus);
    }
    if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
      setPaymentStatusFilter(paymentStatus as PaymentStatus);
    }
    
    fetchOrders();
  }, [pagination.page, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    // Debounce order number filter
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [orderNumberFilter]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all' ? undefined : (value as OrderStatus));
    setPagination({ ...pagination, page: 1 });
    router.push(`/admin/orders?status=${value === 'all' ? '' : value}&paymentStatus=${paymentStatusFilter || ''}`);
  };

  const handlePaymentStatusFilterChange = (value: string) => {
    setPaymentStatusFilter(value === 'all' ? undefined : (value as PaymentStatus));
    setPagination({ ...pagination, page: 1 });
    router.push(`/admin/orders?status=${statusFilter || ''}&paymentStatus=${value === 'all' ? '' : value}`);
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
      await fetchOrders();
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
      await fetchOrders();
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
      await fetchOrders();
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

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">Order Management</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <Label>Order Number</Label>
          <Input
            placeholder="Search by order number..."
            value={orderNumberFilter}
            onChange={(e) => setOrderNumberFilter(e.target.value)}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
            <SelectTrigger>
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
            <SelectTrigger>
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
      <div className="flex flex-wrap gap-1.5 mb-2">
        {statusFilter && <Badge className="bg-amber-500 text-slate-950 text-[10px] font-extrabold">Status: {getStatusLabel(statusFilter)}</Badge>}
        {paymentStatusFilter && <Badge className="bg-violet-500 text-white text-[10px] font-extrabold">Payment: {paymentStatusFilter}</Badge>}
        {(statusFilter || paymentStatusFilter) && (
          <Button size="sm" variant="outline" className="h-5 px-2 text-[10px] font-extrabold" onClick={() => { setStatusFilter(undefined); setPaymentStatusFilter(undefined); setPagination({ ...pagination, page: 1 }); router.push('/admin/orders'); }}>Clear filters</Button>
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
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
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

