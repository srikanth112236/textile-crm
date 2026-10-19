'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AdminTable,
  AdminTableBody,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeader,
  AdminTableRow,
} from '@/components/admin/DataTable';
import { RowActions } from '@/components/admin/RowActions';
import {
  ArrowLeft, Search, RefreshCw, X, ChevronLeft, ChevronRight, Download, Filter, Loader2,
  Warehouse as WarehouseIcon, Package, ArrowUpDown, ArrowDown, ArrowUp,
  Clock, User, ClipboardList, Layers, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  getStockMovements,
  getWarehouses,
  type StockMovement,
  type Warehouse,
} from '@/lib/api/inventory';

const MOVEMENT_TYPES = [
  { value: 'stock_in', label: 'Stock In', tone: 'text-emerald-600', icon: ArrowUp },
  { value: 'stock_out', label: 'Stock Out', tone: 'text-rose-600', icon: ArrowDown },
  { value: 'transfer', label: 'Transfer', tone: 'text-amber-600', icon: ArrowUpDown },
  { value: 'order', label: 'Order', tone: 'text-violet-600', icon: Package },
  { value: 'order_cancelled', label: 'Order Cancelled', tone: 'text-slate-400', icon: TrendingDown },
  { value: 'order_refund', label: 'Refund', tone: 'text-rose-400', icon: TrendingDown },
  { value: 'adjustment', label: 'Adjustment', tone: 'text-amber-600', icon: Layers },
  { value: 'damage', label: 'Damage', tone: 'text-rose-600', icon: ArrowDown },
  { value: 'return', label: 'Return', tone: 'text-emerald-600', icon: ArrowUp },
  { value: 'recount', label: 'Recount', tone: 'text-violet-600', icon: Clock },
];

type SeverityFilter = 'all' | 'positive' | 'negative';

