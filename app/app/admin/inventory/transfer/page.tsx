'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import {
  ArrowLeft, ArrowLeftRight, Loader2, Search, X, ChevronDown, Check,
  Warehouse as WarehouseIcon, Boxes, MapPin, Package, ClipboardList, Trash2, Send,
  Plus, ShieldAlert,
} from 'lucide-react';
import { getWarehouses, transferStock, type Warehouse } from '@/lib/api/inventory';
import { productsApi } from '@/lib/api/products';
import type { IProduct } from '@/lib/api/types';

// ---------------------------------------------------------------------------
// Searchable multi-select combobox
// ---------------------------------------------------------------------------
interface Option {
  id: string;
  title: string;
  subtitle?: string;
  thumb?: string;
  meta?: React.ReactNode;
  keywords?: string;
  disabled?: boolean;
  disabledReason?: string;
}

function MultiCombobox({
  label,
  required,
  placeholder,
  emptyLabel,
  searchPlaceholder,
  options,
  values,
  onToggle,
  onClear,
  minChars = 1,
  disabled,
  disabledHint,
  max,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  emptyLabel: string;
  searchPlaceholder?: string;
  options: Option[];
  values: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  minChars?: number;
  disabled?: boolean;
  disabledHint?: string;
  max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selected = options.filter((o) => values.includes(o.id));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < minChars) return [];
    return options
      .filter((o) => !q || (o.keywords || `${o.title} ${o.subtitle || ''}`).toLowerCase().includes(q))
      .slice(0, 40);
  }, [options, query, minChars]);

  const atMax = typeof max === 'number' && values.length >= max;

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-1.5">
        <Label className="text-[11px] font-bold">
          {label} {required && <span className="text-amber-600">*</span>}
        </Label>
        {values.length > 0 && (
          <button type="button" onClick={onClear} className="text-[9px] font-extrabold text-red-500 hover:underline">
            clear
          </button>
        )}
        {typeof max === 'number' && (
          <span className="text-[9px] text-muted-foreground ml-auto font-bold">{values.length}/{max}</span>
        )}
      </div>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 pl-1.5 pr-1 py-0.5 rounded-md bg-amber-500/10 border border-amber-200 dark:border-amber-700 text-[10px] font-bold text-amber-700 dark:text-amber-300 max-w-full"
            >
              {o.thumb && (
                <div className="relative h-4 w-4 rounded overflow-hidden bg-slate-200 shrink-0">
                  <Image src={o.thumb} alt="" fill sizes="16px" className="object-cover" />
                </div>
              )}
              <span className="truncate max-w-[150px]">{o.title}</span>
              <button type="button" onClick={() => onToggle(o.id)} className="hover:text-red-600 shrink-0">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={disabled || atMax}
        onClick={() => setOpen(true)}
        className={`mt-1.5 w-full flex items-center justify-between gap-2 rounded-lg border border-dashed px-3 h-9 text-left transition-colors ${
          values.length > 0
            ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
        } disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:border-amber-400`}
      >
        <span className="text-[11px] text-muted-foreground truncate">
          {disabled ? disabledHint : atMax ? 'Maximum selection reached' : values.length > 0 ? 'Click to add more…' : placeholder}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
          <div className="relative border-b border-slate-200 dark:border-slate-800">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder || placeholder}
              className="w-full pl-9 pr-3 h-9 bg-transparent text-xs outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {query.trim().length < minChars ? (
              <div className="px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Type {minChars > 1 ? `${minChars}+ characters` : 'to search'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{options.length} available</p>
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-3 text-center text-[11px] text-muted-foreground">{emptyLabel}</div>
            ) : (
              results.map((o) => {
                const isSel = values.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={o.disabled}
                    onClick={() => onToggle(o.id)}
                    className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 hover:bg-amber-500/10 transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {o.thumb ? (
                      <div className="relative h-8 w-8 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
                        <Image src={o.thumb} alt="" fill sizes="32px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <WarehouseIcon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold truncate">{o.title}</div>
                      {o.subtitle && (
                        <div className="text-[10px] text-muted-foreground truncate">{o.subtitle}</div>
                      )}
                    </div>
                    {o.meta && <div className="shrink-0">{o.meta}</div>}
                    <span
                      className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSel ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSel && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
type LineItem = { productId: string; quantity: number };

export default function StockTransferPage() {
  const { toast } = useToast();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const [fromId, setFromId] = useState<string | null>(null);
  const [toIds, setToIds] = useState<string[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [lines, setLines] = useState<Record<string, LineItem>>({});
  const [splitMode, setSplitMode] = useState<'each' | 'split'>('each');
  const [reason, setReason] = useState('Warehouse transfer');
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [warehousesRes, productsRes] = await Promise.all([
        getWarehouses({ limit: 100 }),
        productsApi.getProducts({ limit: 500 }),
      ]);
      setWarehouses(warehousesRes?.warehouses || []);
      setProducts(productsRes?.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Clear destination + products when the source changes
  useEffect(() => {
    setToIds((ids) => ids.filter((id) => id !== fromId));
    setProductIds([]);
    setLines({});
  }, [fromId]);

  const fromWarehouse = warehouses.find((w) => w._id === fromId) || null;
  const toWarehouses = warehouses.filter((w) => w._id !== fromId);

  const availableAtSource = useCallback((productId: string) => {
    if (!fromWarehouse) return null;
    const entry = fromWarehouse.stock?.find((s) => s.productId === productId);
    if (!entry) return 0;
    return entry.availableQuantity ?? entry.quantity - entry.reservedQuantity;
  }, [fromWarehouse]);

  const warehouseOptions: Option[] = useMemo(() => warehouses.map((w) => ({
    id: w._id,
    title: w.name,
    subtitle: `${w.code} · ${w.address.city}${w.address.state ? `, ${w.address.state}` : ''}`,
    keywords: `${w.name} ${w.code} ${w.address.city} ${w.address.state}`.toLowerCase(),
    disabled: w._id === fromId,
    disabledReason: 'Source warehouse',
    meta: (
      <div className="flex items-center gap-1">
        {!w.isActive && <Badge className="bg-slate-400 text-white text-[8px] font-extrabold rounded-full px-1.5">OFF</Badge>}
        {w.isDefault && <Badge className="bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded-full px-1.5">DEFAULT</Badge>}
        <span className="text-[10px] font-bold text-muted-foreground">{w.stock?.length || 0} SKUs</span>
      </div>
    ),
  })), [warehouses, fromId]);

  const destinationOptions: Option[] = useMemo(() => warehouses.filter((w) => w._id !== fromId).map((w) => {
    const units = w.stock?.reduce((s, x) => s + x.quantity, 0) ?? 0;
    return {
      id: w._id,
      title: w.name,
      subtitle: `${w.code} · ${w.address.city}${w.address.state ? `, ${w.address.state}` : ''}`,
      keywords: `${w.name} ${w.code} ${w.address.city} ${w.address.state}`.toLowerCase(),
      meta: <span className="text-[10px] font-bold text-muted-foreground">{units.toLocaleString()} units</span>,
    };
  }), [warehouses, fromId]);

  const productOptions: Option[] = useMemo(() => products.map((p) => {
    const avail = availableAtSource(p._id);
    const img = Array.isArray(p.images) && p.images.length > 0
      ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url)
      : undefined;
    return {
      id: p._id,
      title: p.name,
      subtitle: p.sku ? `SKU: ${p.sku}` : undefined,
      thumb: img,
      keywords: `${p.name} ${p.sku}`.toLowerCase(),
      disabled: fromId ? avail === 0 : false,
      disabledReason: 'No stock at source',
      meta: avail === null ? (
        <span className="text-[10px] font-bold text-muted-foreground">{p.stock ?? 0} total</span>
      ) : (
        <Badge className={avail === 0
          ? 'bg-rose-500 text-white text-[8px] font-extrabold rounded-full px-1.5'
          : avail <= 10
            ? 'bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded-full px-1.5'
            : 'bg-emerald-500 text-white text-[8px] font-extrabold rounded-full px-1.5'}>
          {avail} at source
        </Badge>
      ),
    };
  }), [products, availableAtSource, fromId]);

  const toggleProduct = (id: string) => {
    setProductIds((ids) => {
      if (ids.includes(id)) {
        setLines((l) => { const n = { ...l }; delete n[id]; return n; });
        return ids.filter((x) => x !== id);
      }
      const avail = availableAtSource(id) ?? 0;
      setLines((l) => ({ ...l, [id]: { productId: id, quantity: Math.max(1, Math.min(avail, 1)) } }));
      return [...ids, id];
    });
  };

  const setAllSame = (n: number) =>
    setLines((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, { ...v, quantity: n }])));

  // Per-destination quantity
  const qtyFor = (productId: string, destId: string): number => {
    const line = lines[productId];
    if (!line) return 0;
    if (splitMode === 'each') return line.quantity;
    const share = Math.floor(line.quantity / toIds.length);
    const rest = line.quantity % toIds.length;
    const idx = toIds.indexOf(destId);
    return share + (idx < rest ? 1 : 0);
  };

  const jobs = useMemo(() => {
    const list: Array<{ productId: string; toId: string; quantity: number }> = [];
    for (const pid of productIds) {
      for (const tid of toIds) {
        const q = qtyFor(pid, tid);
        if (q > 0) list.push({ productId: pid, toId: tid, quantity: q });
      }
    }
    return list;
  }, [productIds, toIds, lines, splitMode]);

  const totalUnits = productIds.reduce((s, pid) => s + (lines[pid]?.quantity || 0), 0);
  const overAllocated = productIds.filter((pid) => {
    const avail = availableAtSource(pid) ?? 0;
    return (lines[pid]?.quantity || 0) > avail;
  });

  const canSubmit =
    !!fromId && toIds.length > 0 && productIds.length > 0 &&
    jobs.length > 0 && overAllocated.length === 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromId) {
      toast({ title: 'Pick a source warehouse', variant: 'destructive' });
      return;
    }
    if (toIds.length === 0) {
      toast({ title: 'Pick at least one destination warehouse', variant: 'destructive' });
      return;
    }
    if (productIds.length === 0) {
      toast({ title: 'Select at least one product to transfer', variant: 'destructive' });
      return;
    }
    if (overAllocated.length > 0) {
      toast({
        title: 'Insufficient stock at source',
        description: `${products.find((p) => p._id === overAllocated[0])?.name} exceeds available quantity.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      setProgress({ done: 0, total: jobs.length });
      const failures: string[] = [];

      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        try {
          await transferStock({
            fromWarehouseId: fromId,
            toWarehouseId: job.toId,
            productId: job.productId,
            quantity: job.quantity,
            reason: reason.trim() || 'Warehouse transfer',
            notes: notes.trim() || undefined,
          });
        } catch (err: any) {
          const destName = warehouses.find((w) => w._id === job.toId)?.code || job.toId;
          const prodName = products.find((p) => p._id === job.productId)?.name || 'product';
          failures.push(`${prodName} → ${destName}: ${err.response?.data?.error || err.message || 'failed'}`);
        }
        setProgress({ done: i + 1, total: jobs.length });
      }

      const okCount = jobs.length - failures.length;
      if (okCount > 0) {
        toast({
          title: `${okCount} transfer${okCount === 1 ? '' : 's'} completed`,
          description: `${productIds.length} product${productIds.length === 1 ? '' : 's'} → ${toIds.length} warehouse${toIds.length === 1 ? '' : 's'} · ${totalUnits} units.`,
        });
      }
      if (failures.length > 0) {
        toast({
          title: `${failures.length} transfer${failures.length === 1 ? '' : 's'} failed`,
          description: failures.slice(0, 3).join(' · '),
          variant: 'destructive',
        });
      }

      // Reset only when everything succeeded
      if (failures.length === 0) {
        setProductIds([]);
        setLines({});
        setNotes('');
        await fetchData();
      } else {
        await fetchData();
      }
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 space-y-4 max-w-6xl mx-auto">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Stock Transfer</h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              Move stock from one warehouse to one or many destinations in a single transfer.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/movements">
            <Button variant="outline" size="sm" className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm">
              History
            </Button>
          </Link>
          <Link href="/admin/inventory">
            <Button variant="outline" size="sm" className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-3">
          {/* Step 1 — Route */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-sm font-extrabold tracking-tight">Route</h2>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Step 1 of 3</span>
            </div>
            <CardContent className="p-3.5 grid sm:grid-cols-2 gap-3">
              <MultiCombobox
                label="From warehouse"
                required
                placeholder="Select source…"
                emptyLabel="No warehouse found"
                searchPlaceholder="Search name, code, city…"
                options={warehouseOptions}
                values={fromId ? [fromId] : []}
                onToggle={(id) => setFromId((cur) => (cur === id ? null : id))}
                onClear={() => setFromId(null)}
                max={1}
                disabled={warehouses.length === 0}
                disabledHint="No warehouses yet"
              />
              <MultiCombobox
                label="To warehouse(s)"
                required
                placeholder="Select destinations…"
                emptyLabel="No warehouse found"
                searchPlaceholder="Search and pick one or more…"
                options={destinationOptions}
                values={toIds}
                onToggle={(id) => setToIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
                onClear={() => setToIds([])}
                disabled={!fromId}
                disabledHint="Pick a source first"
              />
            </CardContent>
          </Card>

          {/* Route visual */}
          {fromId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 overflow-x-auto">
              <WarehouseIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-[10px] font-bold truncate shrink-0">{fromWarehouse?.name}</span>
              <ArrowLeftRight className="h-3 w-3 text-amber-600 shrink-0" />
              {toIds.length === 0 ? (
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">pick destinations →</span>
              ) : (
                <div className="flex items-center gap-1 min-w-0">
                  {toIds.map((tid, i) => (
                    <span key={tid} className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] font-bold truncate max-w-[120px]">
                        {warehouses.find((w) => w._id === tid)?.name}
                      </span>
                      {i < toIds.length - 1 && <span className="text-amber-600 text-[10px]">+</span>}
                    </span>
                  ))}
                  <Badge className="bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded-full px-1.5 shrink-0">
                    {toIds.length} DEST
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Products */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Package className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-sm font-extrabold tracking-tight">Products</h2>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Step 2 of 3</span>
            </div>
            <CardContent className="p-3.5 space-y-3">
              <MultiCombobox
                label="Products to transfer"
                required
                placeholder={fromId ? 'Search products by name or SKU…' : 'Pick a source warehouse first'}
                emptyLabel={fromId ? 'No product with stock at source' : 'Select a source warehouse first'}
                searchPlaceholder="Type 2+ chars to search by name or SKU…"
                minChars={2}
                options={productOptions}
                values={productIds}
                onToggle={toggleProduct}
                onClear={() => { setProductIds([]); setLines({}); }}
                disabled={!fromId || products.length === 0}
                disabledHint={!fromId ? 'Pick a source first' : 'No products yet'}
              />

              {/* Quick quantity helper */}
              {productIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Set all qty</span>
                  {[1, 5, 10, 25, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAllSame(n)}
                      className="h-6 px-2 rounded-md border border-slate-300 dark:border-slate-700 text-[10px] font-extrabold hover:bg-amber-500/10 transition-colors"
                    >
                      {n}
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setProductIds([]); setLines({}); }}
                    className="ml-auto h-6 px-2 rounded-md text-[10px] font-extrabold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Clear all
                  </Button>
                </div>
              )}

              {/* Line items */}
              {productIds.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_70px_80px_90px_28px] gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    {['Product', 'Available', 'Transfer', 'Per dest', ''].map((h, i) => (
                      <span
                        key={h + i}
                        className={`text-[8px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400 ${i === 1 || i === 2 || i === 3 ? 'text-right' : ''}`}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                    {productIds.map((pid) => {
                      const p = products.find((x) => x._id === pid);
                      const avail = availableAtSource(pid) ?? 0;
                      const qty = lines[pid]?.quantity ?? 0;
                      const over = qty > avail;
                      const img = p && Array.isArray(p.images) && p.images.length > 0
                        ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url)
                        : undefined;
                      return (
                        <div key={pid} className="grid grid-cols-[1fr_28px] sm:grid-cols-[1fr_70px_80px_90px_28px] gap-2 px-2.5 py-2 items-center hover:bg-amber-500/[0.03] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            {img ? (
                              <div className="relative h-7 w-7 rounded-md overflow-hidden bg-slate-100 shrink-0">
                                <Image src={img} alt="" fill sizes="28px" className="object-cover" />
                              </div>
                            ) : (
                              <div className="h-7 w-7 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <Package className="h-3 w-3 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-[10px] font-bold truncate">{p?.name || 'Product'}</div>
                              <div className="text-[9px] font-mono text-muted-foreground truncate">{p?.sku || '—'}</div>
                            </div>
                          </div>

                          <span className="hidden sm:block text-right text-[10px] font-bold text-muted-foreground">{avail}</span>

                          <div className="hidden sm:block">
                            <input
                              type="number"
                              min={1}
                              max={avail}
                              value={qty}
                              onChange={(e) => setLines((l) => ({
                                ...l,
                                [pid]: { productId: pid, quantity: Math.max(0, parseInt(e.target.value) || 0) },
                              }))}
                              className={`w-full h-7 rounded-md border bg-white dark:bg-slate-950 text-[11px] font-black text-right px-1.5 outline-none focus:ring-2 focus:ring-amber-500 ${
                                over ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                          </div>

                          {/* Mobile qty */}
                          <div className="col-span-1 sm:hidden flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={avail}
                              value={qty}
                              onChange={(e) => setLines((l) => ({
                                ...l,
                                [pid]: { productId: pid, quantity: Math.max(0, parseInt(e.target.value) || 0) },
                              }))}
                              className={`w-16 h-7 rounded-md border bg-white dark:bg-slate-950 text-[11px] font-black text-center px-1.5 outline-none focus:ring-2 focus:ring-amber-500 ${
                                over ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
                              }`}
                            />
                            <span className="text-[9px] text-muted-foreground">of {avail}</span>
                          </div>

                          <div className="hidden sm:block text-right">
                            <span className={`text-[10px] font-bold ${over ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300'}`}>
                              {qtyFor(pid, toIds[0]) || 0}
                              {toIds.length > 1 && <span className="text-muted-foreground"> each</span>}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleProduct(pid)}
                            className="h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Split mode + totals */}
                  {toIds.length > 1 && (
                    <div className="px-2.5 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Distribute across {toIds.length} destinations</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { k: 'each', t: 'Full qty to each', d: `${totalUnits * toIds.length} units moved` },
                          { k: 'split', t: 'Split total', d: `${totalUnits} units divided evenly` },
                        ] as const).map((m) => (
                          <button
                            key={m.k}
                            type="button"
                            onClick={() => setSplitMode(m.k)}
                            className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${
                              splitMode === m.k
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-slate-300 dark:border-slate-700 hover:bg-amber-500/5'
                            }`}
                          >
                            <p className="text-[10px] font-extrabold">{m.t}</p>
                            <p className="text-[9px] text-muted-foreground">{m.d}</p>
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 space-y-0.5">
                        {toIds.map((tid) => {
                          const destUnits = productIds.reduce((s, pid) => s + qtyFor(pid, tid), 0);
                          return (
                            <div key={tid} className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground truncate">{warehouses.find((w) => w._id === tid)?.name}</span>
                              <span className="font-extrabold shrink-0 ml-2">{destUnits} units</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {overAllocated.length > 0 && (
                    <div className="flex items-start gap-1.5 px-2.5 py-2 border-t border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30">
                      <ShieldAlert className="h-3 w-3 text-rose-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold">
                        Quantity exceeds available stock at the source for {overAllocated.length} item{overAllocated.length === 1 ? '' : 's'}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3 — Meta */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-sm font-extrabold tracking-tight">Transfer Details</h2>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Step 3 of 3</span>
            </div>
            <CardContent className="p-3.5 grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Label htmlFor="reason" className="text-[11px] font-bold">Reason</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Warehouse transfer"
                  className="h-9 rounded-lg text-xs mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes" className="text-[11px] font-bold">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Applied to every transfer in this batch…"
                  rows={2}
                  className="text-xs rounded-lg mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[10px] text-muted-foreground">
              {jobs.length > 0 ? (
                <>
                  <span className="font-extrabold text-slate-600 dark:text-slate-300">{jobs.length}</span> transfer
                  {jobs.length === 1 ? '' : 's'} · <span className="font-extrabold text-slate-600 dark:text-slate-300">{totalUnits}</span> units
                </>
              ) : 'Select a route and products to continue'}
            </p>
            <Button
              type="submit"
              disabled={!canSubmit}
              size="sm"
              className="h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold shadow-sm disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
              {submitting && progress
                ? `Transferring ${progress.done}/${progress.total}…`
                : `Transfer${jobs.length > 1 ? ` ${jobs.length} Items` : ' Stock'}`}
            </Button>
          </div>
        </div>

        {/* Side summary */}
        <div className="space-y-3">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-3 space-y-2.5">
              <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Summary</p>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <WarehouseIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-muted-foreground">From</p>
                    <p className="text-[11px] font-bold truncate">{fromWarehouse?.name || 'Not selected'}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-200 dark:border-slate-800" />

                <div className="flex items-start gap-2">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-muted-foreground">To ({toIds.length})</p>
                    {toIds.length === 0 ? (
                      <p className="text-[11px] font-bold text-slate-400">None selected</p>
                    ) : (
                      <ul className="space-y-0.5 mt-0.5">
                        {toIds.map((tid) => (
                          <li key={tid} className="text-[10px] font-bold truncate flex items-center justify-between gap-1">
                            <span className="truncate">{warehouses.find((w) => w._id === tid)?.name}</span>
                            <span className="text-[9px] text-muted-foreground shrink-0">
                              {productIds.reduce((s, pid) => s + qtyFor(pid, tid), 0)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-200 dark:border-slate-800" />

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
                  <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Products</p>
                  <p className="text-base font-black">{productIds.length}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
                  <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Units</p>
                  <p className="text-base font-black">{totalUnits}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
                  <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Moves</p>
                  <p className="text-base font-black text-amber-600">{jobs.length}</p>
                </div>
              </div>

              {fromWarehouse && (
                <>
                  <div className="h-px bg-slate-200 dark:border-slate-800" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 mb-1">Source capacity</p>
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className="text-muted-foreground">
                        {fromWarehouse.stock.reduce((s, x) => s + x.quantity, 0).toLocaleString()} units
                      </span>
                      <span className="text-muted-foreground">
                        cap {fromWarehouse.settings?.maxCapacity?.toLocaleString() || '—'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${Math.min(100, Math.round(
                            (fromWarehouse.stock.reduce((s, x) => s + x.quantity, 0) /
                              Math.max(1, fromWarehouse.settings?.maxCapacity || 0)) * 100
                          ))}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-3 space-y-1.5">
              <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">How it works</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Select several products and several destination warehouses — each combination becomes its own transfer record, so you can move a whole batch in one go.
              </p>
              <div className="flex items-start gap-1.5 pt-0.5">
                <Plus className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[9px] text-muted-foreground">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Full qty to each</span> sends the line quantity to every destination.
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <Boxes className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[9px] text-muted-foreground">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Split total</span> divides the line quantity across all destinations.
                </p>
              </div>
            </CardContent>
          </Card>

          {toIds.length > 0 && (
            <div className="grid gap-1.5">
              <Link href="/admin/inventory/movements">
                <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-400 hover:shadow-md transition-all">
                  <CardContent className="p-2.5 flex items-center gap-2">
                    <ClipboardList className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-bold">Movement History</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/inventory/warehouses">
                <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-400 hover:shadow-md transition-all">
                  <CardContent className="p-2.5 flex items-center gap-2">
                    <WarehouseIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] font-bold">Manage Warehouses</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}