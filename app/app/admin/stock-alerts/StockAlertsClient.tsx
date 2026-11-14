'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import {
  ProductStockDialog,
  ProductThumb,
  type AlertProductRef,
  type StockAlertContext,
} from './ProductStockDialog';
import { formatPrice } from '@/lib/utils';
import { alertsApi } from '@/lib/api/alerts';
import {
  ArrowUpRight,
  BellRing,
  Boxes,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Mail,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react';

// =====================================================
// TYPES
// =====================================================

interface BackInStockRow {
  _id: string;
  productId?: AlertProductRef | string;
  productName?: string;
  size?: string;
  contact: string;
  contactType?: 'email' | 'phone';
  whatsappConsent?: boolean;
  notified: boolean;
  createdAt: string;
}

interface PriceAlertRow {
  _id: string;
  productId?: AlertProductRef | string;
  productName?: string;
  targetPrice: number;
  lastNotifiedPrice?: number;
  contact?: string;
  contactType?: 'email' | 'phone';
  active: boolean;
  createdAt: string;
}

type TabKey = 'stock' | 'price';
type StockStatus = 'all' | 'pending' | 'notified';
type PriceStatus = 'all' | 'active' | 'inactive';
type DetailState = { productId: string; product: AlertProductRef; context: StockAlertContext };

// =====================================================
// HELPERS
// =====================================================

function normalizeProduct(value?: AlertProductRef | string | null): AlertProductRef | null {
  if (!value) return null;
  if (typeof value === 'string') return { _id: value };
  return value;
}

function stockHealth(stock: number, threshold: number) {
  if (stock <= 0) return { label: 'Out of stock', dot: 'bg-rose-500', text: 'text-rose-600' };
  if (stock <= Math.max(1, Math.ceil(threshold / 2))) return { label: 'Critical', dot: 'bg-orange-500', text: 'text-orange-600' };
  if (stock <= threshold) return { label: 'Low stock', dot: 'bg-amber-500', text: 'text-amber-600' };
  return { label: 'In stock', dot: 'bg-emerald-500', text: 'text-emerald-600' };
}

function timeAgo(value?: string) {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

function contactIcon(type?: string) {
  if (type === 'phone') return Phone;
  if (type === 'email') return Mail;
  return MessageCircle;
}

// =====================================================
// PAGE
// =====================================================

export default function StockAlertsClient() {
  const router = useRouter();
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<TabKey>('stock');
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const [subs, setSubs] = useState<BackInStockRow[]>([]);
  const [pending, setPending] = useState(0);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertRow[]>([]);
  const [activePriceAlerts, setActivePriceAlerts] = useState(0);

  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');
  const [priceStatus, setPriceStatus] = useState<PriceStatus>('all');
  const [sort, setSort] = useState('newest');

  const [detail, setDetail] = useState<DetailState | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<{ kind: TabKey; id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [stockResult, priceResult] = await Promise.allSettled([
        alertsApi.adminBackInStock(),
        alertsApi.adminPriceAlerts(),
      ]);

      if (stockResult.status === 'fulfilled') {
        setSubs((stockResult.value?.subscriptions as BackInStockRow[]) || []);
        setPending(stockResult.value?.pending || 0);
      }
      if (priceResult.status === 'fulfilled') {
        setPriceAlerts((priceResult.value?.alerts as PriceAlertRow[]) || []);
        setActivePriceAlerts(priceResult.value?.active || 0);
      }

      if (stockResult.status === 'rejected' && priceResult.status === 'rejected') {
        const reason: any = stockResult.reason;
        throw new Error(reason?.response?.data?.error || reason?.message || 'Failed to load alerts');
      }

      setRefreshedAt(new Date());
    } catch (error: any) {
      toast({
        title: 'Load failed',
        description: error?.response?.data?.error || error?.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!copiedId) return;
    const timer = setTimeout(() => setCopiedId(null), 1600);
    return () => clearTimeout(timer);
  }, [copiedId]);

  useEffect(() => {
    setSort('newest');
  }, [tab]);

  const filteredStock = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = subs.filter((row) => {
      const product = normalizeProduct(row.productId);
      const matchesText = !query
        || (row.productName || '').toLowerCase().includes(query)
        || (product?.name || '').toLowerCase().includes(query)
        || (product?.sku || '').toLowerCase().includes(query)
        || (row.contact || '').toLowerCase().includes(query)
        || (row.size || '').toLowerCase().includes(query);
      const matchesStatus = stockStatus === 'all'
        || (stockStatus === 'notified' && row.notified)
        || (stockStatus === 'pending' && !row.notified);
      return matchesText && matchesStatus;
    });

    return [...rows].sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'product') {
        const aName = normalizeProduct(a.productId)?.name || a.productName || '';
        const bName = normalizeProduct(b.productId)?.name || b.productName || '';
        return aName.localeCompare(bName);
      }
      if (sort === 'status') return Number(a.notified) - Number(b.notified);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [subs, search, stockStatus, sort]);

  const filteredPrice = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = priceAlerts.filter((row) => {
      const product = normalizeProduct(row.productId);
      const matchesText = !query
        || (row.productName || '').toLowerCase().includes(query)
        || (product?.name || '').toLowerCase().includes(query)
        || (product?.sku || '').toLowerCase().includes(query)
        || (row.contact || '').toLowerCase().includes(query);
      const matchesStatus = priceStatus === 'all'
        || (priceStatus === 'active' && row.active)
        || (priceStatus === 'inactive' && !row.active);
      return matchesText && matchesStatus;
    });

    return [...rows].sort((a, b) => {
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'product') {
        const aName = normalizeProduct(a.productId)?.name || a.productName || '';
        const bName = normalizeProduct(b.productId)?.name || b.productName || '';
        return aName.localeCompare(bName);
      }
      if (sort === 'gap') {
        const aGap = a.targetPrice - (normalizeProduct(a.productId)?.price || 0);
        const bGap = b.targetPrice - (normalizeProduct(b.productId)?.price || 0);
        return bGap - aGap;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [priceAlerts, search, priceStatus, sort]);

  const stats = useMemo(() => {
    const notified = subs.filter((row) => row.notified).length;
    const email = subs.filter((row) => row.contactType === 'email').length;
    const phone = subs.filter((row) => row.contactType === 'phone').length;
    const whatsapp = subs.filter((row) => row.whatsappConsent).length;
    const uniqueProducts = new Set(subs.map((row) => normalizeProduct(row.productId)?._id || row.productName)).size;
    return {
      total: subs.length,
      notified,
      waiting: subs.length - notified,
      email,
      phone,
      whatsapp,
      uniqueProducts,
      rate: subs.length > 0 ? Math.round((notified / subs.length) * 100) : 0,
    };
  }, [subs]);

  const topProducts = useMemo(() => {
    const rows = tab === 'stock' ? filteredStock : filteredPrice;
    const map = new Map<string, { id: string; product: AlertProductRef | null; name: string; count: number }>();

    rows.forEach((row) => {
      const product = normalizeProduct(row.productId);
      const key = product?._id || row.productName || '—';
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          id: product?._id || '',
          product,
          name: product?.name || row.productName || 'Unknown product',
          count: 1,
        });
      }
    });

    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [tab, filteredStock, filteredPrice]);

  const visibleRows = tab === 'stock' ? filteredStock.length : filteredPrice.length;
  const totalRows = tab === 'stock' ? subs.length : priceAlerts.length;

  const hasFilters = search.trim() !== ''
    || (tab === 'stock' ? stockStatus !== 'all' : priceStatus !== 'all');

  const openDetail = (row: BackInStockRow | PriceAlertRow, kind: TabKey) => {
    const product = normalizeProduct(row.productId);
    if (!product?._id) return;
    const isStock = kind === 'stock';
    const stockRow = row as BackInStockRow;
    const priceRow = row as PriceAlertRow;
    setDetail({
      productId: product._id,
      product,
      context: {
        kind,
        size: isStock ? stockRow.size : undefined,
        contact: isStock ? stockRow.contact : priceRow.contact,
        contactType: isStock ? stockRow.contactType : priceRow.contactType,
        whatsappConsent: isStock ? stockRow.whatsappConsent : undefined,
        notified: isStock ? stockRow.notified : undefined,
        active: isStock ? undefined : priceRow.active,
        targetPrice: isStock ? undefined : priceRow.targetPrice,
        lastNotifiedPrice: isStock ? undefined : priceRow.lastNotifiedPrice,
        createdAt: row.createdAt,
      },
    });
    setDetailOpen(true);
  };

  const copyContact = async (id: string, contact?: string) => {
    if (!contact) return;
    try {
      await navigator.clipboard.writeText(contact);
      setCopiedId(id);
    } catch {
      toast({ title: 'Copy failed', description: 'Your browser blocked clipboard access.', variant: 'destructive' });
    }
  };

  const confirmRemove = async () => {
    if (!pendingDelete) return;
    try {
      setRemoving(true);
      if (pendingDelete.kind === 'stock') {
        await alertsApi.removeBackInStock(pendingDelete.id);
        setSubs((rows) => rows.filter((row) => row._id !== pendingDelete.id));
      } else {
        await alertsApi.removePriceAlert(pendingDelete.id);
        setPriceAlerts((rows) => rows.map((row) => (row._id === pendingDelete.id ? { ...row, active: false } : row)));
      }
      toast({ title: 'Alert removed', description: pendingDelete.name });
      setPendingDelete(null);
    } catch (error: any) {
      toast({
        title: 'Could not remove alert',
        description: error?.response?.data?.error || error?.message,
        variant: 'destructive',
      });
    } finally {
      setRemoving(false);
    }
  };

  const exportCsv = () => {
    const header = tab === 'stock'
      ? ['Product', 'SKU', 'Contact', 'Size', 'Status', 'Requested']
      : ['Product', 'Current price', 'Target price', 'Contact', 'Status', 'Created'];
    const body = tab === 'stock'
      ? filteredStock.map((row) => {
        const product = normalizeProduct(row.productId);
        return [
          product?.name || row.productName || '',
          product?.sku || '',
          row.contact || '',
          row.size || '',
          row.notified ? 'Notified' : 'Pending',
          row.createdAt,
        ];
      })
      : filteredPrice.map((row) => {
        const product = normalizeProduct(row.productId);
        return [
          product?.name || row.productName || '',
          product?.price ?? '',
          row.targetPrice ?? '',
          row.contact || '',
          row.active ? 'Active' : 'Inactive',
          row.createdAt,
        ];
      });

    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `retention-alerts-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export ready', description: `${body.length} rows exported to CSV.` });
  };

  const clearFilters = () => {
    setSearch('');
    setStockStatus('all');
    setPriceStatus('all');
  };

  const kpis = [
    {
      key: 'waiting',
      label: 'Waiting for restock',
      value: stats.waiting,
      sub: `${pending} pending notifications`,
      icon: BellRing,
      tone: 'bg-violet-500/10 text-violet-600',
      active: tab === 'stock' && stockStatus === 'pending',
      onClick: () => { setTab('stock'); setStockStatus('pending'); },
    },
    {
      key: 'notified',
      label: 'Notified customers',
      value: stats.notified,
      sub: `${stats.rate}% delivery rate`,
      icon: CheckCircle2,
      tone: 'bg-emerald-500/10 text-emerald-600',
      active: tab === 'stock' && stockStatus === 'notified',
      onClick: () => { setTab('stock'); setStockStatus('notified'); },
    },
    {
      key: 'requests',
      label: 'Total requests',
      value: stats.total,
      sub: `${stats.uniqueProducts} unique products`,
      icon: Boxes,
      tone: 'bg-slate-500/10 text-slate-600',
      active: tab === 'stock' && stockStatus === 'all',
      onClick: () => { setTab('stock'); setStockStatus('all'); },
    },
    {
      key: 'price',
      label: 'Active price alerts',
      value: activePriceAlerts,
      sub: `${priceAlerts.length} total subscribers`,
      icon: Tag,
      tone: 'bg-amber-500/10 text-amber-600',
      active: tab === 'price',
      onClick: () => { setTab('price'); setPriceStatus('active'); },
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp opted-in',
      value: stats.whatsapp,
      sub: `${stats.email} email · ${stats.phone} phone`,
      icon: MessageCircle,
      tone: 'bg-emerald-500/10 text-emerald-600',
      active: false,
      onClick: () => { setTab('stock'); setStockStatus('all'); },
    },
  ];

  return (
    <div className="w-full space-y-3 px-3 py-3 sm:px-4 lg:px-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
            <BellRing className="h-5 w-5" />
            {stats.waiting > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-950" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-lg font-extrabold leading-none tracking-tight">Retention Alerts</h1>
              <Badge className="rounded-full bg-violet-500/10 px-2 py-0 text-[9px] font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                Live queue
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Back-in-stock and price-drop requests with live stock, warehouse split and full movement history.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={exportCsv} className="h-8 rounded-lg px-2.5 text-[10px] font-extrabold">
            <Download className="mr-1.5 h-3 w-3" /> Export
          </Button>
          <Button
            size="sm"
            onClick={load}
            disabled={loading}
            className="h-8 rounded-lg bg-violet-600 px-3 text-[10px] font-extrabold text-white hover:bg-violet-700"
          >
            <RefreshCw className={`mr-1.5 h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <button
            key={kpi.key}
            type="button"
            onClick={kpi.onClick}
            className={`group flex flex-col rounded-xl border p-2.5 text-left shadow-sm transition-all hover:-translate-y-px hover:shadow ${
              kpi.active
                ? 'border-violet-400 bg-violet-50/50 ring-1 ring-violet-300 dark:border-violet-700 dark:bg-violet-950/20'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${kpi.tone}`}>
                <kpi.icon className="h-3 w-3" />
              </span>
            </div>
            <span className="mt-1 text-xl font-black leading-none tracking-tight">{kpi.value}</span>
            <span className="mt-1 truncate text-[9px] font-medium text-muted-foreground">{kpi.sub}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main queue */}
        <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm dark:border-slate-800">
          {/* Tabs + search */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-2.5 py-2 dark:border-slate-800">
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              {([
                { key: 'stock', label: 'Back-in-stock', count: subs.length, icon: BellRing },
                { key: 'price', label: 'Price drops', count: priceAlerts.length, icon: Tag },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                    tab === item.key
                      ? item.key === 'stock'
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-3 w-3" />
                  {item.label}
                  <span className={`rounded-full px-1 text-[9px] ${tab === item.key ? 'bg-white/20' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <div className="relative w-full min-w-[140px] sm:w-56">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Product, SKU, contact…"
                  className="h-8 rounded-lg pl-8 pr-12 text-[11px]"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1 text-[9px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                    /
                  </kbd>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-2.5 py-1.5 dark:border-slate-800">
            {tab === 'stock'
              ? ([
                { key: 'all', label: 'All', count: subs.length },
                { key: 'pending', label: 'Pending', count: stats.waiting },
                { key: 'notified', label: 'Notified', count: stats.notified },
              ] as const).map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setStockStatus(filter.key)}
                  className={`flex h-6 items-center gap-1 rounded-full border px-2 text-[9px] font-extrabold uppercase tracking-wider transition-colors ${
                    stockStatus === filter.key
                      ? 'border-violet-500 bg-violet-500 text-white'
                      : 'border-slate-200 bg-white text-muted-foreground hover:border-violet-300 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  {filter.label}
                  <span className={`${stockStatus === filter.key ? 'text-white/80' : 'text-slate-400'}`}>{filter.count}</span>
                </button>
              ))
              : ([
                { key: 'all', label: 'All', count: priceAlerts.length },
                { key: 'active', label: 'Active', count: activePriceAlerts },
                { key: 'inactive', label: 'Inactive', count: priceAlerts.length - activePriceAlerts },
              ] as const).map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setPriceStatus(filter.key)}
                  className={`flex h-6 items-center gap-1 rounded-full border px-2 text-[9px] font-extrabold uppercase tracking-wider transition-colors ${
                    priceStatus === filter.key
                      ? 'border-amber-500 bg-amber-500 text-slate-950'
                      : 'border-slate-200 bg-white text-muted-foreground hover:border-amber-300 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  {filter.label}
                  <span className={`${priceStatus === filter.key ? 'text-slate-900/70' : 'text-slate-400'}`}>{filter.count}</span>
                </button>
              ))}

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 rounded-full px-2 text-[9px] font-extrabold text-rose-600 hover:bg-rose-500/10"
              >
                Clear
              </Button>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <span className="hidden text-[9px] font-semibold text-muted-foreground sm:inline">
                {visibleRows} of {totalRows}
              </span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-6 w-[118px] rounded-full border-slate-200 text-[9px] font-bold dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="product">Product A–Z</SelectItem>
                  {tab === 'stock'
                    ? <SelectItem value="status">Status</SelectItem>
                    : <SelectItem value="gap">Largest gap</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-muted/40 dark:border-slate-800">
                  {(tab === 'stock'
                    ? ['Product', 'Stock now', 'Contact', 'Size', 'Status', 'Requested', '']
                    : ['Product', 'Current', 'Target', 'Gap', 'Contact', 'Status', 'Requested', '']
                  ).map((heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="whitespace-nowrap px-2.5 py-1.5 text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && visibleRows === 0 ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-2.5 py-2" colSpan={tab === 'stock' ? 7 : 8}>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                          <div className="flex-1 space-y-1">
                            <div className="h-2.5 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                            <div className="h-2 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : visibleRows === 0 ? (
                  <tr>
                    <td colSpan={tab === 'stock' ? 7 : 8} className="px-3 py-12 text-center">
                      <Package className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-1.5 text-xs font-bold">No alerts match this view</p>
                      <p className="text-[10px] text-muted-foreground">
                        {hasFilters ? 'Try clearing the search or status filter.' : 'New customer requests will appear here automatically.'}
                      </p>
                      {hasFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 h-7 rounded-lg text-[10px] font-extrabold">
                          Clear filters
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : tab === 'stock' ? (
                  filteredStock.map((row) => {
                    const product = normalizeProduct(row.productId);
                    const health = stockHealth(product?.stock ?? 0, product?.lowStockThreshold ?? 10);
                    const ContactIcon = contactIcon(row.contactType);
                    return (
                      <tr
                        key={row._id}
                        onClick={() => openDetail(row, 'stock')}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openDetail(row, 'stock');
                          }
                        }}
                        className="group cursor-pointer transition-colors hover:bg-violet-500/[0.04] focus:bg-violet-500/[0.06] focus:outline-none"
                      >
                        <td className="max-w-[260px] px-2.5 py-2">
                          <div className="flex items-center gap-2">
                            <ProductThumb images={product?.images} name={product?.name} className="h-8 w-8" />
                            <div className="min-w-0">
                              <div className="truncate text-[11px] font-bold group-hover:text-violet-700 dark:group-hover:text-violet-300">
                                {product?.name || row.productName || 'Unknown product'}
                              </div>
                              <div className="truncate font-mono text-[9px] text-muted-foreground">{product?.sku || 'No SKU'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-black ${health.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${health.dot}`} />
                            {product?.stock ?? 0}
                          </span>
                          <div className="text-[9px] text-muted-foreground">{health.label}</div>
                        </td>
                        <td className="max-w-[190px] px-2.5 py-2">
                          <div className="flex items-center gap-1">
                            <ContactIcon className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate text-[10px] font-medium">{row.contact}</span>
                            <button
                              type="button"
                              onClick={(event) => { event.stopPropagation(); copyContact(row._id, row.contact); }}
                              className="shrink-0 text-slate-400 opacity-0 transition-opacity hover:text-violet-600 group-hover:opacity-100"
                              aria-label="Copy contact"
                            >
                              {copiedId === row._id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                          {row.whatsappConsent && (
                            <div className="mt-0.5 text-[9px] font-semibold text-emerald-600">WhatsApp opt-in</div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 text-[10px] font-bold">{row.size || '—'}</td>
                        <td className="whitespace-nowrap px-2.5 py-2">
                          <Badge className={`rounded-full px-2 py-0 text-[8px] font-extrabold uppercase tracking-wider ${row.notified ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
                            {row.notified ? 'Notified' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 text-[10px] text-muted-foreground">{timeAgo(row.createdAt)}</td>
                        <td className="whitespace-nowrap px-2 py-2 text-right">
                          <RowButtons
                            onDetails={(event) => { event.stopPropagation(); openDetail(row, 'stock'); }}
                            onOpen={(event) => { event.stopPropagation(); product?._id && router.push(`/admin/products/${product._id}`); }}
                            onRemove={(event) => {
                              event.stopPropagation();
                              setPendingDelete({ kind: 'stock', id: row._id, name: product?.name || row.productName || 'this request' });
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  filteredPrice.map((row) => {
                    const product = normalizeProduct(row.productId);
                    const current = product?.price || 0;
                    const ContactIcon = contactIcon(row.contactType);
                    return (
                      <tr
                        key={row._id}
                        onClick={() => openDetail(row, 'price')}
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openDetail(row, 'price');
                          }
                        }}
                        className="group cursor-pointer transition-colors hover:bg-amber-500/[0.05] focus:bg-amber-500/[0.07] focus:outline-none"
                      >
                        <td className="max-w-[240px] px-2.5 py-2">
                          <div className="flex items-center gap-2">
                            <ProductThumb images={product?.images} name={product?.name} className="h-8 w-8" />
                            <div className="min-w-0">
                              <div className="truncate text-[11px] font-bold">{product?.name || row.productName || 'Unknown product'}</div>
                              <div className="truncate font-mono text-[9px] text-muted-foreground">{product?.sku || 'No SKU'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 text-[11px] font-bold">{current ? formatPrice(current) : '—'}</td>
                        <td className="whitespace-nowrap px-2.5 py-2 text-[11px] font-black text-amber-600">{formatPrice(row.targetPrice)}</td>
                        <td className="whitespace-nowrap px-2.5 py-2">
                          {current < row.targetPrice ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600">
                              <TrendingDown className="h-3 w-3" /> Reached
                            </span>
                          ) : current === row.targetPrice ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                              <Clock className="h-3 w-3" /> At target
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                              <ArrowUpRight className="h-3 w-3" /> {formatPrice(current - row.targetPrice)} away
                            </span>
                          )}
                        </td>
                        <td className="max-w-[180px] px-2.5 py-2">
                          <div className="flex items-center gap-1">
                            <ContactIcon className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate text-[10px] font-medium">{row.contact || 'in-app only'}</span>
                            {row.contact && (
                              <button
                                type="button"
                                onClick={(event) => { event.stopPropagation(); copyContact(row._id, row.contact); }}
                                className="shrink-0 text-slate-400 opacity-0 transition-opacity hover:text-amber-600 group-hover:opacity-100"
                                aria-label="Copy contact"
                              >
                                {copiedId === row._id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2">
                          <Badge className={`rounded-full px-2 py-0 text-[8px] font-extrabold uppercase tracking-wider ${row.active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                            {row.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 text-[10px] text-muted-foreground">{timeAgo(row.createdAt)}</td>
                        <td className="whitespace-nowrap px-2 py-2 text-right">
                          <RowButtons
                            onDetails={(event) => { event.stopPropagation(); openDetail(row, 'price'); }}
                            onOpen={(event) => { event.stopPropagation(); product?._id && router.push(`/admin/products/${product._id}`); }}
                            onRemove={(event) => {
                              event.stopPropagation();
                              setPendingDelete({ kind: 'price', id: row._id, name: product?.name || row.productName || 'this alert' });
                            }}
                            removeDisabled={!row.active}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 px-2.5 py-1.5 dark:border-slate-800">
            <div className="flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
              <Clock className="h-2.5 w-2.5" />
              {refreshedAt ? `Updated ${timeAgo(refreshedAt.toISOString())}` : 'Syncing…'}
            </div>
            <div className="ml-auto flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
              <Sparkles className="h-2.5 w-2.5 text-violet-500" />
              Click any row for the full stock dossier
              <ChevronRight className="h-2.5 w-2.5" />
            </div>
          </div>
        </div>

        {/* Insight rail */}
        <aside className="space-y-2.5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm dark:border-slate-800">
            <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
              {tab === 'stock' ? <BellRing className="h-3.5 w-3.5 text-violet-500" /> : <Tag className="h-3.5 w-3.5 text-amber-500" />}
              <h2 className="text-[11px] font-extrabold tracking-tight">{tab === 'stock' ? 'Top demand' : 'Most watched'}</h2>
              <span className="ml-auto text-[9px] font-semibold text-muted-foreground">Top 5</span>
            </div>
            <div className="p-2">
              {topProducts.length === 0 ? (
                <p className="px-1 py-4 text-center text-[10px] text-muted-foreground">No products to rank yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {topProducts.map((item) => {
                    const max = topProducts[0]?.count || 1;
                    const canOpen = Boolean(item.id);
                    return (
                      <li key={`${item.id}-${item.name}`}>
                        <button
                          type="button"
                          disabled={!canOpen}
                          onClick={() => {
                            if (!canOpen) return;
                            const row = tab === 'stock'
                              ? filteredStock.find((candidate) => normalizeProduct(candidate.productId)?._id === item.id)
                              : filteredPrice.find((candidate) => normalizeProduct(candidate.productId)?._id === item.id);
                            if (row) openDetail(row, tab);
                          }}
                          className="group flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors enabled:hover:bg-muted/60 disabled:cursor-default"
                        >
                          <ProductThumb images={item.product?.images} name={item.name} className="h-7 w-7" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate text-[10px] font-bold group-hover:text-violet-700 dark:group-hover:text-violet-300">{item.name}</span>
                              <span className="shrink-0 text-[10px] font-black text-violet-600">{item.count}</span>
                            </div>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full rounded-full ${tab === 'stock' ? 'bg-violet-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.max(8, Math.round((item.count / max) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm dark:border-slate-800">
            <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
              <h2 className="text-[11px] font-extrabold tracking-tight">{tab === 'stock' ? 'Channel mix' : 'Price watch'}</h2>
            </div>
            <div className="space-y-2 p-2.5">
              {tab === 'stock' ? (
                <>
                  <ChannelRow label="Email" value={stats.email} total={stats.total} bar="bg-sky-500" icon={Mail} />
                  <ChannelRow label="Phone" value={stats.phone} total={stats.total} bar="bg-violet-500" icon={Phone} />
                  <ChannelRow label="WhatsApp" value={stats.whatsapp} total={stats.total} bar="bg-emerald-500" icon={MessageCircle} />
                </>
              ) : (
                <>
                  <RailStat label="Active alerts" value={`${activePriceAlerts} / ${priceAlerts.length}`} />
                  <RailStat
                    label="Reached target"
                    value={`${priceAlerts.filter((row) => row.active && (normalizeProduct(row.productId)?.price || 0) <= row.targetPrice).length}`}
                    tone="text-emerald-600"
                  />
                  <RailStat
                    label="Avg. target"
                    value={priceAlerts.length
                      ? formatPrice(Math.round(priceAlerts.reduce((sum, row) => sum + row.targetPrice, 0) / priceAlerts.length))
                      : '—'}
                  />
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-fuchsia-50/60 p-2.5 dark:border-violet-900/60 dark:from-violet-950/30 dark:to-fuchsia-950/20">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <h2 className="text-[11px] font-extrabold tracking-tight">Restock playbook</h2>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
              When stock lands, back-in-stock contacts are emailed, WhatsApp-ed (if opted in) and notified in-app automatically. Open a row to audit the full ledger first.
            </p>
            <Link
              href="/admin/inventory/stock"
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-violet-700"
            >
              <Boxes className="h-2.5 w-2.5" /> Adjust stock
              <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </aside>
      </div>

      <ProductStockDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        productId={detail?.productId || null}
        fallback={detail?.product || null}
        context={detail?.context || null}
      />

      <ConfirmationModal
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => { if (!open && !removing) setPendingDelete(null); }}
        onConfirm={confirmRemove}
        title={pendingDelete?.kind === 'stock' ? 'Remove stock alert?' : 'Deactivate price alert?'}
        description={
          pendingDelete?.kind === 'stock'
            ? `The pending back-in-stock request for "${pendingDelete?.name}" will be deleted. This cannot be undone.`
            : `The price alert for "${pendingDelete?.name}" will be switched off for this subscriber.`
        }
        confirmText={pendingDelete?.kind === 'stock' ? 'Remove alert' : 'Deactivate'}
        variant={pendingDelete?.kind === 'stock' ? 'destructive' : 'default'}
        isLoading={removing}
      />
    </div>
  );
}

// =====================================================
// SMALL PIECES
// =====================================================

function RowButtons({
  onDetails,
  onOpen,
  onRemove,
  removeDisabled,
}: {
  onDetails: (event: ReactMouseEvent) => void;
  onOpen: (event: ReactMouseEvent) => void;
  onRemove: (event: ReactMouseEvent) => void;
  removeDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        onClick={onDetails}
        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-violet-500/10 hover:text-violet-600"
        aria-label="Open stock details"
        title="Stock details"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-500/10 hover:text-slate-700 dark:hover:text-slate-200"
        aria-label="Open product"
        title="Open product"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={removeDisabled}
        className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="Remove alert"
        title={removeDisabled ? 'Already inactive' : 'Remove alert'}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ChannelRow({
  label,
  value,
  total,
  bar,
  icon: Icon,
}: {
  label: string;
  value: number;
  total: number;
  bar: string;
  icon: any;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className="h-2.5 w-2.5 text-muted-foreground" />
        <span className="text-[9px] font-bold text-muted-foreground">{label}</span>
        <span className="ml-auto text-[10px] font-black">{value}</span>
        <span className="w-7 text-right text-[9px] font-semibold text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RailStat({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-[11px] font-black ${tone}`}>{value}</span>
    </div>
  );
}