export default function StockMovementsPage() {
  const { toast } = useToast();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // Filter state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [pagination.page, filterType, filterWarehouse, dateRange, severityFilter]);

  const fetchWarehouses = async () => {
    try {
      const res = await getWarehouses({ limit: 100 });
      setWarehouses(res?.warehouses || []);
    } catch (e: any) {
      console.error('Warehouses fetch failed:', e);
    }
  };

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await getStockMovements({
        page: pagination.page,
        limit: pagination.limit,
        warehouseId: filterWarehouse || undefined,
        type: filterType || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
      });
      setMovements(res?.movements || []);
      setPagination((p) => ({
        ...p,
        total: res?.pagination?.total || 0,
        pages: res?.pagination?.pages || 0,
      }));
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to load movements',
        variant: 'destructive',
      });
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  // Derived search filter (client-side within fetched page data for faster UX)
  const filteredMovements = useMemo(() => {
    const q = search.toLowerCase();
    return movements.filter((m) => {
      if (!q) return true;
      const prodName = (typeof m.productId === 'object' ? m.productId?.name : m.productName || '').toLowerCase();
      const sku = (typeof m.productId === 'object' ? m.productId?.sku : m.variantSku || '').toLowerCase();
      const reason = (m.reason || '').toLowerCase();
      const number = String(m.movementNumber || '').toLowerCase();
      return prodName.includes(q) || sku.includes(q) || reason.includes(q) || number.includes(q);
    });
  }, [movements, search]);

  // Apply severity filter
  const displayMovements = useMemo(() => {
    if (severityFilter === 'all') return filteredMovements;
    return filteredMovements.filter((m) =>
      severityFilter === 'positive' ? m.quantity > 0 : m.quantity < 0
    );
  }, [filteredMovements, severityFilter]);

  const clearFilters = () => {
    setSearch('');
    setFilterType('');
    setFilterWarehouse('');
    setDateRange({ start: '', end: '' });
    setSeverityFilter('all');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const getMovementMeta = (type: string) => MOVEMENT_TYPES.find((t) => t.value === type) || MOVEMENT_TYPES[0];

  const exportCSV = () => {
    const rows = [
      ['Movement #', 'Date', 'Type', 'Product', 'Warehouse', 'Quantity', 'New Stock', 'Reason', 'Created By'],
      ...displayMovements.map((m) => [
        m.movementNumber,
        new Date(m.createdAt).toLocaleString(),
        m.type,
        (typeof m.productId === 'object' ? m.productId?.name : m.productName) || '-',
        m.warehouseName || '-',
        m.quantity,
        m.newStock,
        m.reason,
        (typeof m.createdBy === 'object' ? m.createdBy?.name : m.createdByName) || '-',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movements-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
        <span className="ml-3 text-sm text-muted-foreground">Loading movements…</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 space-y-4 max-w-7xl mx-auto">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Stock Movements</h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              {filteredMovements.length} of {movements.length} records · page {pagination.page}/{pagination.pages || 1}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMovements} className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filteredMovements.length === 0} className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardContent className="p-3 flex flex-col lg:flex-row gap-2 lg:items-center">
          <div className="relative w-full lg:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search number, product, SKU, reason…"
              className="pl-9 pr-8 h-9 rounded-xl text-xs"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Select value={filterWarehouse} onValueChange={(v) => { setFilterWarehouse(v); setPagination((p) => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="h-9 rounded-xl text-[11px] w-full sm:w-48">
              <SelectValue placeholder="All warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All warehouses</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w._id} value={w._id}>{w.name} ({w.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPagination((p) => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="h-9 rounded-xl text-[11px] w-full sm:w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {MOVEMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 w-full sm:w-auto">
            <label className="relative flex items-center h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] px-2.5 cursor-pointer hover:border-amber-400 transition-colors w-full sm:w-28 shadow-sm">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => { setDateRange((d) => ({ ...d, start: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <span className="text-muted-foreground truncate font-medium">
                {dateRange.start ? new Date(dateRange.start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Start'}
              </span>
            </label>
            <span className="self-center text-[10px] text-muted-foreground font-extrabold">→</span>
            <label className="relative flex items-center h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] px-2.5 cursor-pointer hover:border-amber-400 transition-colors w-full sm:w-28 shadow-sm">
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => { setDateRange((d) => ({ ...d, end: e.target.value })); setPagination((p) => ({ ...p, page: 1 })); }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <span className="text-muted-foreground truncate font-medium">
                {dateRange.end ? new Date(dateRange.end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'End'}
              </span>
            </label>
          </div>

          <div className="flex gap-1.5 lg:ml-auto shrink-0">
            {[
              { k: 'all', n: 'All', c: movements.length },
              { k: 'positive', n: 'In', c: movements.filter((m) => m.quantity > 0).length },
              { k: 'negative', n: 'Out', c: movements.filter((m) => m.quantity < 0).length },
            ].map((f) => (
              <Button
                key={f.k}
                variant={severityFilter === f.k ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSeverityFilter(f.k as SeverityFilter); setPagination((p) => ({ ...p, page: 1 })); }}
                className={`rounded-full text-[10px] uppercase font-extrabold h-8 px-3 ${
                  severityFilter === f.k ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''
                }`}
              >
                {f.n}
                <span className={`ml-1.5 text-[9px] ${severityFilter === f.k ? 'text-white/80' : 'text-slate-400'}`}>{f.c}</span>
              </Button>
            ))}
          </div>
        </CardContent>
        {search || filterWarehouse || filterType || dateRange.start || dateRange.end || severityFilter !== 'all' ? (
          <CardContent className="pt-0 pb-3 px-3 flex items-center gap-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Active:</span>
            {search && (
              <Badge className="bg-violet-500 text-white text-[9px] font-extrabold rounded-full px-2">
                "{search}" <button onClick={() => setSearch('')} className="ml-1 hover:text-rose-100"><X className="h-2.5 w-2.5 inline" /></button>
              </Badge>
            )}
            {filterWarehouse && (
              <Badge className="bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded-full px-2">
                {warehouses.find((w) => w._id === filterWarehouse)?.name || filterWarehouse}
                <button onClick={() => { setFilterWarehouse(''); setPagination((p) => ({ ...p, page: 1 })); }} className="ml-1 hover:text-red-700"><X className="h-2.5 w-2.5 inline" /></button>
              </Badge>
            )}
            {filterType && (
              <Badge className="bg-violet-500 text-white text-[9px] font-extrabold rounded-full px-2">
                {MOVEMENT_TYPES.find((t) => t.value === filterType)?.label || filterType}
                <button onClick={() => { setFilterType(''); setPagination((p) => ({ ...p, page: 1 })); }} className="ml-1 hover:text-rose-100"><X className="h-2.5 w-2.5 inline" /></button>
              </Badge>
            )}
            {(dateRange.start || dateRange.end) && (
              <Badge className="bg-amber-500 text-slate-950 text-[9px] font-extrabold rounded-full px-2">
                {dateRange.start || '…'} → {dateRange.end || '…'}
                <button onClick={() => { setDateRange({ start: '', end: '' }); setPagination((p) => ({ ...p, page: 1 })); }} className="ml-1 hover:text-red-700"><X className="h-2.5 w-2.5 inline" /></button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-[9px] font-extrabold text-red-600 hover:bg-red-500/10 rounded-full px-2">
              Clear all
            </Button>
          </CardContent>
        ) : null}
      </Card>

      {/* Movements Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">#</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Product</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Warehouse</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Quantity</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">New Stock</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Type</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Reason</AdminTableHead>
              <AdminTableHead className="text-[9px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">Created By</AdminTableHead>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {displayMovements.length === 0 ? (
              <AdminTableRow>
                <AdminTableCell colSpan={9} className="text-center py-10 text-sm text-muted-foreground">
                  No movements match your filters.
                </AdminTableCell>
              </AdminTableRow>
            ) : (
              displayMovements.map((movement) => {
                const meta = getMovementMeta(movement.type);
                const prodName = (typeof movement.productId === 'object' ? movement.productId?.name : movement.productName) || '—';
                const prodSku = (typeof movement.productId === 'object' ? movement.productId?.sku : '') || (movement.variantSku || '');
                return (
                  <AdminTableRow key={movement._id} className="hover:bg-violet-500/[0.03] transition-colors">
                    <AdminTableCell className="font-mono text-[10px] font-medium whitespace-nowrap">{movement.movementNumber}</AdminTableCell>
                    <AdminTableCell>
                      <div className="max-w-[160px]">
                        <div className="text-[10px] font-bold truncate">{prodName}</div>
                        <div className="text-[9px] text-muted-foreground truncate font-mono">{prodSku || '—'}</div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="text-[11px] font-medium whitespace-nowrap max-w-[140px] truncate">{movement.warehouseName || '—'}</AdminTableCell>
                    <AdminTableCell className="text-right whitespace-nowrap">
                      <Badge
                        className={`text-[9px] font-extrabold rounded-full px-2 ${
                          movement.quantity > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}
                      >
                        {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                      </Badge>
                    </AdminTableCell>
                    <AdminTableCell className="text-right whitespace-nowrap text-[11px] font-black text-slate-600 dark:text-slate-300">{movement.newStock}</AdminTableCell>
                    <AdminTableCell>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-extrabold rounded-md tracking-wider border-none ${
                          meta.tone ? meta.tone.replace('text-', 'bg-') : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {meta.label}
                      </Badge>
                    </AdminTableCell>
                    <AdminTableCell className="max-w-[180px] truncate text-[10px] text-muted-foreground">{movement.reason}</AdminTableCell>
                    <AdminTableCell className="text-[11px] font-medium truncate max-w-[140px]">
                      {typeof movement.createdBy === 'object' ? movement.createdBy.name : movement.createdByName || '—'}
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })
            )}
          </AdminTableBody>
        </AdminTable>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[10px] text-muted-foreground font-medium">
              Showing <span className="font-extrabold text-slate-700 dark:text-slate-200">{(pagination.page - 1) * pagination.limit + 1}</span>–
              <span className="font-extrabold text-slate-700 dark:text-slate-200">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
              <span className="font-extrabold text-slate-700 dark:text-slate-200">{pagination.total}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} className="h-8 rounded-lg text-[10px] font-extrabold">
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400 text-[9px]">…</span>}
                    <Button
                      variant={pagination.page === p ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                      className={`h-8 w-8 p-0 rounded-lg text-[10px] font-extrabold ${pagination.page === p ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}
                    >
                      {p}
                    </Button>
                  </span>
                ))}
              <Button variant="outline" size="sm" disabled={pagination.page === pagination.pages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} className="h-8 rounded-lg text-[10px] font-extrabold">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}