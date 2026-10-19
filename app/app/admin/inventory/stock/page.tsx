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
  ArrowLeft, Plus, Minus, Package, Loader2, Search, X, Warehouse as WarehouseIcon,
  Check, ChevronDown, Boxes, MapPin, ClipboardList, History, ArrowLeftRight,
} from 'lucide-react';
import {
  getWarehouses,
  adjustStock,
  type Warehouse,
} from '@/lib/api/inventory';
import { productsApi } from '@/lib/api/products';
import type { IProduct } from '@/lib/api/types';

type AdjustmentType = 'add' | 'remove' | 'set';

const ADJUSTMENT_REASONS = [
  { value: 'stock_received', label: 'New Stock Received' },
  { value: 'return', label: 'Customer Return' },
  { value: 'damage', label: 'Damaged Goods' },
  { value: 'theft', label: 'Theft / Loss' },
  { value: 'recount', label: 'Inventory Recount' },
  { value: 'correction', label: 'Data Correction' },
  { value: 'other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// Reusable searchable combobox with suggestion dropdown
// ---------------------------------------------------------------------------
interface Option {
  id: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  thumb?: string;
  keywords?: string;
}

function SearchCombobox({
  label,
  required,
  placeholder,
  emptyLabel,
  options,
  value,
  onChange,
  disabled,
  disabledHint,
  minChars = 1,
  searchPlaceholder,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  emptyLabel: string;
  options: Option[];
  value: string | null;
  onChange: (id: string, option: Option | null) => void;
  disabled?: boolean;
  disabledHint?: string;
  minChars?: number;
  searchPlaceholder?: string;
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

  const selected = options.find((o) => o.id === value) || null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < minChars) return [];
    return options
      .filter((o) => !q || (o.keywords || `${o.title} ${o.subtitle || ''}`).toLowerCase().includes(q))
      .slice(0, 40);
  }, [options, query, minChars]);

  const pick = (o: Option) => {
    onChange(o.id, o);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <Label className="text-[11px] font-bold">
        {label} {required && <span className="text-amber-600">*</span>}
      </Label>

      {selected ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1 w-full flex items-center gap-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 h-11 text-left hover:border-amber-400 transition-colors"
        >
          {selected.thumb ? (
            <div className="relative h-7 w-7 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
              <Image src={selected.thumb} alt="" fill sizes="28px" className="object-cover" />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <WarehouseIcon className="h-3.5 w-3.5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold truncate">{selected.title}</div>
            {selected.subtitle && (
              <div className="text-[10px] text-muted-foreground truncate">{selected.subtitle}</div>
            )}
          </div>
          <X
            className="h-3.5 w-3.5 text-slate-400 hover:text-red-500 shrink-0"
            onClick={(e) => { e.stopPropagation(); setOpen(false); setQuery(''); onChange('', null); }}
          />
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="mt-1 w-full flex items-center justify-between gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 h-11 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:border-amber-400 transition-colors"
        >
          <span className="text-xs text-muted-foreground truncate">
            {disabled ? disabledHint : placeholder}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        </button>
      )}

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

          <div className="max-h-64 overflow-y-auto">
            {query.trim().length < minChars ? (
              <div className="px-3 py-3 text-center">
                <p className="text-[11px] text-muted-foreground">
                  Type {minChars > 1 ? `${minChars}+ characters` : 'to search'} to filter
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{options.length} available</p>
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-3 text-center text-[11px] text-muted-foreground">
                {emptyLabel}
              </div>
            ) : (
              results.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => pick(o)}
                  className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 hover:bg-amber-500/10 transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-0"
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
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function StockManagementPage() {
  const { toast } = useToast();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedProductData, setSelectedProductData] = useState<IProduct | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);

  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('add');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('stock_received');
  const [notes, setNotes] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [reorderPoint, setReorderPoint] = useState<number>(10);

  useEffect(() => {
    fetchData();
  }, []);

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

  // Current stock in the selected warehouse for the selected product
  useEffect(() => {
    if (!selectedWarehouse || !selectedProduct) {
      setCurrentStock(null);
      return;
    }
    const warehouse = warehouses.find((w) => w._id === selectedWarehouse);
    if (!warehouse) {
      setCurrentStock(0);
      return;
    }
    const entry = warehouse.stock?.find((s) => s.productId === selectedProduct);
    setCurrentStock(entry?.quantity ?? 0);
  }, [selectedWarehouse, selectedProduct, warehouses]);

  const warehouseOptions: Option[] = useMemo(() => warehouses.map((w) => ({
    id: w._id,
    title: w.name,
    subtitle: `${w.code} · ${w.address.city}${w.address.state ? `, ${w.address.state}` : ''}`,
    keywords: `${w.name} ${w.code} ${w.address.city} ${w.address.state}`.toLowerCase(),
    meta: (
      <div className="flex items-center gap-1">
        {!w.isActive && <Badge className="bg-slate-400 text-white text-[8px] font-extrabold rounded-full px-1.5">OFF</Badge>}
        {w.isDefault && <Badge className="bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded-full px-1.5">DEFAULT</Badge>}
        <span className="text-[10px] font-bold text-muted-foreground">{w.stock?.length || 0} SKUs</span>
      </div>
    ),
  })), [warehouses]);

  const productOptions: Option[] = useMemo(() => products.map((p) => {
    const stockHere = selectedWarehouse
      ? warehouses.find((w) => w._id === selectedWarehouse)?.stock?.find((s) => s.productId === p._id)?.quantity
      : undefined;
    const img = Array.isArray(p.images) && p.images.length > 0
      ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url)
      : undefined;
    return {
      id: p._id,
      title: p.name,
      subtitle: p.sku ? `SKU: ${p.sku}` : undefined,
      thumb: img,
      keywords: `${p.name} ${p.sku}`.toLowerCase(),
      meta: stockHere !== undefined ? (
        <Badge className={stockHere === 0
          ? 'bg-rose-500 text-white text-[8px] font-extrabold rounded-full px-1.5'
          : stockHere <= 10
            ? 'bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded-full px-1.5'
            : 'bg-emerald-500 text-white text-[8px] font-extrabold rounded-full px-1.5'}>
          {stockHere} here
        </Badge>
      ) : (
        <span className="text-[10px] font-bold text-muted-foreground">{p.stock ?? 0} total</span>
      ),
    };
  }), [products, selectedWarehouse, warehouses]);

  const calculateNewStock = (): number => {
    const current = currentStock || 0;
    if (adjustmentType === 'add') return current + quantity;
    if (adjustmentType === 'remove') return Math.max(0, current - quantity);
    return quantity;
  };

  const getQuantityChange = (): number => {
    const current = currentStock || 0;
    if (adjustmentType === 'add') return quantity;
    if (adjustmentType === 'remove') return -quantity;
    return quantity - current;
  };

  const change = getQuantityChange();
  const canSubmit = !!selectedWarehouse && !!selectedProduct && change !== 0 && !submitting;

  const resetAdjustment = () => {
    setQuantity(adjustmentType === 'set' ? (currentStock || 0) : 10);
    setNotes('');
    setLocation('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWarehouse) {
      toast({ title: 'Pick a location', description: 'Choose which warehouse this stock belongs to.', variant: 'destructive' });
      return;
    }
    if (!selectedProduct) {
      toast({ title: 'Pick a product', description: 'Search and select the product to adjust.', variant: 'destructive' });
      return;
    }
    if (adjustmentType !== 'set' && quantity <= 0) {
      toast({ title: 'Quantity must be greater than 0', variant: 'destructive' });
      return;
    }
    if (change === 0) {
      toast({ title: 'No change detected', description: 'Adjust the quantity before saving.', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);
      const reasonLabel = ADJUSTMENT_REASONS.find((r) => r.value === reason)?.label || reason;

      await adjustStock(selectedWarehouse, {
        productId: selectedProduct,
        quantity: change,
        reason: reasonLabel,
        notes: notes || undefined,
        location: location || undefined,
        reorderPoint,
      });

      const whName = warehouses.find((w) => w._id === selectedWarehouse)?.name || 'warehouse';
      toast({
        title: change > 0 ? `+${change} units added` : `${change} units removed`,
        description: `${selectedProductData?.name} at ${whName} is now ${calculateNewStock()}.`,
      });

      resetAdjustment();
      await fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to adjust stock',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
      </div>
    );
  }

  const selectedWarehouseData = warehouses.find((w) => w._id === selectedWarehouse);

  return (
    <div className="px-3 py-4 space-y-4 max-w-6xl mx-auto">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Boxes className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">Adjust Stock</h1>
            <p className="text-[11px] text-muted-foreground mt-1">
              Receive, remove or recount stock across {warehouses.length} warehouses.
            </p>
          </div>
        </div>
        <Link href="/admin/inventory">
          <Button variant="outline" size="sm" className="h-9 rounded-xl text-[11px] font-extrabold shadow-sm">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Dashboard
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-3">
          {/* Step 1 — Location + Product */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-sm font-extrabold tracking-tight">What &amp; Where</h2>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Step 1 of 3</span>
            </div>
            <CardContent className="p-3.5 grid sm:grid-cols-2 gap-3">
              <SearchCombobox
                label="Location / Warehouse"
                required
                placeholder="Select warehouse…"
                emptyLabel="No warehouse found"
                searchPlaceholder="Search warehouse name, code or city…"
                options={warehouseOptions}
                value={selectedWarehouse}
                onChange={(id) => {
                  setSelectedWarehouse(id || null);
                  setQuantity(10);
                }}
                disabled={warehouses.length === 0}
                disabledHint="No warehouses yet"
              />
              <SearchCombobox
                label="Product"
                required
                placeholder="Select product…"
                emptyLabel="No product found"
                searchPlaceholder="Type 2+ chars to search by name or SKU…"
                minChars={2}
                options={productOptions}
                value={selectedProduct}
                onChange={(id, o) => {
                  setSelectedProduct(id || null);
                  setSelectedProductData(o ? products.find((p) => p._id === o.id) || null : null);
                }}
                disabled={products.length === 0}
                disabledHint="No products yet"
              />
            </CardContent>
          </Card>

          {/* Current stock preview */}
          {selectedWarehouse && selectedProduct && (
            <Card className="rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm overflow-hidden">
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground">All warehouses</p>
                    <p className="text-lg font-black mt-0.5">{selectedProductData?.stock ?? 0}</p>
                  </div>
                  <div className="border-x border-slate-200 dark:border-slate-700">
                    <p className="text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground">At {selectedWarehouseData?.code}</p>
                    <p className={`text-lg font-black mt-0.5 ${(currentStock ?? 0) === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                      {currentStock ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground">After adjustment</p>
                    <p className="text-lg font-black mt-0.5 text-emerald-600">{calculateNewStock()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 — Adjustment */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <ClipboardList className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-sm font-extrabold tracking-tight">Adjustment</h2>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Step 2 of 3</span>
            </div>
            <CardContent className="p-3.5 space-y-3">
              {/* Type segmented control */}
              <div>
                <Label className="text-[11px] font-bold">Type <span className="text-amber-600">*</span></Label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {([
                    { k: 'add', label: 'Add', icon: Plus, tone: 'data-[on=true]:bg-emerald-500 data-[on=true]:text-white data-[on=true]:border-emerald-500' },
                    { k: 'remove', label: 'Remove', icon: Minus, tone: 'data-[on=true]:bg-rose-500 data-[on=true]:text-white data-[on=true]:border-rose-500' },
                    { k: 'set', label: 'Set exact', icon: Package, tone: 'data-[on=true]:bg-amber-500 data-[on=true]:text-slate-950 data-[on=true]:border-amber-500' },
                  ] as const).map((t) => (
                    <button
                      key={t.k}
                      type="button"
                      data-on={adjustmentType === t.k}
                      onClick={() => {
                        setAdjustmentType(t.k);
                        setQuantity(t.k === 'set' ? (currentStock || 0) : 10);
                      }}
                      className={`h-9 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-colors hover:bg-amber-500/10 ${t.tone}`}
                    >
                      <t.icon className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="quantity" className="text-[11px] font-bold">
                    {adjustmentType === 'set' ? 'New quantity' : 'Quantity'} <span className="text-amber-600">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-9 rounded-lg text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold">Result</Label>
                  <div className="mt-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 flex items-center justify-between gap-2">
                    <span className="text-sm font-black">{calculateNewStock()}</span>
                    {change !== 0 && (
                      <Badge className={change > 0
                        ? 'bg-emerald-500 text-white text-[9px] font-extrabold rounded px-1.5'
                        : 'bg-rose-500 text-white text-[9px] font-extrabold rounded px-1.5'}>
                        {change > 0 ? '+' : ''}{change}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-bold">Reason <span className="text-amber-600">*</span></Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="h-9 rounded-lg text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADJUSTMENT_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3 — Extras */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <Package className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-sm font-extrabold tracking-tight">Extras</h2>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Optional · Step 3 of 3</span>
            </div>
            <CardContent className="p-3.5 grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="location" className="text-[11px] font-bold">Bin / Shelf</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Aisle A, Shelf 3"
                  className="h-9 rounded-lg text-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reorderPoint" className="text-[11px] font-bold">Reorder Point</Label>
                <Input
                  id="reorderPoint"
                  type="number"
                  min={0}
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-9 rounded-lg text-xs mt-1"
                />
                <p className="text-[9px] text-muted-foreground mt-1">Alert when stock falls below this</p>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes" className="text-[11px] font-bold">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Supplier invoice #, damage report, recount details…"
                  rows={2}
                  className="text-xs rounded-lg mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedProduct(null);
                setSelectedProductData(null);
                setQuantity(10);
                setNotes('');
                setLocation('');
              }}
              className="h-9 rounded-xl text-[11px] font-extrabold"
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              size="sm"
              className="h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold shadow-sm disabled:opacity-40"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
              {adjustmentType === 'add' ? 'Add Stock' : adjustmentType === 'remove' ? 'Remove Stock' : 'Set Stock'}
              {change !== 0 && <span className="ml-1.5 text-[10px] opacity-70">({change > 0 ? '+' : ''}{change})</span>}
            </Button>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {/* Selection summary */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-3 space-y-2.5">
              <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">Selection</p>

              <div className="flex items-center gap-2">
                <WarehouseIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground">Location</p>
                  <p className="text-[11px] font-bold truncate">{selectedWarehouseData?.name || 'Not selected'}</p>
                </div>
                {selectedWarehouseData?.isDefault && (
                  <Badge className="bg-amber-500 text-slate-950 text-[8px] font-extrabold rounded px-1">DEFAULT</Badge>
                )}
              </div>

              <div className="h-px bg-slate-200 dark:border-slate-800" />

              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground">Product</p>
                  <p className="text-[11px] font-bold truncate">{selectedProductData?.name || 'Not selected'}</p>
                  {selectedProductData?.sku && (
                    <p className="text-[9px] font-mono text-muted-foreground">{selectedProductData.sku}</p>
                  )}
                </div>
              </div>

              {selectedWarehouse && selectedProduct && (
                <>
                  <div className="h-px bg-slate-200 dark:border-slate-800" />
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
                      <p className="text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground">Change</p>
                      <p className={`text-base font-black ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {change > 0 ? '+' : ''}{change}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2">
                      <p className="text-[9px] uppercase tracking-widest font-extrabold text-muted-foreground">New total</p>
                      <p className="text-base font-black">{calculateNewStock()}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-3 space-y-2">
              <p className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">How it works</p>
              {[
                { icon: Plus, tone: 'bg-emerald-500/10 text-emerald-600', t: 'Add', d: 'Receiving shipments or customer returns' },
                { icon: Minus, tone: 'bg-rose-500/10 text-rose-600', t: 'Remove', d: 'Damages, theft or manual sale' },
                { icon: Package, tone: 'bg-amber-500/10 text-amber-600', t: 'Set exact', d: 'Overwrite after a physical recount' },
              ].map((r) => (
                <div key={r.t} className="flex items-start gap-2">
                  <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${r.tone}`}>
                    <r.icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold leading-tight">{r.t}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">{r.d}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Links */}
          <div className="grid gap-1.5">
            {[
              { href: '/admin/inventory/movements', icon: History, label: 'Movement History' },
              { href: '/admin/inventory/transfer', icon: ArrowLeftRight, label: 'Stock Transfer' },
              { href: '/admin/inventory/warehouses', icon: WarehouseIcon, label: 'Manage Warehouses' },
            ].map((l) => (
              <Link key={l.href} href={l.href}>
                <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-400 hover:shadow-md transition-all group">
                  <CardContent className="p-2.5 flex items-center gap-2">
                    <l.icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                    <span className="text-[11px] font-bold truncate">{l.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}