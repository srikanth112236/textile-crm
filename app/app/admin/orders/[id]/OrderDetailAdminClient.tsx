'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  completeManualRefund,
  confirmPayment,
  getOrder,
  Order,
  OrderStatus,
  PaymentStatus,
  RefundOrderRequest,
  refundOrder,
  UpdateOrderStatusRequest,
  updateOrderStatus,
} from '@/lib/api/orders';
import { adminPaymentsApi, RefundContextData } from '@/lib/api/adminPayments';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCopy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  History,
  Info,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Navigation,
  Package,
  Phone,
  Printer,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Undo2,
  User,
  Wallet,
} from 'lucide-react';
import OrderShipmentPanel from './OrderShipmentPanel';

interface OrderDetailAdminClientProps {
  orderId: string;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const money = (value?: number | null) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const statusLabel = (value?: string) =>
  (value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const fmtDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fmtDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const cleanText = (value?: string) => {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€¢/g, '•')
    .replace(/â€™/g, '’')
    .replace(/â€œ/g, '“')
    .replace(/â€\u009d/g, '”')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

const imageUrl = (images?: Array<string | { url: string }>) => {
  const first = images?.[0];
  if (!first) return '';
  const raw = typeof first === 'string' ? first : first.url;
  if (!raw) return '';
  // Uploads may be absolute (API host) or legacy relative paths. Serve them
  // through the same-origin image proxy so they work in dev and production.
  if (raw.includes('/uploads/')) {
    try {
      const parsed = raw.startsWith('http') ? new URL(raw) : null;
      return `/api/images${parsed ? parsed.pathname : raw.slice(raw.indexOf('/uploads/'))}`;
    } catch {
      return raw;
    }
  }
  return raw;
};

const statusTone = (status?: string) => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300';
    case OrderStatus.PROCESSING:
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300';
    case OrderStatus.PACKED:
      return 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300';
    case OrderStatus.PARTIALLY_FULFILLED:
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300';
    case OrderStatus.SHIPPED:
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300';
    case OrderStatus.OUT_FOR_DELIVERY:
      return 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-300';
    case OrderStatus.DELIVERED:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300';
    case OrderStatus.CANCELLED:
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300';
    case OrderStatus.REFUNDED:
      return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
    case OrderStatus.ON_HOLD:
      return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300';
  }
};

const paymentTone = (status?: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.CONFIRMED:
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300';
    case PaymentStatus.PENDING:
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300';
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300';
    case PaymentStatus.REFUNDED:
      return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
    case PaymentStatus.FAILED:
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300';
  }
};

const noticeTone = (tone: 'amber' | 'emerald' | 'rose' | 'sky' | 'slate') => {
  switch (tone) {
    case 'amber':
      return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200';
    case 'emerald':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200';
    case 'rose':
      return 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200';
    case 'sky':
      return 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200';
  }
};

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-slate-800 dark:text-slate-200">{children}</span>
    </div>
  );
}

