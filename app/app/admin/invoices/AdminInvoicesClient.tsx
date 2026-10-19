'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllOrders, Order } from '@/lib/api/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Search, Printer, Loader2, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';

const PER_PAGE_OPTIONS = [10, 20, 50, 100];
const FILTERS = ['all', 'confirmed', 'pending', 'refunded'] as const;

export default function AdminInvoicesClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    loadAdminInvoices();
  }, []);

  const loadAdminInvoices = async () => {
    try {
      setLoading(true);
      const res = await getAllOrders(1, 100);
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load admin invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase();
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(q) ||
      (typeof order.userId === 'object' && (order.userId.name?.toLowerCase().includes(q) || order.userId.email?.toLowerCase().includes(q)));

    const matchesFilter =
      paymentFilter === 'all' || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesFilter;
  });

  // Search suggestions: matching invoices, shown in dropdown
  const suggestions = filteredOrders.slice(0, 6);
  const showSuggestions = suggestionsOpen && search.trim().length >= 1 && suggestions.length > 0;

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, paymentFilter, perPage]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pagedOrders = filteredOrders.slice((safePage - 1) * perPage, safePage * perPage);

  const totalInvoiceValue = filteredOrders.reduce((sum, order) => sum + order.total, 0);

  const openInvoicePdf = (id: string) => {
    setLoadingId(id);
    window.open(`/admin/orders/${id}/invoice`, '_blank', 'noopener,noreferrer');
    setTimeout(() => setLoadingId(null), 1200);
  };
  const statusCounts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'all' ? orders.length : orders.filter((o) => o.paymentStatus === f).length;
    return acc;
  }, {} as Record<string, number>);

  const activeFilterCount = (paymentFilter !== 'all' ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="container mx-auto px-3 py-4 max-w-7xl space-y-4">
      {/* Header Banner & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <Badge variant="outline" className="text-[10px] uppercase font-extrabold tracking-widest text-amber-600 border-amber-400 mb-1">
            Admin Invoice Operations Hub
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            GST Tax Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filteredOrders.length} of {orders.length} invoices · opens in new tab for clean print/save
          </p>
        </div>

        <div className="flex gap-2">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-right">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-amber-900 dark:text-amber-400 block">Invoice Volume</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{formatPrice(totalInvoiceValue)}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-right">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-900 dark:text-emerald-400 block">Confirmed</span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{statusCounts.confirmed}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
          {/* Search with suggestions */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search invoice #, customer, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSuggestionsOpen(true); }}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setSuggestionsOpen(false), 200)}
              className="pl-9 pr-8 text-xs rounded-xl border-slate-300 dark:border-slate-700 h-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {showSuggestions && (
              <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                <div className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 px-2 pt-1 pb-0.5">Matching invoices</div>
                {suggestions.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setSearch(s.orderNumber); setSuggestionsOpen(false); }}
                    className="w-full text-left flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-amber-500/10 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold font-mono truncate">INV-{s.orderNumber}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{typeof s.userId === 'object' ? s.userId.name : ''}</div>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-600 shrink-0">{formatPrice(s.total)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5 lg:ml-auto">
            {FILTERS.map((status) => (
              <Button
                key={status}
                variant={paymentFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentFilter(status)}
                className={`rounded-full text-[11px] uppercase font-extrabold h-8 px-3 shadow-sm transition-all ${paymentFilter === status ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' : 'hover:bg-amber-500/10'}`}
              >
                {status}
                <span className={`ml-1.5 text-[9px] ${paymentFilter === status ? 'text-slate-800' : 'text-slate-400'}`}>
                  {statusCounts[status]}
                </span>
              </Button>
            ))}
          </div>

          {/* Records per page */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Per page</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold px-2 outline-none focus:ring-2 focus:ring-amber-500"
            >
              {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Active:</span>
          {paymentFilter !== 'all' && (
            <Badge className="bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full">
              pay: {paymentFilter}
              <button onClick={() => setPaymentFilter('all')} className="ml-1.5 hover:text-red-700"><X className="h-2.5 w-2.5 inline" /></button>
            </Badge>
          )}
          {search && (
            <Badge className="bg-violet-500 text-white text-[10px] font-extrabold rounded-full">
              "{search}"
              <button onClick={() => setSearch('')} className="ml-1.5 hover:text-red-200"><X className="h-2.5 w-2.5 inline" /></button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setPaymentFilter('all'); }} className="h-6 text-[10px] font-extrabold text-red-600 hover:bg-red-500/10 rounded-full px-2">
            Clear all
          </Button>
        </div>
      )}

      {/* Invoices List Table */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : pagedOrders.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No invoices match your filters. Try clearing search or selecting another payment status.
          </CardContent>
        </Card>
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Invoice #</AdminTableHead>
              <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Customer</AdminTableHead>
              <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Date</AdminTableHead>
              <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Method</AdminTableHead>
              <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Status</AdminTableHead>
              <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Total</AdminTableHead>
              <AdminTableHead className="text-[10px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap text-right">Actions</AdminTableHead>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {pagedOrders.map((order) => {
              const custName = typeof order.userId === 'object' ? order.userId.name : 'Customer';
              const custEmail = typeof order.userId === 'object' ? order.userId.email : '';
              const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <AdminTableRow key={order._id}>
                  <AdminTableCell className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    INV-{order.orderNumber}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="max-w-[180px]">
                      <div className="font-semibold truncate text-xs">{custName}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{custEmail}</div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell className="text-xs text-muted-foreground whitespace-nowrap">{invoiceDate}</AdminTableCell>
                  <AdminTableCell>
                    <Badge variant="outline" className="text-[9px] uppercase font-extrabold rounded-md tracking-wider">
                      {order.paymentMethod}
                    </Badge>
                  </AdminTableCell>
                  <AdminTableCell>
                    <Badge className={
                      order.paymentStatus === 'confirmed' ? 'bg-emerald-500 text-white text-[10px] font-extrabold rounded-full px-2'
                      : order.paymentStatus === 'refunded' ? 'bg-slate-400 text-white text-[10px] font-extrabold rounded-full px-2'
                      : 'bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full px-2'
                    }>
                      {order.paymentStatus.toUpperCase()}
                    </Badge>
                  </AdminTableCell>
                  <AdminTableCell className="text-right font-black text-xs whitespace-nowrap">
                    {formatPrice(order.total)}
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => openInvoicePdf(order._id)}
                        className="h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold shadow-sm"
                      >
                        {loadingId === order._id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Printer className="h-3 w-3 mr-1" />}
                        PDF
                      </Button>
                      <RowActions
                        label={`More actions for INV-${order.orderNumber}`}
                        items={[
                          {
                            label: 'Open invoice (new tab)',
                            icon: <FileText className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => openInvoicePdf(order._id),
                          },
                          {
                            label: 'View order (new tab)',
                            icon: <Printer className="h-3.5 w-3.5 mr-2" />,
                            onSelect: () => window.open(`/admin/orders/${order._id}`, '_blank', 'noopener,noreferrer'),
                          },
                        ]}
                      />
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              );
            })}
          </AdminTableBody>
        </AdminTable>
      )}

      {/* Pagination */}
      {!loading && filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[11px] text-muted-foreground font-medium">
            Showing <span className="font-extrabold text-slate-700 dark:text-slate-200">{(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filteredOrders.length)}</span> of <span className="font-extrabold text-slate-700 dark:text-slate-200">{filteredOrders.length}</span> invoices
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} className="h-8 rounded-lg text-[11px] font-extrabold">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400 text-[10px]">…</span>}
                  <Button
                    variant={safePage === p ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 p-0 rounded-lg text-[11px] font-extrabold ${safePage === p ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' : ''}`}
                  >
                    {p}
                  </Button>
                </span>
              ))}
            <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} className="h-8 rounded-lg text-[11px] font-extrabold">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
