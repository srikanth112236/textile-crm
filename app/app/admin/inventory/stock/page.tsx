'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchCombobox, type ComboboxOption } from '@/components/admin/SearchCombobox';
import {
  ArrowLeft, Plus, Minus, Package, Loader2, Warehouse as WarehouseIcon,
  Check, Boxes, MapPin, ClipboardList, History, ArrowLeftRight, AlertTriangle, Info,
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

const TYPE_COPY: Record<AdjustmentType, { title: string; description: string; hint: string; reason: string }> = {
  add: {
    title: 'Add stock',
    description: 'Increases the on-hand count by the quantity you enter.',
    hint: 'Use for new shipments, supplier deliveries and customer returns.',
    reason: 'stock_received',
  },
  remove: {
    title: 'Remove stock',
    description: 'Decreases the on-hand count by the quantity you enter.',
    hint: 'Use for damages, theft, losses or stock sold outside the store.',
    reason: 'damage',
  },
  set: {
    title: 'Set exact',
    description: 'Overwrites the on-hand count with the number you physically counted.',
    hint: 'Use after a physical recount. Only the difference is recorded as the movement.',
    reason: 'recount',
  },
};

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

  const [confirmOpen, setConfirmOpen] = useState(false);

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
    const entry = warehouse.stock?.find((s) => String(s.productId) === selectedProduct);
    setCurrentStock(entry?.quantity ?? 0);
  }, [selectedWarehouse, selectedProduct, warehouses]);

  // Reuse the stock entry's existing threshold/bin instead of silently
  // overwriting them with the form defaults.
  useEffect(() => {
    if (!selectedWarehouse || !selectedProduct) return;
    const entry = warehouses
      .find((w) => w._id === selectedWarehouse)
      ?.stock?.find((s) => String(s.productId) === selectedProduct);
    setReorderPoint(entry?.reorderPoint ?? 10);
    setLocation(entry?.location ?? '');
  }, [selectedWarehouse, selectedProduct, warehouses]);

  const warehouseOptions: ComboboxOption[] = useMemo(() => warehouses.map((w) => ({
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

  const productOptions: ComboboxOption[] = useMemo(() => products.map((p) => {
    const stockHere = selectedWarehouse
      ? warehouses.find((w) => w._id === selectedWarehouse)?.stock?.find((s) => String(s.productId) === p._id)?.quantity
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

  const selectedWarehouseData = warehouses.find((w) => w._id === selectedWarehouse);
  const selectedStockEntry = selectedWarehouseData?.stock?.find(
    (s) => String(s.productId) === selectedProduct,
  );
  const reservedHere = selectedStockEntry?.reservedQuantity ?? 0;

  const stockAt = (warehouseId: string | null, productId: string | null) => {
    if (!warehouseId || !productId) return 0;
    const warehouse = warehouses.find((w) => w._id === warehouseId);
    const entry = warehouse?.stock?.find((s) => String(s.productId) === productId);
    return entry?.quantity ?? 0;
  };

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
  const overRemoving = adjustmentType === 'remove' && quantity > (currentStock || 0);
  const canSubmit = !!selectedWarehouse && !!selectedProduct && change !== 0 && !overRemoving && !submitting;
  const copy = TYPE_COPY[adjustmentType];

  const selectType = (next: AdjustmentType) => {
    setAdjustmentType(next);
    setQuantity(next === 'set' ? (currentStock || 0) : 10);
    setReason(TYPE_COPY[next].reason);
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    if (overRemoving) {
      toast({
        title: 'Not enough stock to remove',
        description: `Only ${currentStock || 0} units are on hand in ${selectedWarehouseData?.code || 'this warehouse'}.`,
        variant: 'destructive',
      });
      return;
    }
    if (change === 0) {
      toast({ title: 'No change detected', description: 'Adjust the quantity before saving.', variant: 'destructive' });
      return;
    }

    // Never write straight away — show exactly what the stock ledger will record.
    setConfirmOpen(true);
  };

  const confirmAdjustment = async () => {
    if (!selectedWarehouse || !selectedProduct) return;

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

      setConfirmOpen(false);
      setQuantity(adjustmentType === 'set' ? calculateNewStock() : 10);
      setNotes('');
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
        <div className="lg:col-span-2 space-y-3 min-w-0">
          {/* Step 1 — Location + Product */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
              <MapPin className="h-3.5 w-3.5 text-amber-500" />
              <h2 className="text-sm font-extrabold tracking-tight">What &amp; Where</h2>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 ml-auto">Step 1 of 3</span>
            </div>
            <CardContent className="p-3.5">
              <div className="grid sm:grid-cols-2 gap-3 items-start">
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
                    setQuantity(adjustmentType === 'set' ? stockAt(id || null, selectedProduct) : 10);
                  }}
                  disabled={warehouses.length === 0}
                  disabledHint="No warehouses yet — create one first"
                  fallbackIcon={WarehouseIcon}
                  hint={warehouses.length > 0 ? `${warehouses.length} locations available` : undefined}
                />
                <SearchCombobox
                  label="Product"
                  required
                  placeholder="Select product…"
                  emptyLabel="No product found"
                  searchPlaceholder="Search by product name or SKU…"
                  options={productOptions}
                  value={selectedProduct}
                  onChange={(id, o) => {
                    setSelectedProduct(id || null);
                    setSelectedProductData(o ? products.find((p) => p._id === o.id) || null : null);
                    setQuantity(adjustmentType === 'set' ? stockAt(selectedWarehouse, id || null) : 10);
                  }}
                  disabled={products.length === 0}
                  disabledHint="No products yet"
                  fallbackIcon={Package}
                  hint={
                    products.length === 0
                      ? undefined
                      : selectedWarehouse
                        ? `${products.length} products · showing stock for this location`
                        : `${products.length} products · pick a location to see stock here`
                  }
                />
              </div>

              {!selectedWarehouse && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-2.5 py-2">
                  <Info className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground font-medium leading-snug">
                    Start with a location — stock counts are always stored per warehouse, so the product
                    list will show the quantity held at that location.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current stock preview */}
          {selectedWarehouse && selectedProduct && (
            <Card className="rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
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
                    {reservedHere > 0 && (
                      <p className="text-[9px] font-bold text-violet-600">{reservedHere} reserved</p>
                    )}
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
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
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
                      onClick={() => selectType(t.k)}
                      className={`h-9 rounded-lg border border-slate-300 dark:border-slate-700 text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-colors hover:bg-amber-500/10 ${t.tone}`}
                    >
                      <t.icon className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5">
                  <Info className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{copy.title}:</span>{' '}
                    {copy.description} <span className="text-slate-400">{copy.hint}</span>
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 items-start">
                <div>
                  <Label htmlFor="quantity" className="text-[11px] font-bold">
                    {adjustmentType === 'set' ? 'Counted quantity' : 'Quantity'} <span className="text-amber-600">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={0}
                    max={adjustmentType === 'remove' ? (currentStock || 0) : undefined}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    aria-invalid={overRemoving}
                    className={`h-9 rounded-lg text-xs mt-1 ${overRemoving ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                  />
                  {overRemoving ? (
                    <p className="text-[9px] font-bold text-rose-600 mt-1">
                      Only {currentStock || 0} on hand — remove less.
                    </p>
                  ) : (
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {adjustmentType === 'set' ? 'Physical count, not a difference' : 'Units to adjust'}
                    </p>
                  )}
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
                  <p className="text-[9px] text-muted-foreground mt-1 truncate">
                    {currentStock ?? 0} → {calculateNewStock()} units
                  </p>
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
                  <p className="text-[9px] text-muted-foreground mt-1">Saved on the stock ledger</p>
                </div>
              </div>

              {adjustmentType === 'set' && reservedHere > 0 && quantity < reservedHere && (
                <div className="flex items-start gap-2 rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/20 px-2.5 py-2">
                  <Info className="h-3 w-3 text-violet-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-violet-800 dark:text-violet-300 font-medium leading-snug">
                    {reservedHere} unit{reservedHere === 1 ? ' is' : 's are'} reserved by open orders here.
                    Counting below that will leave 0 available until those orders ship or are cancelled.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3 — Extras */}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 shadow-sm">
            <p className="text-[10px] text-muted-foreground flex-1">
              {selectedWarehouse && selectedProduct && change !== 0
                ? `Review & confirm: ${change > 0 ? '+' : ''}${change} units, ${currentStock ?? 0} → ${calculateNewStock()}.`
                : 'Pick a location, a product and a quantity to continue.'}
            </p>
            <div className="flex items-center gap-2 sm:shrink-0">
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
        </div>

        {/* Side panel */}
        <div className="space-y-3 lg:sticky lg:top-4">
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

              <div className="h-px bg-slate-200 dark:bg-slate-800" />

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
                  <div className="h-px bg-slate-200 dark:bg-slate-800" />
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
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/[0.07] border border-amber-200 dark:border-amber-900 px-2 py-1.5 mt-1">
                <Info className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[9px] text-amber-800 dark:text-amber-300 leading-snug">
                  Every adjustment asks for confirmation, then writes a stock movement so the change can be audited.
                </p>
              </div>
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

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!submitting) setConfirmOpen(open); }}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
          <div className={`px-4 py-3 border-b ${
            adjustmentType === 'add'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
              : adjustmentType === 'remove'
                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                adjustmentType === 'add'
                  ? 'bg-emerald-500/15 text-emerald-600'
                  : adjustmentType === 'remove'
                    ? 'bg-rose-500/15 text-rose-600'
                    : 'bg-amber-500/15 text-amber-600'
              }`}>
                {adjustmentType === 'add' ? <Plus className="h-4 w-4" />
                  : adjustmentType === 'remove' ? <Minus className="h-4 w-4" />
                    : <Package className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-extrabold leading-tight">
                  Confirm {adjustmentType === 'set' ? 'stock recount' : adjustmentType === 'add' ? 'stock addition' : 'stock removal'}
                </DialogTitle>
                <DialogDescription className="text-[10px] mt-0.5">
                  Review exactly what will be written to the stock ledger.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center gap-2.5 p-2.5">
                <WarehouseIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold truncate">{selectedWarehouseData?.name}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{selectedWarehouseData?.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5">
                <Package className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold truncate">{selectedProductData?.name}</p>
                  <p className="text-[9px] text-muted-foreground font-mono">{selectedProductData?.sku || 'No SKU'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2">
                <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Current</p>
                <p className="text-base font-black mt-0.5">{currentStock ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2">
                <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Change</p>
                <p className={`text-base font-black mt-0.5 ${change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {change > 0 ? '+' : ''}{change}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2">
                <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">New total</p>
                <p className="text-base font-black mt-0.5">{calculateNewStock()}</p>
              </div>
            </div>

            <dl className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              {[
                ['Reason', ADJUSTMENT_REASONS.find((r) => r.value === reason)?.label || reason],
                ['Bin / Shelf', location || '—'],
                ['Reorder point', String(reorderPoint)],
                ['Notes', notes || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3 px-2.5 py-1.5">
                  <dt className="text-muted-foreground shrink-0">{k}</dt>
                  <dd className="font-bold text-right break-words min-w-0">{v}</dd>
                </div>
              ))}
            </dl>

            {adjustmentType === 'set' && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-2">
                <Info className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium leading-snug">
                  This overwrites the on-hand count with <span className="font-extrabold">{quantity}</span>, regardless of the
                  current {currentStock ?? 0}. The ledger records the difference of {change > 0 ? '+' : ''}{change}.
                </p>
              </div>
            )}

            {adjustmentType === 'remove' && calculateNewStock() === 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-2">
                <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose-800 dark:text-rose-300 font-medium leading-snug">
                  This removes all remaining stock at this location and marks the product out of stock.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => setConfirmOpen(false)}
              className="h-9 rounded-xl text-[11px] font-extrabold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={confirmAdjustment}
              className={`h-9 rounded-xl text-[11px] font-extrabold text-white ${
                adjustmentType === 'add'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : adjustmentType === 'remove'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
              }`}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
              Confirm {adjustmentType === 'add' ? 'addition' : adjustmentType === 'remove' ? 'removal' : 'recount'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