function ItemThumb({
  src,
  name,
  href,
}: {
  src?: string;
  name: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          unoptimized
          sizes="80px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-slate-400">
          <Package className="h-6 w-6" />
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function OrderDetailAdminClient({ orderId }: OrderDetailAdminClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const invoiceFrameRef = useRef<HTMLIFrameElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [updateStatusDialog, setUpdateStatusDialog] = useState(false);
  const [confirmPaymentDialog, setConfirmPaymentDialog] = useState(false);
  const [refundDialog, setRefundDialog] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceReady, setInvoiceReady] = useState(false);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);

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
  const [refundContextData, setRefundContextData] = useState<RefundContextData | null>(null);
  const [refundContextLoading, setRefundContextLoading] = useState(false);
  const [completeReference, setCompleteReference] = useState('');
  const [showAllTimeline, setShowAllTimeline] = useState(false);

  const loadOrder = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const response = await getOrder(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
        }
      } catch (error: any) {
        console.error('Failed to load order:', error);
        if (error?.response?.status === 404) {
          toast({
            title: 'Order not found',
            description: 'The order you are looking for does not exist.',
            variant: 'destructive',
          });
          router.push('/admin/orders');
        } else {
          toast({
            title: 'Could not load order',
            description: error?.response?.data?.error || 'Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orderId, router]
  );

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    const handleInvoiceMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const type = event.data?.type;

      if (type === 'mentoos:invoice:ready') {
        setInvoiceReady(true);
      }

      if (type === 'mentoos:invoice:download-done') {
        setInvoiceReady(true);
        setInvoiceDownloading(false);
        toast(
          event.data?.success
            ? {
                title: 'Invoice downloaded',
                description: 'The PDF was saved to your downloads.',
              }
            : {
                title: 'Could not download invoice',
                description: 'Please try again, or use Print and choose Save as PDF.',
                variant: 'destructive',
              }
        );
      }
    };

    window.addEventListener('message', handleInvoiceMessage);
    return () => window.removeEventListener('message', handleInvoiceMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!invoiceOpen) return;
    const frame = invoiceFrameRef.current;
    // If the embedded invoice is already mounted (common when reopening the
    // modal), ask it to re-announce that it is ready for print/download.
    frame?.contentWindow?.postMessage({ type: 'mentoos:invoice:ping' }, window.location.origin);
  }, [invoiceOpen]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  /* ------------------------------ actions ------------------------------ */

  const openUpdateStatusDialog = () => {
    if (!order) return;
    setNewStatus(order.status);
    setStatusNotes('');
    setUpdateStatusDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const payload: UpdateOrderStatusRequest = {
        status: newStatus,
        notes: statusNotes || undefined,
      };
      await updateOrderStatus(order._id, payload);
      toast({ title: 'Status updated', description: `Order is now ${statusLabel(newStatus)}.` });
      setUpdateStatusDialog(false);
      setStatusNotes('');
      await loadOrder(true);
    } catch (error: any) {
      toast({
        title: 'Could not update status',
        description: error?.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirmPaymentDialog = () => {
    setPaymentNotes('');
    setConfirmPaymentDialog(true);
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await confirmPayment(order._id, { notes: paymentNotes || undefined });
      toast({ title: 'Payment confirmed', description: 'The order is marked as paid.' });
      setConfirmPaymentDialog(false);
      setPaymentNotes('');
      await loadOrder(true);
    } catch (error: any) {
      toast({
        title: 'Could not confirm payment',
        description: error?.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openRefundDialog = async () => {
    if (!order) return;
    setRefundAmount('');
    setRefundNotes('');
    setRefundMethod(((order as any)?.refundMethod as any) || 'source');
    setRefundUpiId((order as any)?.refundUpiId || '');
    setRefundBankName((order as any)?.refundBankName || '');
    setRefundBankAccount((order as any)?.refundBankAccount || '');
    setRefundBankIfsc((order as any)?.refundBankIfsc || '');
    setRefundContextData(null);
    setRefundDialog(true);
    setRefundContextLoading(true);
    try {
      const context = await adminPaymentsApi.refundContext(order._id);
      setRefundContextData(context);
      setRefundMethod(context.context.online ? 'source' : ((order as any)?.refundMethod as any) || 'upi');
    } catch (error: any) {
      toast({
        title: 'Could not load refundable balance',
        description: error?.response?.data?.error || 'Close the dialog and try again.',
        variant: 'destructive',
      });
    } finally {
      setRefundContextLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!order || !refundNotes.trim()) {
      toast({ title: 'Refund notes are required', variant: 'destructive' });
      return;
    }
    const hasOnlineMoney = refundContextData?.context.online ?? Boolean(order.razorpayPaymentId);
    const refundable = refundContextData?.context.refundable;
    if (refundContextData && !refundContextData.context.canRefund) {
      toast({
        title: 'This order cannot be refunded right now',
        description: refundContextData.context.blocker || 'There is no refundable balance.',
        variant: 'destructive',
      });
      return;
    }
    if (refundAmount && refundable !== undefined && parseFloat(refundAmount) > refundable + 0.009) {
      toast({
        title: 'Amount is above the refundable balance',
        description: `Maximum additional refund is ${money(refundable)}.`,
        variant: 'destructive',
      });
      return;
    }
    const method = hasOnlineMoney ? 'source' : refundMethod;
    if (method === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(refundUpiId.trim())) {
      toast({ title: 'Enter a valid UPI ID', description: 'Example: name@okbank', variant: 'destructive' });
      return;
    }
    if (
      method === 'bank' &&
      (!refundBankName.trim() ||
        !refundBankAccount.trim() ||
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(refundBankIfsc.trim().toUpperCase()))
    ) {
      toast({
        title: 'Bank details incomplete',
        description: 'Account holder name, account number and a valid IFSC are required.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const payload: RefundOrderRequest = {
        refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
        notes: refundNotes,
        refundMethod: method,
        upiId: method === 'upi' ? refundUpiId.trim() : undefined,
        bankAccountName: method === 'bank' ? refundBankName.trim() : undefined,
        bankAccountNumber: method === 'bank' ? refundBankAccount.trim() : undefined,
        bankIfsc: method === 'bank' ? refundBankIfsc.trim().toUpperCase() : undefined,
      };
      const response = await refundOrder(order._id, payload);
      toast({
        title: 'Refund initiated',
        description: (response as any)?.message || 'The refund was recorded.',
      });
      setRefundDialog(false);
      setRefundAmount('');
      setRefundNotes('');
      setRefundUpiId('');
      setRefundBankName('');
      setRefundBankAccount('');
      setRefundBankIfsc('');
      setRefundContextData(null);
      await loadOrder(true);
    } catch (error: any) {
      toast({
        title: 'Refund failed',
        description: error?.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRefund = async () => {
    if (!order || !completeReference.trim()) {
      toast({ title: 'Reference is required', description: 'Enter the UTR / transaction reference.', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    try {
      await completeManualRefund(order._id, { reference: completeReference.trim() });
      toast({ title: 'Refund completed', description: 'The manual refund was recorded.' });
      setCompleteReference('');
      await loadOrder(true);
    } catch (error: any) {
      toast({
        title: 'Could not complete refund',
        description: error?.response?.data?.error || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const printInvoice = () => {
    const frame = invoiceFrameRef.current;
    if (!frame?.contentWindow || !invoiceReady) {
      toast({ title: 'Invoice is still loading', variant: 'destructive' });
      return;
    }
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };

  const downloadInvoice = () => {
    const frame = invoiceFrameRef.current;
    if (!frame?.contentWindow || !invoiceReady) {
      toast({ title: 'Invoice is still loading', variant: 'destructive' });
      return;
    }
    setInvoiceDownloading(true);
    frame.contentWindow.postMessage({ type: 'mentoos:invoice:download' }, window.location.origin);
  };

  /* ---------------------------- derived data ---------------------------- */

  const hasOnlinePayment =
    Boolean(order?.razorpayPaymentId || order?.razorpayOrderId) ||
    ['razorpay', 'online'].includes((order?.paymentMethod || '').toLowerCase());
  const isCod = (order?.paymentMethod || '').toLowerCase() === 'cod';
  const isManualPayment = Boolean(order) && !hasOnlinePayment;
  const isOrderClosed =
    Boolean(order) && (order!.status === OrderStatus.CANCELLED || order!.status === OrderStatus.REFUNDED);
  const canRefund =
    Boolean(order) &&
    (order!.paymentStatus === PaymentStatus.CONFIRMED ||
      order!.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED) &&
    order!.status !== OrderStatus.REFUNDED;
  const canConfirmPayment =
    Boolean(order) &&
    order!.paymentStatus === PaymentStatus.PENDING &&
    !hasOnlinePayment &&
    !isOrderClosed;

  const totals = useMemo(() => {
    if (!order) {
      return {
        itemsSubtotal: 0,
        units: 0,
        shipping: 0,
        discount: 0,
        tax: 0,
        total: 0,
        advance: 0,
        balance: 0,
        adjustment: 0,
        advanceRequired: 0,
        advancePending: 0,
      };
    }
    const itemsSubtotal =
      typeof order.subtotal === 'number' && order.subtotal > 0
        ? order.subtotal
        : order.items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const units = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const advance = Number(order.codAdvancePaid || 0);
    const total = Number(order.total || 0);
    const isOrderCod = (order.paymentMethod || '').toLowerCase() === 'cod';
    const storedCodBalance = typeof order.codBalance === 'number' ? order.codBalance : null;
    const balance = isOrderCod && storedCodBalance !== null ? storedCodBalance : Math.max(0, total - advance);
    const advanceRequired =
      isOrderCod && storedCodBalance !== null ? Math.max(0, Math.round((total - storedCodBalance) * 100) / 100) : 0;
    const advancePending = Math.max(0, Math.round((advanceRequired - advance) * 100) / 100);
    const discount = Number(order.discountAmount || 0);
    const shipping = Number(order.shippingCost || 0);
    const tax = Number(order.taxAmount || 0);
    const adjustment = Math.round((total - (itemsSubtotal - discount + shipping + tax)) * 100) / 100;
    return {
      itemsSubtotal,
      units,
      shipping,
      discount,
      tax,
      total,
      advance,
      balance,
      adjustment,
      advanceRequired,
      advancePending,
    };
  }, [order]);

  const customer =
    order && typeof order.userId === 'object' && order.userId ? order.userId : null;
  const customerName = customer?.name || 'Guest customer';
  const customerEmail = customer?.email || '';
  const customerPhone = customer?.phone || '';
  const address = order?.shippingAddress;
  const addressLine = address
    ? `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`
    : '';
  const mapsUrl = addressLine
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`
    : '';
  const waPhone = customerPhone.replace(/\D/g, '').slice(-10);
  const initials = customerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const timeline = useMemo(() => {
    if (!order?.timeline) return [];
    return [...order.timeline].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [order]);
  const visibleTimeline = showAllTimeline ? timeline : timeline.slice(0, 6);

  const rawPaymentMethod = (order?.paymentMethod || '').toLowerCase();
  const manualMethodName =
    rawPaymentMethod === 'upi'
      ? 'UPI'
      : rawPaymentMethod === 'netbanking'
        ? 'Net banking'
        : statusLabel(rawPaymentMethod);
  const paymentMethodLabel = isCod
    ? 'Cash on delivery'
    : hasOnlinePayment
      ? 'Online · Razorpay'
      : `Manual${rawPaymentMethod && rawPaymentMethod !== 'manual' ? ` · ${manualMethodName}` : ' collection'}`;
  const paymentStatusLabel = statusLabel(order?.paymentStatus);
  const sourceLabel = (order?.source || '').includes('guest')
    ? 'Guest checkout'
    : statusLabel(order?.source || 'website');

  /* ------------------------------- loading ------------------------------ */

  if (loading && !order) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="mt-2 h-3 w-72" />
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-80 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
        <Package className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-lg font-bold">Order unavailable</h1>
        <p className="text-sm text-muted-foreground">This order could not be loaded. It may have been removed.</p>
        <Button asChild variant="outline">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to orders
          </Link>
        </Button>
      </div>
    );
  }

  const notice = (() => {
    if (order.status === OrderStatus.CANCELLED) {
      return {
        tone: 'rose' as const,
        icon: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />,
        title: 'Order cancelled',
        body: order.cancelledReason
          ? `Reason: ${order.cancelledReason}`
          : 'This order was cancelled. Payment and shipment actions are disabled.',
      };
    }
    if (order.status === OrderStatus.DELIVERED) {
      return {
        tone: 'emerald' as const,
        icon: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />,
        title: 'Delivered',
        body:
          order.shiprocketAWB || order.shiprocketShipmentId
            ? `Delivered on ${fmtDateTime(order.deliveredAt || order.updatedAt)}. Courier status now updates automatically from Shiprocket.`
            : `Delivered on ${fmtDateTime(order.deliveredAt || order.updatedAt)}. No courier record is attached to this order.`,
      };
    }
    if (hasOnlinePayment && order.paymentStatus === PaymentStatus.PENDING) {
      return {
        tone: 'amber' as const,
        icon: <Info className="mt-0.5 h-4 w-4 shrink-0" />,
        title: 'Waiting for Razorpay confirmation',
        body: 'The payment provider confirms this order automatically. Manual override is available under More only if the webhook is delayed.',
      };
    }
    if (isCod && order.paymentStatus === PaymentStatus.PENDING) {
      if (totals.advancePending > 0) {
        return {
          tone: 'amber' as const,
          icon: <Wallet className="mt-0.5 h-4 w-4 shrink-0" />,
          title: `COD advance ${money(totals.advancePending)} pending`,
          body: `Collect the advance before dispatch. The courier will collect ${money(totals.balance)} on delivery once the advance is paid.`,
        };
      }
      return {
        tone: 'sky' as const,
        icon: <Wallet className="mt-0.5 h-4 w-4 shrink-0" />,
        title: `Collect ${money(totals.balance)} on delivery`,
        body:
          totals.advance > 0
            ? `Advance already collected: ${money(totals.advance)}. Mark payment collected once cash is received.`
            : 'Mark payment collected after the courier hands over the cash.',
      };
    }
    return null;
  })();

  const timelineIcon = (type?: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="h-3.5 w-3.5" />;
      case 'fulfillment':
        return <Truck className="h-3.5 w-3.5" />;
      case 'note_added':
        return <MessageCircle className="h-3.5 w-3.5" />;
      case 'status_change':
        return <RefreshCw className="h-3.5 w-3.5" />;
      default:
        return <Package className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0 rounded-xl">
            <Link href="/admin/orders" aria-label="Back to orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-black tracking-tight">#{order.orderNumber}</h1>
              <Badge
                variant="outline"
                className={cn('px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', statusTone(order.status))}
              >
                {statusLabel(order.status)}
              </Badge>
              <Badge
                variant="outline"
                className={cn('px-2.5 py-1 text-[10px] font-black uppercase tracking-wider', paymentTone(order.paymentStatus))}
              >
                {paymentStatusLabel}
              </Badge>
              <Badge variant="outline" className="px-2 py-1 text-[10px] font-bold">
                {isCod ? 'COD' : hasOnlinePayment ? 'Prepaid' : 'Manual'}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {fmtDateTime(order.createdAt)}
              </span>
              <span>·</span>
              <span>{totals.units} item{totals.units === 1 ? '' : 's'}</span>
              <span>·</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{money(totals.total)}</span>
              <span>·</span>
              <span>{sourceLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInvoiceReady(false);
              setInvoiceDownloading(false);
              setInvoiceOpen(true);
            }}
          >
            <FileText className="mr-1.5 h-4 w-4" /> Tax invoice
          </Button>
          {canConfirmPayment && (
            <Button
              size="sm"
              onClick={openConfirmPaymentDialog}
              className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
            >
              <BadgeCheck className="mr-1.5 h-4 w-4" />
              {isCod ? 'Mark COD collected' : 'Confirm payment'}
            </Button>
          )}
          {isManualPayment && !isOrderClosed && order.status !== OrderStatus.DELIVERED && (
            <Button variant="outline" size="sm" onClick={openUpdateStatusDialog}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Update status
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadOrder(true)}
            disabled={refreshing}
            aria-label="Refresh order"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More order actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Order actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => copy(order.orderNumber, 'Order number')}>
                <ClipboardCopy className="mr-2 h-4 w-4" /> Copy order number
              </DropdownMenuItem>
              {hasOnlinePayment && !isOrderClosed && order.status !== OrderStatus.DELIVERED && (
                <DropdownMenuItem onClick={openUpdateStatusDialog}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Manual status override
                </DropdownMenuItem>
              )}
              {hasOnlinePayment && !isOrderClosed && order.paymentStatus === PaymentStatus.PENDING && (
                <DropdownMenuItem onClick={openConfirmPaymentDialog}>
                  <BadgeCheck className="mr-2 h-4 w-4" /> Manual payment override
                </DropdownMenuItem>
              )}
              {canRefund && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={openRefundDialog}>
                    <Undo2 className="mr-2 h-4 w-4" /> Refund order
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {notice && (
        <div className={cn('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs', noticeTone(notice.tone))}>
          {notice.icon}
          <div>
            <p className="font-bold">{notice.title}</p>
            <p className="mt-0.5 opacity-90">{notice.body}</p>
          </div>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Items */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white pb-3 dark:from-slate-900/60 dark:to-slate-950">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                    Items
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {totals.units}
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Product snapshots exactly as ordered.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subtotal</div>
                  <div className="text-base font-black">{money(totals.itemsSubtotal)}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 p-0 dark:divide-slate-800">
              {order.items.map((item, index) => {
                const populated = typeof item.productId === 'object' && item.productId ? (item.productId as any) : null;
                const product = populated || item.product || null;
                const productId = product?._id || (typeof item.productId === 'string' ? item.productId : '');
                const productName = product?.name || 'Product unavailable';
                const productHref = productId ? `/admin/products/${productId}` : '/admin/products';
                const thumb = imageUrl(product?.images as any);
                const description = cleanText(product?.description || product?.shortDescription);
                const mrp = Number(product?.compareAtPrice || 0);
                const savings = mrp > item.price ? (mrp - item.price) * item.quantity : 0;
                const stock = typeof product?.stock === 'number' ? product.stock : undefined;

                return (
                  <div key={`${productId}-${index}`} className="flex gap-3.5 p-4 sm:p-5">
                    <ItemThumb src={thumb} name={productName} href={productHref} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={productHref}
                            className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 hover:underline dark:text-white"
                          >
                            {productName}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {product?.sku && (
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {product.sku}
                              </span>
                            )}
                            {item.variations?.map((variation) => (
                              <span
                                key={`${variation.name}-${variation.value}`}
                                className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              >
                                {variation.name}: {variation.value}
                              </span>
                            ))}
                            {typeof stock === 'number' && (
                              <span
                                className={cn(
                                  'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                                  stock > 0
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                )}
                              >
                                {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                              </span>
                            )}
                          </div>
                        </div>
                        {product?.slug && (
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-slate-900 dark:hover:text-white"
                          >
                            Storefront <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </div>

                      {description && (
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                        <span className="font-semibold">
                          {item.quantity} × {money(item.price)}
                        </span>
                        {mrp > item.price && (
                          <span className="text-muted-foreground line-through">{money(mrp)}</span>
                        )}
                        {savings > 0 && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Save {money(savings)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-sm font-black">{money(item.subtotal)}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">
                        {item.quantity} unit{item.quantity === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="justify-between border-t bg-slate-50/60 px-4 py-3 text-xs dark:bg-slate-900/40 sm:px-5">
              <span className="text-muted-foreground">
                {totals.units} unit{totals.units === 1 ? '' : 's'} · {order.items.length} line item
                {order.items.length === 1 ? '' : 's'}
              </span>
              <span className="font-black">{money(totals.itemsSubtotal)}</span>
            </CardFooter>
          </Card>

          {/* Shipment */}
          <OrderShipmentPanel order={order} onOrderChanged={() => loadOrder(true)} />

          {/* Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                    <History className="h-4 w-4" />
                  </span>
                  Activity
                </CardTitle>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {timeline.length} event{timeline.length === 1 ? '' : 's'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
                  No activity has been recorded yet.
                </p>
              ) : (
                <>
                  <ol className="relative space-y-0">
                    {visibleTimeline.map((event, index) => (
                      <li key={event._id || `${event.createdAt}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                        {index < visibleTimeline.length - 1 && (
                          <span className="absolute left-[13px] top-7 h-full w-px bg-slate-200 dark:bg-slate-800" />
                        )}
                        <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                          {timelineIcon(event.type)}
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{event.event}</p>
                          {event.description && (
                            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{event.description}</p>
                          )}
                          <p className="mt-1 text-[10px] text-muted-foreground">{fmtDateTime(event.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {timeline.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 px-2 text-xs"
                      onClick={() => setShowAllTimeline((value) => !value)}
                    >
                      {showAllTimeline ? 'Show less' : `Show all ${timeline.length} events`}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:sticky lg:top-4">
          {/* Payment + totals */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  Payment
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn('text-[10px] font-black uppercase tracking-wide', paymentTone(order.paymentStatus))}
                >
                  {paymentStatusLabel}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-3xl font-black tracking-tight">{money(order.total)}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {paymentMethodLabel}
                  {hasOnlinePayment && order.razorpayPaymentId ? ' · payment captured' : ''}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Items subtotal</span>
                  <span className="font-semibold">{money(totals.itemsSubtotal)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      Discount
                      {order.discountCode && (
                        <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {order.discountCode}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">−{money(totals.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    Shipping
                    {order.shippingCourier && (
                      <span className="block text-[10px] text-slate-600 dark:text-slate-400">
                        {order.shippingCourier}
                        {order.shippingEtd ? ` · ${order.shippingEtd}` : ''}
                      </span>
                    )}
                    {order.shippingActualCost ? (
                      <span className="block text-[10px] text-slate-600 dark:text-slate-400">
                        Courier cost {money(order.shippingActualCost)}
                        {order.shippingRateSource ? ` · ${statusLabel(order.shippingRateSource)}` : ''}
                      </span>
                    ) : null}
                  </span>
                  <span className={cn('font-semibold', totals.shipping === 0 && 'text-emerald-600 dark:text-emerald-400')}>
                    {totals.shipping === 0 ? 'FREE' : money(totals.shipping)}
                  </span>
                </div>
                {totals.tax > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-semibold">{money(totals.tax)}</span>
                  </div>
                )}
                {Math.abs(totals.adjustment) >= 0.01 && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Other adjustment</span>
                    <span className="font-semibold">
                      {totals.adjustment > 0 ? '+' : '−'}
                      {money(Math.abs(totals.adjustment))}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold">Total</span>
                  <span className="font-black">{money(totals.total)}</span>
                </div>
              </div>

              {isCod && !isOrderClosed && order.paymentStatus === PaymentStatus.PENDING && (
                <div
                  className={cn(
                    'rounded-xl border p-3 text-xs',
                    totals.advancePending > 0
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30'
                      : 'border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/30'
                  )}
                >
                  {totals.advanceRequired > 0 && (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 dark:text-slate-300">COD advance required</span>
                        <span className="font-bold">{money(totals.advanceRequired)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-slate-700 dark:text-slate-300">Advance paid</span>
                        <span className="font-bold">{money(totals.advance)}</span>
                      </div>
                      {totals.advancePending > 0 && (
                        <div className="mt-1 flex items-center justify-between gap-2 text-amber-800 dark:text-amber-300">
                          <span className="font-semibold">Advance pending</span>
                          <span className="font-black">{money(totals.advancePending)}</span>
                        </div>
                      )}
                      <Separator className="my-2 bg-current opacity-10" />
                    </>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-700 dark:text-slate-300">Balance on delivery</span>
                    <span className="font-black">{money(totals.balance)}</span>
                  </div>
                </div>
              )}

              {order.razorpayPaymentId && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Razorpay payment</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <code className="min-w-0 truncate font-mono text-[11px]">{order.razorpayPaymentId}</code>
                    <button
                      type="button"
                      onClick={() => copy(order.razorpayPaymentId!, 'Payment ID')}
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
                      aria-label="Copy payment ID"
                    >
                      <ClipboardCopy className="h-3 w-3" />
                    </button>
                  </div>
                  {order.razorpayOrderId && (
                    <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                      Order {order.razorpayOrderId}
                    </div>
                  )}
                </div>
              )}

              {order.paymentNotes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-muted-foreground dark:border-slate-800 dark:bg-slate-900/50">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Payment note: </span>
                  {order.paymentNotes}
                </div>
              )}

              {(order.refundAmount || (order.refundStatus && order.refundStatus !== 'none')) && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs dark:border-orange-900/60 dark:bg-orange-950/30">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-orange-900 dark:text-orange-200">Refund</span>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-800 dark:bg-orange-900/40 dark:text-orange-200">
                      {statusLabel(order.refundStatus || 'pending')}
                    </span>
                  </div>
                  {order.refundAmount ? (
                    <div className="mt-1 flex items-center justify-between gap-2 text-orange-800 dark:text-orange-200">
                      <span>Refunded amount</span>
                      <span className="font-black">{money(order.refundAmount)}</span>
                    </div>
                  ) : null}
                  {order.refundMethod && (
                    <p className="mt-1 text-[11px] text-orange-800/80 dark:text-orange-200/80">
                      Method: {order.refundMethod === 'source' ? 'Original payment source' : statusLabel(order.refundMethod)}
                      {order.refundReference ? ` · Ref ${order.refundReference}` : ''}
                    </p>
                  )}
                  {order.refundNotes && (
                    <p className="mt-1 text-[11px] text-orange-800/80 dark:text-orange-200/80">{order.refundNotes}</p>
                  )}
                  {order.refundStatus === 'processing' && (
                    <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-orange-200 bg-white/70 p-2 dark:border-orange-900/60 dark:bg-orange-950/20">
                      <p className="text-[10px] text-orange-800 dark:text-orange-200">
                        Send the money, then record the reference to close this refund.
                      </p>
                      <div className="flex gap-1.5">
                        <Input
                          value={completeReference}
                          onChange={(event) => setCompleteReference(event.target.value)}
                          placeholder="UTR / transaction reference"
                          className="h-8 bg-white text-[11px] dark:bg-slate-900"
                        />
                        <Button
                          size="sm"
                          className="h-8 shrink-0 bg-orange-600 text-[11px] font-bold hover:bg-orange-700"
                          onClick={handleCompleteRefund}
                          disabled={actionLoading}
                        >
                          {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Complete'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl border border-dashed p-2.5 text-[10px] text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>
                  {isOrderClosed
                    ? 'This order is closed. No payment action is required.'
                    : order.paymentStatus === PaymentStatus.CONFIRMED
                      ? hasOnlinePayment
                        ? 'Payment confirmed by Razorpay. Delivery status is confirmed by Shiprocket.'
                        : 'Payment confirmed manually. Refunds can be recorded from More.'
                      : order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED ||
                          order.paymentStatus === PaymentStatus.REFUNDED
                        ? 'A refund has been recorded against this payment.'
                        : hasOnlinePayment
                          ? 'Online payments are confirmed by Razorpay. Delivery status is confirmed by Shiprocket.'
                          : isCod
                            ? 'COD is collected by the courier. Confirm it here once cash is received.'
                            : 'Manual payment. Confirm it here after the transfer is verified.'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer + address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                  <User className="h-4 w-4" />
                </span>
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white dark:bg-slate-100 dark:text-slate-900">
                  {initials || <User className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{customerName}</div>
                  {customerEmail && <div className="truncate text-[11px] text-muted-foreground">{customerEmail}</div>}
                  {customerPhone && <div className="text-[11px] text-muted-foreground">{customerPhone}</div>}
                </div>
              </div>

              {(customerPhone || customerEmail) && (
                <div className="grid grid-cols-3 gap-1.5">
                  {customerPhone && (
                    <Button asChild size="sm" variant="outline" className="h-8 px-2 text-[11px]">
                      <a href={`tel:${customerPhone}`}>
                        <Phone className="mr-1 h-3.5 w-3.5" /> Call
                      </a>
                    </Button>
                  )}
                  {customerPhone && waPhone && (
                    <Button asChild size="sm" variant="outline" className="h-8 px-2 text-[11px]">
                      <a
                        href={`https://wa.me/91${waPhone}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="mr-1 h-3.5 w-3.5" /> WhatsApp
                      </a>
                    </Button>
                  )}
                  {customerEmail && (
                    <Button asChild size="sm" variant="outline" className="h-8 px-2 text-[11px]">
                      <a href={`mailto:${customerEmail}`}>
                        <Mail className="mr-1 h-3.5 w-3.5" /> Email
                      </a>
                    </Button>
                  )}
                </div>
              )}

              <Separator />

              <div>
                <div className="mb-1.5 flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  <MapPin className="h-3 w-3" /> Shipping address
                </div>
                {address ? (
                  <address className="not-italic text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <div className="font-semibold text-slate-900 dark:text-white">{address.street}</div>
                    <div>
                      {address.city}, {address.state} — {address.zip}
                    </div>
                    <div>{address.country}</div>
                  </address>
                ) : (
                  <p className="text-xs text-muted-foreground">No shipping address on this order.</p>
                )}
                {address && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => copy(addressLine, 'Address')}
                    >
                      <ClipboardCopy className="mr-1 h-3 w-3" /> Copy
                    </Button>
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-[11px]">
                      <a href={mapsUrl} target="_blank" rel="noreferrer">
                        <Navigation className="mr-1 h-3 w-3" /> Maps
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order meta */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Order details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
              <MetaRow label="Placed">{fmtDateTime(order.createdAt)}</MetaRow>
              <MetaRow label="Updated">{fmtDateTime(order.updatedAt)}</MetaRow>
              <MetaRow label="Source">{sourceLabel}</MetaRow>
              <MetaRow label="Priority">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                    order.priority === 'urgent' || order.priority === 'high'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {statusLabel(order.priority || 'normal')}
                </span>
              </MetaRow>
              {order.internalReference && <MetaRow label="Reference">{order.internalReference}</MetaRow>}
              {order.assignedToName && <MetaRow label="Assigned to">{order.assignedToName}</MetaRow>}
              {order.tags && order.tags.length > 0 && (
                <MetaRow label="Tags">
                  <span className="flex flex-wrap justify-end gap-1">
                    {order.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                </MetaRow>
              )}
              {order.customerNotes && (
                <div className="pt-2">
                  <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    Customer note
                  </div>
                  <p className="mt-1 rounded-lg bg-amber-50 p-2 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                    {order.customerNotes}
                  </p>
                </div>
              )}
              {order.notes && order.notes.length > 0 && (
                <div className="pt-2">
                  <div className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    Internal notes ({order.notes.length})
                  </div>
                  <div className="mt-1 space-y-1">
                    {[...order.notes]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 3)
                      .map((note, index) => (
                        <div
                          key={note._id || `${note.createdAt}-${index}`}
                          className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] dark:border-slate-800 dark:bg-slate-900/50"
                        >
                          <p className="leading-relaxed text-slate-700 dark:text-slate-300">{note.content}</p>
                          <p className="mt-1 text-[9px] text-muted-foreground">
                            {note.createdByName ||
                              (typeof note.createdBy === 'object' ? note.createdBy?.name : '') ||
                              'System'}{' '}
                            · {fmtDateTime(note.createdAt)}
                          </p>
                        </div>
                      ))}
                  </div>
                  {order.notes.length > 3 && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      +{order.notes.length - 3} more note{order.notes.length - 3 === 1 ? '' : 's'}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ----------------------------- dialogs ----------------------------- */}

      {/* Update status */}
      <Dialog open={updateStatusDialog} onOpenChange={setUpdateStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update order status</DialogTitle>
            <DialogDescription>
              {hasOnlinePayment
                ? 'Payment and delivery normally update automatically. Use this only for exceptions.'
                : `Set the next state for #${order.orderNumber}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {hasOnlinePayment && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Razorpay confirms payment and Shiprocket confirms delivery automatically. A manual override can desync
                the order from the courier.
              </div>
            )}
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OrderStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Internal note (optional)</Label>
              <Textarea
                value={statusNotes}
                onChange={(event) => setStatusNotes(event.target.value)}
                placeholder="Why is this status changing?"
                className="mt-1 min-h-[70px] text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm / override payment */}
      <Dialog open={confirmPaymentDialog} onOpenChange={setConfirmPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hasOnlinePayment
                ? 'Manual payment override'
                : isCod
                  ? 'Mark COD payment collected'
                  : 'Confirm payment'}
            </DialogTitle>
            <DialogDescription>
              {hasOnlinePayment
                ? 'Razorpay should confirm this automatically. Only proceed if you have verified the payment in the Razorpay dashboard.'
                : `Record the payment of ${money(isCod ? totals.balance : totals.total)} for #${order.orderNumber}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {isCod && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-[11px] text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200">
                <p>
                  Collect <strong>{money(totals.balance)}</strong> from the customer on delivery.
                </p>
                <p className="mt-1 opacity-80">
                  Advance paid: <strong>{money(totals.advance)}</strong>
                  {totals.advanceRequired > 0 ? ` of ${money(totals.advanceRequired)}` : ''}
                  {totals.advancePending > 0 ? ` · ${money(totals.advancePending)} advance still pending` : ''}
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs">Note (optional)</Label>
              <Textarea
                value={paymentNotes}
                onChange={(event) => setPaymentNotes(event.target.value)}
                placeholder={isCod ? 'Cash received by courier…' : 'Transaction reference or note…'}
                className="mt-1 min-h-[70px] text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isCod ? 'Mark collected' : 'Confirm payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund */}
      <Dialog
        open={refundDialog}
        onOpenChange={(open) => {
          setRefundDialog(open);
          if (!open) {
            setRefundContextData(null);
            setRefundContextLoading(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Refund order</DialogTitle>
            <DialogDescription>
              Refund #{order.orderNumber}. Enter an additional amount — previous refunds stay in the ledger.
            </DialogDescription>
          </DialogHeader>

          {refundContextLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Calculating refundable balance…
            </div>
          ) : refundContextData ? (
            <div className="space-y-3 py-2">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Order total</p>
                    <p className="font-semibold">{money(refundContextData.order.total)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Collected</p>
                    <p className="font-semibold">{money(refundContextData.context.collected)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Already refunded</p>
                    <p className="font-semibold text-rose-600">{money(refundContextData.context.refunded)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Refundable now</p>
                    <p className="font-bold text-emerald-600">{money(refundContextData.context.refundable)}</p>
                  </div>
                </div>
                {refundContextData.refunds.length > 0 && (
                  <div className="mt-3 space-y-1 border-t pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Refund history</p>
                    {refundContextData.refunds.slice(0, 3).map((refund) => (
                      <div key={refund._id} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate text-muted-foreground">
                          {new Date(refund.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {refund.method === 'razorpay' ? 'Razorpay' : refund.destination.toUpperCase()}
                        </span>
                        <span className="shrink-0 font-medium">
                          {money(refund.amount)} · <span className="capitalize text-muted-foreground">{refund.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(refundContextData.context.activeRefund || refundContextData.context.blocker) && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    {refundContextData.context.activeRefund
                      ? `A refund of ${money(refundContextData.context.activeRefund.amount)} is already ${refundContextData.context.activeRefund.status}. Complete or wait for it before refunding again.`
                      : refundContextData.context.blocker}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-xs">Additional refund amount (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  max={refundContextData.context.refundable}
                  step="0.01"
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                  placeholder={refundContextData.context.refundable > 0 ? `Max ${money(refundContextData.context.refundable)}` : 'No refundable balance'}
                  className="mt-1"
                  disabled={!refundContextData.context.canRefund}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Leave blank to refund the remaining {money(refundContextData.context.refundable)}.
                </p>
              </div>

              <div>
                <Label className="text-xs">Refund method</Label>
                <Select
                  value={refundContextData.context.online ? 'source' : refundMethod}
                  onValueChange={(value) => setRefundMethod(value as 'source' | 'upi' | 'bank')}
                  disabled={refundContextData.context.online || !refundContextData.context.canRefund}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="source">
                      {refundContextData.context.online ? 'Original payment source' : 'Manual / cash'}
                    </SelectItem>
                    {!refundContextData.context.online && <SelectItem value="upi">UPI transfer</SelectItem>}
                    {!refundContextData.context.online && <SelectItem value="bank">Bank transfer</SelectItem>}
                  </SelectContent>
                </Select>
                {refundContextData.context.online ? (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Online money is refunded through Razorpay to the original source.
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Manual refunds remain in processing until you record the settlement reference.
                  </p>
                )}
              </div>

              {!refundContextData.context.online && refundMethod === 'upi' && (
                <div>
                  <Label className="text-xs">UPI ID</Label>
                  <Input
                    value={refundUpiId}
                    onChange={(event) => setRefundUpiId(event.target.value)}
                    placeholder="name@okbank"
                    className="mt-1"
                  />
                </div>
              )}
              {!refundContextData.context.online && refundMethod === 'bank' && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Account holder name</Label>
                    <Input
                      value={refundBankName}
                      onChange={(event) => setRefundBankName(event.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Account number</Label>
                    <Input
                      value={refundBankAccount}
                      onChange={(event) => setRefundBankAccount(event.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">IFSC</Label>
                    <Input
                      value={refundBankIfsc}
                      onChange={(event) => setRefundBankIfsc(event.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs">Refund notes *</Label>
                <Textarea
                  value={refundNotes}
                  onChange={(event) => setRefundNotes(event.target.value.slice(0, 500))}
                  placeholder="Reason and any reference…"
                  className="mt-1 min-h-[70px] text-xs"
                  disabled={!refundContextData.context.canRefund}
                />
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Could not calculate the refundable balance. Close and try again.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={
                actionLoading ||
                refundContextLoading ||
                !refundContextData?.context.canRefund ||
                !refundNotes.trim()
              }
            >
              {actionLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Refund{' '}
              {refundAmount
                ? money(parseFloat(refundAmount))
                : refundContextData
                  ? money(refundContextData.context.refundable)
                  : 'amount'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* In-page tax invoice */}
      <Dialog
        open={invoiceOpen}
        onOpenChange={(open) => {
          setInvoiceOpen(open);
          if (!open) {
            setInvoiceDownloading(false);
            setInvoiceReady(false);
          }
        }}
      >
        <DialogContent className="flex h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-white px-4 py-3 dark:bg-slate-950">
            <div>
              <DialogTitle className="text-sm font-black">Tax invoice</DialogTitle>
              <DialogDescription className="text-[11px]">
                {order.orderNumber} · {money(order.total)} · print or download the exact invoice
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setInvoiceOpen(false)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to order
              </Button>
              <Button size="sm" variant="outline" onClick={printInvoice} disabled={!invoiceReady}>
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
              <Button
                size="sm"
                onClick={downloadInvoice}
                disabled={!invoiceReady || invoiceDownloading}
                className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-600"
              >
                {invoiceDownloading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-4 w-4" />
                )}
                {invoiceDownloading ? 'Preparing…' : 'Download'}
              </Button>
            </div>
          </div>
          <iframe
            ref={invoiceFrameRef}
            src={`/invoice/${order._id}?embed=1`}
            title={`Tax invoice ${order.orderNumber}`}
            className="w-full flex-1 border-0 bg-slate-100"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
