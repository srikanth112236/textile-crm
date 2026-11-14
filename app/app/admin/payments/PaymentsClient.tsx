'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getAllOrders,
  Order,
} from '@/lib/api/orders';
import {
  adminPaymentsApi,
  LedgerPayment,
  PaymentsOverview,
  RefundContextData,
  RefundDestination,
  RefundRecord,
  RefundableOrder,
  RefundSummary,
} from '@/lib/api/adminPayments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/utils/export';
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  CreditCard,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  Undo2,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';

type Tab = 'ledger' | 'cod' | 'refunds';

const inr = (value: number | null | undefined, decimals = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value) || 0);

const inr0 = (value: number | null | undefined) => inr(value, 0);

const dateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const dateOnly = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusTones: Record<string, string> = {
  captured: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  processed: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  processing: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  pending: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
  created: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
  partially_refunded: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  refunded: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300',
  failed: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
  cancelled: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'whitespace-nowrap rounded-md px-1.5 py-0 text-[10px] font-semibold capitalize tracking-wide',
        statusTones[status] || statusTones.cancelled
      )}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-xl font-bold tracking-tight">{value}</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <div className={cn('rounded-lg p-2', tone)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function EmptyTable({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function Pager({
  page,
  pages,
  total,
  label,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  label: string;
  onPage: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-[11px] text-muted-foreground">
      <span>
        {label} · {total} record{total === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" aria-label="Previous page" className="h-7 px-2 text-[11px]" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="px-1 tabular-nums">
          {page} / {Math.max(1, pages)}
        </span>
        <Button variant="outline" size="sm" aria-label="Next page" className="h-7 px-2 text-[11px]" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function PaymentsClient({ initialTab = 'ledger' }: { initialTab?: Tab }) {
  const router = useRouter();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [overview, setOverview] = useState<PaymentsOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [ledger, setLedger] = useState<LedgerPayment[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPages, setLedgerPages] = useState(1);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerStatus, setLedgerStatus] = useState('');
  const [ledgerPurpose, setLedgerPurpose] = useState('');
  const [ledgerSearchInput, setLedgerSearchInput] = useState('');
  const [ledgerSearch, setLedgerSearch] = useState('');

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [codSearch, setCodSearch] = useState('');
  const [codStatus, setCodStatus] = useState('');

  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [refundsLoading, setRefundsLoading] = useState(false);
  const [refundPage, setRefundPage] = useState(1);
  const [refundPages, setRefundPages] = useState(1);
  const [refundTotal, setRefundTotal] = useState(0);
  const [refundStatus, setRefundStatus] = useState('');
  const [refundSearchInput, setRefundSearchInput] = useState('');
  const [refundSearch, setRefundSearch] = useState('');
  const [refundSummary, setRefundSummary] = useState<RefundSummary | null>(null);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundContext, setRefundContext] = useState<RefundContextData | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [refundableOrders, setRefundableOrders] = useState<RefundableOrder[]>([]);
  const [refundableLoading, setRefundableLoading] = useState(false);
  const [refundOrderSearch, setRefundOrderSearch] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState<RefundDestination>('source');
  const [refundUpiId, setRefundUpiId] = useState('');
  const [refundBankName, setRefundBankName] = useState('');
  const [refundBankAccount, setRefundBankAccount] = useState('');
  const [refundBankIfsc, setRefundBankIfsc] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const [completeOpen, setCompleteOpen] = useState<RefundRecord | null>(null);
  const [completeReference, setCompleteReference] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      setOverview(await adminPaymentsApi.overview());
    } catch (error: any) {
      toast({
        title: 'Could not load payment summary',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setOverviewLoading(false);
    }
  }, [toast]);

  const loadLedger = useCallback(async () => {
    try {
      setLedgerLoading(true);
      const data = await adminPaymentsApi.ledger({
        page: ledgerPage,
        limit: 20,
        status: ledgerStatus || undefined,
        purpose: ledgerPurpose || undefined,
        search: ledgerSearch || undefined,
      });
      setLedger(data.payments || []);
      setLedgerPages(data.pagination?.pages || 1);
      setLedgerTotal(data.pagination?.total || 0);
    } catch (error: any) {
      toast({
        title: 'Ledger failed',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerPage, ledgerStatus, ledgerPurpose, ledgerSearch, toast]);

  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const res = await getAllOrders(1, 100);
      setOrders(res.data.orders || []);
    } catch {
      /* COD table is supplementary */
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadRefunds = useCallback(async () => {
    try {
      setRefundsLoading(true);
      const data = await adminPaymentsApi.refunds({
        page: refundPage,
        limit: 20,
        status: refundStatus || undefined,
        search: refundSearch || undefined,
      });
      setRefunds(data.refunds || []);
      setRefundPages(data.pagination?.pages || 1);
      setRefundTotal(data.pagination?.total || 0);
      setRefundSummary(data.summary || null);
    } catch (error: any) {
      toast({
        title: 'Refunds failed',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setRefundsLoading(false);
    }
  }, [refundPage, refundStatus, refundSearch, toast]);

  useEffect(() => {
    loadOverview();
    loadOrders();
  }, [loadOverview, loadOrders]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  useEffect(() => {
    if (tab === 'refunds') loadRefunds();
  }, [tab, loadRefunds]);

  const loadRefundableOrders = useCallback(async (search = '') => {
    try {
      setRefundableLoading(true);
      const data = await adminPaymentsApi.refundableOrders({ search: search || undefined });
      setRefundableOrders(data.orders || []);
    } catch (error: any) {
      toast({
        title: 'Could not load refundable orders',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setRefundableLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!refundOpen || refundOrderId) return;
    const timer = window.setTimeout(() => loadRefundableOrders(refundOrderSearch), 250);
    return () => window.clearTimeout(timer);
  }, [refundOpen, refundOrderId, refundOrderSearch, loadRefundableOrders]);

  const applyContext = (data: RefundContextData) => {
    setRefundContext(data);
    setRefundAmount(data.context.refundable > 0 ? data.context.refundable.toFixed(2) : '');
    setRefundMethod(data.context.online ? 'source' : 'upi');
    setRefundNotes('');
    setRefundUpiId('');
    setRefundBankName('');
    setRefundBankAccount('');
    setRefundBankIfsc('');
  };

  const loadRefundContext = async (orderId: string) => {
    try {
      setContextLoading(true);
      const data = await adminPaymentsApi.refundContext(orderId);
      applyContext(data);
    } catch (error: any) {
      toast({
        title: 'Could not load refund details',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
      setRefundOrderId(null);
    } finally {
      setContextLoading(false);
    }
  };

  const openRefund = (orderId?: string) => {
    setRefundOpen(true);
    setRefundOrderId(orderId || null);
    setRefundContext(null);
    setRefundOrderSearch('');
    setRefundableOrders([]);
    if (orderId) loadRefundContext(orderId);
  };

  const closeRefund = (open: boolean) => {
    setRefundOpen(open);
    if (!open) {
      setRefundOrderId(null);
      setRefundContext(null);
      setRefundSubmitting(false);
    }
  };

  const refreshAfterRefund = () => {
    loadOverview();
    loadLedger();
    loadOrders();
    if (tab === 'refunds') loadRefunds();
  };

  const handleCreateRefund = async () => {
    if (!refundContext || !refundOrderId) return;
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'Enter a valid refund amount', variant: 'destructive' });
      return;
    }
    if (amount > refundContext.context.refundable + 0.009) {
      toast({
        title: 'Amount is above the refundable balance',
        description: `Maximum refundable is ${inr(refundContext.context.refundable)}.`,
        variant: 'destructive',
      });
      return;
    }
    if (!refundNotes.trim()) {
      toast({ title: 'Add a refund note', description: 'Refund notes are required for the audit trail.', variant: 'destructive' });
      return;
    }
    if (!refundContext.context.online && refundMethod === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(refundUpiId.trim())) {
      toast({ title: 'Enter a valid UPI ID', description: 'Example: name@okbank', variant: 'destructive' });
      return;
    }
    if (
      !refundContext.context.online &&
      refundMethod === 'bank' &&
      (!refundBankName.trim() || !refundBankAccount.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(refundBankIfsc.trim().toUpperCase()))
    ) {
      toast({ title: 'Enter complete bank details', description: 'Account name, number and a valid IFSC are required.', variant: 'destructive' });
      return;
    }

    try {
      setRefundSubmitting(true);
      const res = await adminPaymentsApi.createRefund({
        orderId: refundOrderId,
        amount,
        notes: refundNotes.trim(),
        refundMethod: refundContext.context.online ? 'source' : refundMethod,
        upiId: refundMethod === 'upi' ? refundUpiId.trim() : undefined,
        bankAccountName: refundMethod === 'bank' ? refundBankName.trim() : undefined,
        bankAccountNumber: refundMethod === 'bank' ? refundBankAccount.trim() : undefined,
        bankIfsc: refundMethod === 'bank' ? refundBankIfsc.trim().toUpperCase() : undefined,
      });
      toast({
        title: res.message || 'Refund recorded',
        description:
          res.data?.refund?.status === 'processing'
            ? 'It will stay in the refund queue until it is settled.'
            : `${inr(amount)} refunded for ${refundContext.order.orderNumber}.`,
      });
      closeRefund(false);
      refreshAfterRefund();
    } catch (error: any) {
      toast({
        title: 'Refund failed',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setRefundSubmitting(false);
    }
  };

  const handleCompleteRefund = async () => {
    if (!completeOpen || !completeReference.trim()) {
      toast({ title: 'Add the settlement reference', variant: 'destructive' });
      return;
    }
    try {
      setCompleteSubmitting(true);
      const res = await adminPaymentsApi.completeRefund(completeOpen._id, {
        reference: completeReference.trim(),
        notes: completeNotes.trim() || undefined,
        orderId: completeOpen.orderId,
      });
      toast({ title: res.message || 'Refund completed', description: `${inr(completeOpen.amount)} · ${completeOpen.orderNumber}` });
      setCompleteOpen(null);
      setCompleteReference('');
      setCompleteNotes('');
      refreshAfterRefund();
    } catch (error: any) {
      toast({
        title: 'Could not complete refund',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setCompleteSubmitting(false);
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const applyLedgerSearch = () => {
    const next = ledgerSearchInput.trim();
    setLedgerPage(1);
    if (next === ledgerSearch) loadLedger();
    else setLedgerSearch(next);
  };

  const applyRefundSearch = () => {
    const next = refundSearchInput.trim();
    setRefundPage(1);
    if (next === refundSearch) loadRefunds();
    else setRefundSearch(next);
  };

  const codOrders = useMemo(() => {
    const query = codSearch.trim().toLowerCase();
    return orders
      .filter((order: any) => order.paymentMethod === 'cod')
      .filter((order: any) => (codStatus ? order.paymentStatus === codStatus : true))
      .filter((order: any) => {
        if (!query) return true;
        const customer = typeof order.userId === 'object' ? order.userId?.name || order.userId?.email || '' : '';
        return `${order.orderNumber} ${customer} ${order.shippingAddress?.fullName || ''}`.toLowerCase().includes(query);
      });
  }, [orders, codSearch, codStatus]);

  const handleExportLedger = () => {
    if (!ledger.length) {
      toast({ title: 'Nothing to export on this page' });
      return;
    }
    const rows = ledger.map((payment) => {
      const order = typeof payment.orderId === 'object' ? payment.orderId : null;
      return {
        Date: dateTime(payment.createdAt),
        Order: order?.orderNumber || payment.orderNumber || '',
        'Razorpay Order': payment.razorpayOrderId,
        'Razorpay Payment': payment.razorpayPaymentId || '',
        Method: payment.method || '',
        Purpose: payment.purpose,
        Amount: payment.amount,
        Refunded: payment.refundAmount || 0,
        Status: payment.status,
      };
    });
    exportToCSV(
      rows,
      Object.keys(rows[0]).map((key) => ({ key, label: key })),
      `payments-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const changeTab = (next: Tab) => {
    setTab(next);
    if (next === 'refunds' && refunds.length === 0) loadRefunds();
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-4 px-3 py-4 sm:px-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            <Badge variant="outline" className="rounded-md border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              Live
            </Badge>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Online collections, COD balances, and refunds in one compact view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { loadOverview(); loadLedger(); loadOrders(); if (tab === 'refunds') loadRefunds(); }}>
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', overviewLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportLedger}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export page
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => openRefund()}>
            <Undo2 className="mr-1.5 h-3.5 w-3.5" />
            New refund
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Net online collected"
          value={overview ? inr0(overview.online.netCollected) : '—'}
          hint={overview ? `${inr0(overview.online.capturedAmount)} captured · ${inr0(overview.online.refundedAmount)} refunded` : 'Captured minus refunded'}
          icon={Wallet}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
        />
        <MetricCard
          label="COD to collect"
          value={overview ? inr0(overview.cod.toCollect) : '—'}
          hint={overview ? `${overview.cod.orders} orders · ${inr0(overview.cod.advancePaid)} advance paid` : 'Balance due on delivery'}
          icon={Banknote}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
        />
        <MetricCard
          label="Refunds completed"
          value={overview ? inr0(overview.refunds.completedAmount) : '—'}
          hint={overview ? `${overview.refunds.processingCount} processing · ${overview.refunds.failedCount} failed` : 'Refund ledger'}
          icon={Undo2}
          tone="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
        />
        <MetricCard
          label="Needs attention"
          value={overview ? String(overview.refunds.needsAction + overview.online.failedCount) : '—'}
          hint={overview ? `${overview.refunds.needsAction} refund${overview.refunds.needsAction === 1 ? '' : 's'} to complete · ${overview.online.failedCount} failed payment${overview.online.failedCount === 1 ? '' : 's'}` : 'Refunds and failed payments'}
          icon={ShieldCheck}
          tone="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-lg border bg-muted/30 p-0.5">
          {([
            ['ledger', 'Online ledger', overview?.online.capturedCount],
            ['cod', 'COD', codOrders.length],
            ['refunds', 'Refunds', overview?.refunds.count],
          ] as Array<[Tab, string, number | undefined]>).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => changeTab(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                tab === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
              {count !== undefined && <span className="rounded bg-muted px-1 text-[10px] tabular-nums">{count}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="hidden sm:inline">PAY-01</span>
          <span className="h-1 w-1 rounded-full bg-emerald-500" />
          <span>Gateway and COD reconciliation</span>
        </div>
      </div>

      {tab === 'ledger' && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b px-3 py-2.5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Online payment ledger</p>
                <p className="truncate text-[11px] text-muted-foreground">Razorpay order → payment → signature → captured or failed.</p>
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
              <div className="relative min-w-[180px] flex-1 sm:max-w-[260px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={ledgerSearchInput}
                  onChange={(event) => setLedgerSearchInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && applyLedgerSearch()}
                  placeholder="Order, payment or Razorpay ID"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <select
                value={ledgerStatus}
                onChange={(event) => { setLedgerPage(1); setLedgerStatus(event.target.value); }}
                className="h-8 rounded-md border bg-background px-2 text-xs"
                aria-label="Payment status"
              >
                <option value="">All status</option>
                <option value="captured">Captured</option>
                <option value="partially_refunded">Partially refunded</option>
                <option value="refunded">Refunded</option>
                <option value="created">Created</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={ledgerPurpose}
                onChange={(event) => { setLedgerPage(1); setLedgerPurpose(event.target.value); }}
                className="h-8 rounded-md border bg-background px-2 text-xs"
                aria-label="Payment purpose"
              >
                <option value="">All purposes</option>
                <option value="full">Full payment</option>
                <option value="cod_advance">COD advance</option>
              </select>
              <Button variant="secondary" size="sm" className="h-8 px-2.5 text-xs" onClick={applyLedgerSearch}>
                Apply
              </Button>
            </div>
          </div>

          {ledgerLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading ledger…
            </div>
          ) : ledger.length === 0 ? (
            <EmptyTable icon={CreditCard} title="No online payments" description="Captured Razorpay payments and COD advances will appear here." />
          ) : (
            <AdminTable className="rounded-none border-0">
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>Date</AdminTableHead>
                  <AdminTableHead>Order</AdminTableHead>
                  <AdminTableHead>Payment</AdminTableHead>
                  <AdminTableHead>Method</AdminTableHead>
                  <AdminTableHead className="text-right">Amount</AdminTableHead>
                  <AdminTableHead className="text-right">Refunded</AdminTableHead>
                  <AdminTableHead>Status</AdminTableHead>
                  <AdminTableHead className="text-right">Actions</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {ledger.map((payment) => {
                  const order = typeof payment.orderId === 'object' ? payment.orderId : null;
                  const canRefund =
                    Boolean(order) &&
                    ['captured', 'partially_refunded'].includes(payment.status) &&
                    Number(payment.refundAmount || 0) < payment.amount - 0.01;
                  return (
                    <AdminTableRow key={payment._id}>
                      <AdminTableCell className="whitespace-nowrap text-[11px] text-muted-foreground">
                        {dateTime(payment.createdAt)}
                      </AdminTableCell>
                      <AdminTableCell>
                        {order ? (
                          <Link href={`/admin/orders/${order._id}`} className="font-mono text-xs font-semibold hover:underline">
                            {order.orderNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="max-w-[190px]">
                          <p className="truncate font-mono text-[11px]" title={payment.razorpayPaymentId || payment.razorpayOrderId}>
                            {payment.razorpayPaymentId || payment.razorpayOrderId}
                          </p>
                          {payment.razorpayPaymentId && (
                            <p className="truncate font-mono text-[10px] text-muted-foreground">{payment.razorpayOrderId}</p>
                          )}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[10px] capitalize">
                            {payment.purpose === 'cod_advance' ? 'COD advance' : 'Full'}
                          </Badge>
                          {payment.method && <span className="text-[10px] text-muted-foreground">{payment.method}</span>}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-right text-xs font-semibold tabular-nums">
                        {inr(payment.amount)}
                      </AdminTableCell>
                      <AdminTableCell className={cn('whitespace-nowrap text-right text-xs tabular-nums', payment.refundAmount ? 'text-rose-600' : 'text-muted-foreground')}>
                        {payment.refundAmount ? `−${inr(payment.refundAmount)}` : '—'}
                      </AdminTableCell>
                      <AdminTableCell><StatusBadge status={payment.status} /></AdminTableCell>
                      <AdminTableCell className="text-right">
                        <RowActions
                          label={`Actions for ${order?.orderNumber || payment.razorpayOrderId}`}
                          items={[
                            ...(order
                              ? [{
                                  label: 'View order',
                                  icon: <Eye className="mr-2 h-3.5 w-3.5" />,
                                  onSelect: () => router.push(`/admin/orders/${order._id}`),
                                }]
                              : []),
                            ...(canRefund
                              ? [{
                                  label: 'Issue refund',
                                  icon: <Undo2 className="mr-2 h-3.5 w-3.5" />,
                                  danger: true,
                                  onSelect: () => order && openRefund(order._id),
                                }]
                              : []),
                            ...(payment.razorpayPaymentId
                              ? [{
                                  label: 'Copy payment ID',
                                  icon: <Copy className="mr-2 h-3.5 w-3.5" />,
                                  onSelect: () => copyText(payment.razorpayPaymentId || '', 'Payment ID'),
                                }]
                              : []),
                          ]}
                        />
                      </AdminTableCell>
                    </AdminTableRow>
                  );
                })}
              </AdminTableBody>
            </AdminTable>
          )}
          <Pager page={ledgerPage} pages={ledgerPages} total={ledgerTotal} label="Ledger page" onPage={setLedgerPage} />
        </div>
      )}

      {tab === 'cod' && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b px-3 py-2.5 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Cash on delivery</p>
                <p className="text-[11px] text-muted-foreground">Advance collected vs balance due at delivery.</p>
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
              <div className="relative min-w-[180px] flex-1 sm:max-w-[250px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={codSearch}
                  onChange={(event) => setCodSearch(event.target.value)}
                  placeholder="Order or customer"
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <select
                value={codStatus}
                onChange={(event) => setCodStatus(event.target.value)}
                className="h-8 rounded-md border bg-background px-2 text-xs"
                aria-label="COD payment status"
              >
                <option value="">All payment states</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="partially_refunded">Partially refunded</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
          {ordersLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading COD orders…
            </div>
          ) : codOrders.length === 0 ? (
            <EmptyTable icon={Banknote} title="No COD orders" description="COD orders and their advance balances will appear here." />
          ) : (
            <AdminTable className="rounded-none border-0">
              <AdminTableHeader>
                <AdminTableRow>
                  <AdminTableHead>Order</AdminTableHead>
                  <AdminTableHead>Customer</AdminTableHead>
                  <AdminTableHead className="text-right">Total</AdminTableHead>
                  <AdminTableHead className="text-right">Advance paid</AdminTableHead>
                  <AdminTableHead className="text-right">Balance due</AdminTableHead>
                  <AdminTableHead>Payment</AdminTableHead>
                  <AdminTableHead>Order state</AdminTableHead>
                  <AdminTableHead className="text-right">Actions</AdminTableHead>
                </AdminTableRow>
              </AdminTableHeader>
              <AdminTableBody>
                {codOrders.map((order: any) => {
                  const customer = typeof order.userId === 'object' ? order.userId?.name || order.userId?.email : null;
                  return (
                    <AdminTableRow key={order._id}>
                      <AdminTableCell>
                        <Link href={`/admin/orders/${order._id}`} className="font-mono text-xs font-semibold hover:underline">
                          {order.orderNumber}
                        </Link>
                      </AdminTableCell>
                      <AdminTableCell className="max-w-[180px] truncate text-xs">{customer || order.shippingAddress?.fullName || '—'}</AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-right text-xs font-medium tabular-nums">{inr(order.total)}</AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-right text-xs tabular-nums text-emerald-600">{inr(order.codAdvancePaid || 0)}</AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-right text-xs tabular-nums text-amber-600">{inr(order.codBalance ?? order.total)}</AdminTableCell>
                      <AdminTableCell><StatusBadge status={order.paymentStatus} /></AdminTableCell>
                      <AdminTableCell><StatusBadge status={order.status} /></AdminTableCell>
                      <AdminTableCell className="text-right">
                        <RowActions
                          label={`Actions for ${order.orderNumber}`}
                          items={[
                            {
                              label: 'View order',
                              icon: <Eye className="mr-2 h-3.5 w-3.5" />,
                              onSelect: () => router.push(`/admin/orders/${order._id}`),
                            },
                            {
                              label: 'Issue refund',
                              icon: <Undo2 className="mr-2 h-3.5 w-3.5" />,
                              danger: true,
                              onSelect: () => openRefund(order._id),
                            },
                          ]}
                        />
                      </AdminTableCell>
                    </AdminTableRow>
                  );
                })}
              </AdminTableBody>
            </AdminTable>
          )}
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            Refund requests are capped at money actually collected. COD balance is never refundable before it is collected.
          </div>
        </div>
      )}

      {tab === 'refunds' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
              <p className="mt-1 text-base font-bold">{inr(refundSummary?.completedAmount || 0)}</p>
              <p className="text-[10px] text-muted-foreground">{refundSummary?.completedCount || 0} refunds</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Processing</p>
              <p className="mt-1 text-base font-bold text-amber-600">{inr(refundSummary?.processingAmount || 0)}</p>
              <p className="text-[10px] text-muted-foreground">{refundSummary?.processingCount || 0} in queue</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Needs action</p>
              <p className="mt-1 text-base font-bold text-sky-600">{refundSummary?.needsAction || 0}</p>
              <p className="text-[10px] text-muted-foreground">Manual settlements to complete</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Failed</p>
              <p className="mt-1 text-base font-bold text-rose-600">{refundSummary?.failedCount || 0}</p>
              <p className="text-[10px] text-muted-foreground">{inr(refundSummary?.failedAmount || 0)} retryable</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-2 border-b px-3 py-2.5 lg:flex-row lg:items-center">
              <div className="flex min-w-0 items-center gap-2">
                <Undo2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold">Refund ledger</p>
                  <p className="text-[11px] text-muted-foreground">Every refund transaction, including manual payouts and partial refunds.</p>
                </div>
              </div>
              <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
                <div className="relative min-w-[180px] flex-1 sm:max-w-[250px]">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={refundSearchInput}
                    onChange={(event) => setRefundSearchInput(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && applyRefundSearch()}
                    placeholder="Order, customer or refund ID"
                    className="h-8 pl-8 text-xs"
                  />
                </div>
                <select
                  value={refundStatus}
                  onChange={(event) => { setRefundPage(1); setRefundStatus(event.target.value); }}
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                  aria-label="Refund status"
                >
                  <option value="">All status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Button variant="secondary" size="sm" className="h-8 px-2.5 text-xs" onClick={applyRefundSearch}>
                  Apply
                </Button>
                <Button size="sm" className="h-8 px-2.5 text-xs" onClick={() => openRefund()}>
                  <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Refund
                </Button>
              </div>
            </div>

            {refundsLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading refunds…
              </div>
            ) : refunds.length === 0 ? (
              <EmptyTable icon={Undo2} title="No refunds found" description="Refunds and manual settlements will appear here once created." />
            ) : (
              <AdminTable className="rounded-none border-0">
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead>Date</AdminTableHead>
                    <AdminTableHead>Order</AdminTableHead>
                    <AdminTableHead>Customer</AdminTableHead>
                    <AdminTableHead className="text-right">Amount</AdminTableHead>
                    <AdminTableHead>Route</AdminTableHead>
                    <AdminTableHead>Status</AdminTableHead>
                    <AdminTableHead>Reference</AdminTableHead>
                    <AdminTableHead className="text-right">Actions</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {refunds.map((refund) => (
                    <AdminTableRow key={refund._id}>
                      <AdminTableCell className="whitespace-nowrap text-[11px] text-muted-foreground">{dateOnly(refund.createdAt)}</AdminTableCell>
                      <AdminTableCell>
                        <Link href={`/admin/orders/${refund.orderId}`} className="font-mono text-xs font-semibold hover:underline">
                          {refund.orderNumber}
                        </Link>
                      </AdminTableCell>
                      <AdminTableCell className="max-w-[150px] truncate text-xs">{refund.customer}</AdminTableCell>
                      <AdminTableCell className="whitespace-nowrap text-right text-xs font-semibold tabular-nums">−{inr(refund.amount)}</AdminTableCell>
                      <AdminTableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold capitalize">
                            {refund.method === 'razorpay' ? 'Razorpay source' : refund.destination === 'upi' ? 'Manual UPI' : refund.destination === 'bank' ? 'Manual bank' : 'Manual'}
                          </span>
                          {refund.collected !== undefined && refund.orderTotal !== undefined && refund.collected < refund.orderTotal - 0.01 && (
                            <span className="text-[10px] text-muted-foreground">of {inr(refund.collected)} collected</span>
                          )}
                        </div>
                      </AdminTableCell>
                      <AdminTableCell><StatusBadge status={refund.status} /></AdminTableCell>
                      <AdminTableCell>
                        {refund.reference ? (
                          <button
                            type="button"
                            className="max-w-[140px] truncate font-mono text-[10px] text-muted-foreground hover:text-foreground"
                            onClick={() => copyText(refund.reference || '', 'Reference')}
                            title={refund.reference}
                          >
                            {refund.reference}
                          </button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </AdminTableCell>
                      <AdminTableCell className="text-right">
                        <RowActions
                          label={`Actions for refund ${refund.orderNumber}`}
                          items={[
                            {
                              label: 'View order',
                              icon: <Eye className="mr-2 h-3.5 w-3.5" />,
                              onSelect: () => router.push(`/admin/orders/${refund.orderId}`),
                            },
                            ...(refund.canComplete
                              ? [{
                                  label: 'Mark completed',
                                  icon: <CheckCircle2 className="mr-2 h-3.5 w-3.5" />,
                                  onSelect: () => {
                                    setCompleteOpen(refund);
                                    setCompleteReference('');
                                    setCompleteNotes('');
                                  },
                                }]
                              : []),
                            ...(refund.canRetry
                              ? [{
                                  label: 'Retry refund',
                                  icon: <RotateCcw className="mr-2 h-3.5 w-3.5" />,
                                  onSelect: () => openRefund(refund.orderId),
                                }]
                              : []),
                            ...(refund.reference
                              ? [{
                                  label: 'Copy reference',
                                  icon: <Copy className="mr-2 h-3.5 w-3.5" />,
                                  onSelect: () => copyText(refund.reference || '', 'Reference'),
                                }]
                              : []),
                          ]}
                        />
                      </AdminTableCell>
                    </AdminTableRow>
                  ))}
                </AdminTableBody>
              </AdminTable>
            )}
            <Pager page={refundPage} pages={refundPages} total={refundTotal} label="Refund page" onPage={setRefundPage} />
          </div>
        </div>
      )}

      <Dialog open={refundOpen} onOpenChange={closeRefund}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Undo2 className="h-4 w-4 text-violet-600" />
              {refundContext ? `Refund ${refundContext.order.orderNumber}` : 'New refund'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Refunds are capped at money actually collected. Online payments go back through Razorpay; manual payouts stay in the queue until you confirm settlement.
            </DialogDescription>
          </DialogHeader>

          {!refundOrderId ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={refundOrderSearch}
                  onChange={(event) => setRefundOrderSearch(event.target.value)}
                  placeholder="Search order number, customer or phone"
                  className="h-9 pl-8 text-xs"
                  autoFocus
                />
              </div>
              <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
                {refundableLoading ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Finding refundable orders…
                  </div>
                ) : refundableOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                    <CircleDollarSign className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-sm font-semibold">No refundable orders</p>
                    <p className="mt-1 text-xs text-muted-foreground">An order needs collected money and no refund already in progress.</p>
                  </div>
                ) : (
                  refundableOrders.map((order) => (
                    <button
                      key={order._id}
                      type="button"
                      onClick={() => { setRefundOrderId(order._id); loadRefundContext(order._id); }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-left transition-colors hover:border-violet-300 hover:bg-violet-50/50 dark:hover:border-violet-800 dark:hover:bg-violet-950/20"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold">{order.orderNumber}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {order.customer} · {order.paymentMethod.toUpperCase()} · {order.orderStatus.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-emerald-600">{inr(order.refundable)}</p>
                        <p className="text-[10px] text-muted-foreground">refundable</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Only orders with collected money are shown. COD balance that has not been collected cannot be refunded.
              </p>
            </div>
          ) : contextLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading order…
            </div>
          ) : refundContext ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-bold">{refundContext.order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{refundContext.order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Refundable</p>
                    <p className="text-lg font-bold text-emerald-600">{inr(refundContext.context.refundable)}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Order total</p>
                    <p className="text-xs font-semibold">{inr(refundContext.order.total)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Collected</p>
                    <p className="text-xs font-semibold">{inr(refundContext.context.collected)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Already refunded</p>
                    <p className="text-xs font-semibold text-rose-600">{inr(refundContext.context.refunded)}</p>
                  </div>
                </div>
              </div>

              {refundContext.context.activeRefund ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">A refund is already in progress</p>
                    <p className="mt-0.5">
                      {inr(refundContext.context.activeRefund.amount)} is currently {refundContext.context.activeRefund.status}. Complete or wait for it before creating another refund.
                    </p>
                  </div>
                </div>
              ) : refundContext.context.blocker ? (
                <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{refundContext.context.blocker}</p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="refund-amount" className="text-xs">Refund amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="refund-amount"
                      type="number"
                      min="0.01"
                      max={refundContext.context.refundable}
                      step="0.01"
                      value={refundAmount}
                      onChange={(event) => setRefundAmount(event.target.value)}
                      className="h-9 text-sm"
                      disabled={!refundContext.context.canRefund}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0 text-xs"
                      onClick={() => setRefundAmount(refundContext.context.refundable.toFixed(2))}
                      disabled={!refundContext.context.canRefund}
                    >
                      Full
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Maximum {inr(refundContext.context.refundable)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Refund route</Label>
                  {refundContext.context.online ? (
                    <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-xs">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      Original source via Razorpay
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 rounded-md border bg-muted/30 p-0.5">
                      {([
                        ['upi', 'UPI'],
                        ['bank', 'Bank'],
                        ['source', 'Manual'],
                      ] as Array<[RefundDestination, string]>).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRefundMethod(value)}
                          className={cn(
                            'rounded px-2 py-1.5 text-[11px] font-semibold transition-colors',
                            refundMethod === value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!refundContext.context.online && refundMethod === 'upi' && (
                <div className="space-y-1.5">
                  <Label htmlFor="refund-upi" className="text-xs">UPI ID</Label>
                  <Input
                    id="refund-upi"
                    value={refundUpiId}
                    onChange={(event) => setRefundUpiId(event.target.value)}
                    placeholder="name@okbank"
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {!refundContext.context.online && refundMethod === 'bank' && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="refund-bank-name" className="text-xs">Account holder name</Label>
                    <Input id="refund-bank-name" value={refundBankName} onChange={(event) => setRefundBankName(event.target.value)} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="refund-bank-account" className="text-xs">Account number</Label>
                    <Input id="refund-bank-account" value={refundBankAccount} onChange={(event) => setRefundBankAccount(event.target.value)} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="refund-bank-ifsc" className="text-xs">IFSC</Label>
                    <Input id="refund-bank-ifsc" value={refundBankIfsc} onChange={(event) => setRefundBankIfsc(event.target.value.toUpperCase())} placeholder="HDFC0001234" className="h-9 font-mono text-sm uppercase" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="refund-notes" className="text-xs">Reason / audit note <span className="text-rose-600">*</span></Label>
                <Textarea
                  id="refund-notes"
                  value={refundNotes}
                  onChange={(event) => setRefundNotes(event.target.value.slice(0, 500))}
                  placeholder="Why is this being refunded? Include any customer reference."
                  className="min-h-[72px] text-xs"
                  disabled={!refundContext.context.canRefund}
                />
                <p className="text-right text-[10px] text-muted-foreground">{refundNotes.length}/500</p>
              </div>

              {!refundContext.context.online && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    This creates a <strong>manual payout in processing</strong>. The order is not marked refunded until you complete it with the UPI/bank reference.
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="sm" onClick={() => closeRefund(false)} disabled={refundSubmitting}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateRefund}
                  disabled={refundSubmitting || !refundContext.context.canRefund || !refundAmount || !refundNotes.trim()}
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  {refundSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Undo2 className="mr-1.5 h-3.5 w-3.5" />}
                  {refundContext.context.online ? 'Refund via Razorpay' : 'Record manual refund'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">Could not load this order.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(completeOpen)} onOpenChange={(open) => { if (!open) setCompleteOpen(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Complete manual refund
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm that {completeOpen ? inr(completeOpen.amount) : 'the refund'} has been sent to the customer.
            </DialogDescription>
          </DialogHeader>
          {completeOpen && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-mono font-semibold">{completeOpen.orderNumber}</span>
                </div>
                <div className="mt-1 flex justify-between gap-3">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="max-w-[180px] truncate font-medium">{completeOpen.customer}</span>
                </div>
                <div className="mt-1 flex justify-between gap-3">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-emerald-600">{inr(completeOpen.amount)}</span>
                </div>
                <div className="mt-1 flex justify-between gap-3">
                  <span className="text-muted-foreground">Route</span>
                  <span className="font-medium capitalize">{completeOpen.destination === 'upi' ? 'UPI' : completeOpen.destination === 'bank' ? 'Bank transfer' : 'Manual'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="complete-reference" className="text-xs">Settlement reference <span className="text-rose-600">*</span></Label>
                <Input
                  id="complete-reference"
                  value={completeReference}
                  onChange={(event) => setCompleteReference(event.target.value)}
                  placeholder="UTR, UPI reference or receipt number"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="complete-notes" className="text-xs">Internal note</Label>
                <Textarea
                  id="complete-notes"
                  value={completeNotes}
                  onChange={(event) => setCompleteNotes(event.target.value.slice(0, 500))}
                  placeholder="Optional note for the audit trail"
                  className="min-h-[64px] text-xs"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCompleteOpen(null)} disabled={completeSubmitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCompleteRefund} disabled={completeSubmitting || !completeReference.trim()} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {completeSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
              Mark completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
