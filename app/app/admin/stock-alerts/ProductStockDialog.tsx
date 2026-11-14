'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { productsApi } from '@/lib/api/products';
import {
  getProductStock,
  getStockMovements,
  type StockMovement,
  type WarehouseStock,
} from '@/lib/api/inventory';
import type { IProduct } from '@/lib/api/types';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  History,
  Layers,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  SlidersHorizontal,
  Tag,
  TrendingDown,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

export interface AlertProductRef {
  _id: string;
  name?: string;
  price?: number;
  compareAtPrice?: number;
  stock?: number;
  lowStockThreshold?: number;
  sku?: string;
  status?: string;
  images?: Array<string | { url?: string }>;
}

export interface StockAlertContext {
  kind: 'stock' | 'price';
  size?: string;
  contact?: string;
  contactType?: string;
  whatsappConsent?: boolean;
  notified?: boolean;
  createdAt: string;
  targetPrice?: number;
  lastNotifiedPrice?: number;
  active?: boolean;
}

interface ProductStockSnapshot {
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    stock: WarehouseStock[];
  }>;
  totals: { totalQuantity: number; totalReserved: number; totalAvailable: number };
}

const MOVEMENT_META: Record<string, { label: string; tone: string; icon: any }> = {
  stock_in: { label: 'Stock in', tone: 'bg-emerald-500 text-white', icon: ArrowUp },
  stock_out: { label: 'Stock out', tone: 'bg-rose-500 text-white', icon: ArrowDown },
  transfer: { label: 'Transfer', tone: 'bg-amber-500 text-slate-950', icon: ArrowUpDown },
  order: { label: 'Order', tone: 'bg-violet-500 text-white', icon: Package },
  order_cancelled: { label: 'Order cancelled', tone: 'bg-slate-400 text-white', icon: TrendingDown },
  order_refund: { label: 'Refund', tone: 'bg-rose-400 text-white', icon: TrendingDown },
  adjustment: { label: 'Adjustment', tone: 'bg-amber-500 text-slate-950', icon: Layers },
  damage: { label: 'Damage', tone: 'bg-rose-500 text-white', icon: ArrowDown },
  return: { label: 'Return', tone: 'bg-emerald-500 text-white', icon: ArrowUp },
  recount: { label: 'Recount', tone: 'bg-violet-500 text-white', icon: Clock },
};

function movementMeta(type: string) {
  return MOVEMENT_META[type] || { label: String(type || 'Movement').replace(/_/g, ' '), tone: 'bg-slate-200 text-slate-800', icon: Layers };
}

export function productImageUrl(images?: Array<string | { url?: string }>): string | null {
  if (!images || images.length === 0) return null;
  const first = images[0];
  const url = typeof first === 'string' ? first : first?.url;
  if (!url) return null;
  if (url.includes('/uploads/')) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        return `/api/images${new URL(url).pathname}`;
      } catch {
        return url;
      }
    }
    if (url.startsWith('/uploads/')) return `/api/images${url}`;
  }
  return url;
}

function stockHealth(onHand: number, threshold: number) {
  if (onHand <= 0) {
    return { label: 'Out of stock', className: 'bg-rose-500/15 text-rose-600 border-rose-200 dark:border-rose-900', dot: 'bg-rose-500', rail: 'bg-rose-500' };
  }
  if (onHand <= Math.max(1, Math.ceil(threshold / 2))) {
    return { label: 'Critical', className: 'bg-orange-500/15 text-orange-600 border-orange-200 dark:border-orange-900', dot: 'bg-orange-500', rail: 'bg-orange-500' };
  }
  if (onHand <= threshold) {
    return { label: 'Low stock', className: 'bg-amber-500/15 text-amber-600 border-amber-200 dark:border-amber-900', dot: 'bg-amber-500', rail: 'bg-amber-500' };
  }
  return { label: 'In stock', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-200 dark:border-emerald-900', dot: 'bg-emerald-500', rail: 'bg-emerald-500' };
}

export function ProductThumb({
  images,
  name,
  className = 'h-12 w-12',
}: {
  images?: Array<string | { url?: string }>;
  name?: string;
  className?: string;
}) {
  const url = productImageUrl(images);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800 flex items-center justify-center`}>
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name || 'Product'}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package className="h-5 w-5 text-slate-400" />
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone = '',
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: string;
  icon?: any;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className="h-2.5 w-2.5" />}
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-1 text-lg font-black leading-none tracking-tight ${tone}`}>{value}</div>
      {sub && <div className="mt-1 truncate text-[9px] font-medium text-muted-foreground">{sub}</div>}
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-2.5 py-1.5">
      <dt className="shrink-0 text-[10px] font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-[10px] font-bold">{value}</dd>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type TabKey = 'overview' | 'locations' | 'activity';

export function ProductStockDialog({
  open,
  onOpenChange,
  productId,
  fallback,
  context,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string | null;
  fallback?: AlertProductRef | null;
  context?: StockAlertContext | null;
}) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [flow, setFlow] = useState<'all' | 'in' | 'out'>('all');
  const [loading, setLoading] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [stock, setStock] = useState<ProductStockSnapshot | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);

    const [productResult, stockResult, movementResult] = await Promise.allSettled([
      productsApi.getProduct(productId),
      getProductStock(productId),
      getStockMovements({ productId, limit: 60 }),
    ]);

    if (productResult.status === 'fulfilled') setProduct(productResult.value.data);
    if (stockResult.status === 'fulfilled') setStock(stockResult.value as ProductStockSnapshot);
    if (movementResult.status === 'fulfilled') setMovements(movementResult.value.movements || []);

    if (productResult.status === 'rejected' && stockResult.status === 'rejected') {
      const reason: any = productResult.reason;
      setError(reason?.response?.data?.error || reason?.message || 'Could not load stock details');
    }

    setRefreshedAt(new Date());
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    if (!open || !productId) return;
    setTab('overview');
    setFlow('all');
    setCopied(false);
    setProduct(null);
    setStock(null);
    setMovements([]);
    load();
  }, [open, productId, load]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const totals = stock?.totals;
  const locations = stock?.warehouses?.filter((warehouse) => warehouse.stock.length > 0) ?? [];
  const variants = (product?.variantSKUs || []).filter((variant) => variant.isEnabled !== false);
  const variantStockTotal = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  const warehouseOnHand = totals?.totalQuantity ?? 0;
  const hasWarehouseStock = locations.length > 0;
  const onHand = hasWarehouseStock
    ? warehouseOnHand
    : variants.length > 0
      ? variantStockTotal
      : product?.stock ?? fallback?.stock ?? 0;
  const reserved = hasWarehouseStock ? totals?.totalReserved ?? 0 : 0;
  const available = hasWarehouseStock
    ? totals?.totalAvailable ?? Math.max(0, onHand - reserved)
    : Math.max(0, onHand - reserved);
  const threshold = product?.lowStockThreshold ?? fallback?.lowStockThreshold ?? 10;
  const health = stockHealth(onHand, threshold);
  const unitPrice = product?.price ?? fallback?.price ?? 0;
  const compareAt = product?.compareAtPrice ?? fallback?.compareAtPrice;
  const unitCost = product?.costPrice || unitPrice;
  const stockValue = unitCost * onHand;
  const retailValue = unitPrice * onHand;
  const category = typeof product?.category === 'object' && product?.category !== null
    ? product.category.name
    : undefined;
  const selectedVariant = context?.size
    ? variants.find((variant) => Object.values(variant.attributes || {}).some(
      (value) => String(value).toUpperCase() === String(context.size).toUpperCase()
    ))
    : undefined;
  const displayName = product?.name || fallback?.name || 'Product';
  const sku = product?.sku || fallback?.sku;
  const lastMovement = movements[0];
  const discountPct = compareAt && compareAt > unitPrice
    ? Math.round(((compareAt - unitPrice) / compareAt) * 100)
    : 0;
  const priceDropGap = context?.kind === 'price' && context?.targetPrice
    ? Math.max(0, context.targetPrice - unitPrice)
    : 0;
  const targetReached = context?.kind === 'price' && Boolean(context?.targetPrice) && unitPrice < (context?.targetPrice || 0);
  const atTarget = context?.kind === 'price' && Boolean(context?.targetPrice) && unitPrice === context?.targetPrice;

  const flowCounts = useMemo(() => ({
    all: movements.length,
    in: movements.filter((movement) => movement.quantity > 0).length,
    out: movements.filter((movement) => movement.quantity < 0).length,
  }), [movements]);

  const visibleMovements = useMemo(
    () => movements.filter((movement) => {
      if (flow === 'in') return movement.quantity > 0;
      if (flow === 'out') return movement.quantity < 0;
      return true;
    }),
    [movements, flow]
  );

  const copyContact = async () => {
    if (!context?.contact) return;
    try {
      await navigator.clipboard.writeText(context.contact);
      setCopied(true);
    } catch {
      /* clipboard unavailable */
    }
  };

  const tabs: Array<{ key: TabKey; label: string; icon: any; count?: number }> = [
    { key: 'overview', label: 'Overview', icon: SlidersHorizontal },
    { key: 'locations', label: 'Locations', icon: WarehouseIcon, count: locations.length },
    { key: 'activity', label: 'Stock activity', icon: History, count: movements.length },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:w-full">
        {/* Header */}
        <div className="relative shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-violet-50/60 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/30">
          <div className="flex items-start gap-3 px-4 pb-2.5 pt-4 pr-12">
            <ProductThumb images={product?.images || fallback?.images} name={displayName} className="h-12 w-12 sm:h-14 sm:w-14" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <DialogTitle className="max-w-full truncate text-[15px] font-extrabold leading-tight tracking-tight">
                  {displayName}
                </DialogTitle>
                <Badge variant="outline" className={`rounded-full border px-2 py-0 text-[9px] font-extrabold uppercase tracking-wider ${health.className}`}>
                  <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${health.dot}`} />
                  {health.label}
                </Badge>
                {product?.status && (
                  <Badge variant="outline" className="rounded-full px-2 py-0 text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {product.status.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                <span className="font-mono font-semibold">{sku || 'No SKU'}</span>
                {category && (<><span className="text-slate-300">·</span><span className="truncate">{category}</span></>)}
                <span className="text-slate-300">·</span>
                <span>{onHand} on hand</span>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <div className="text-right">
                <div className="text-base font-black leading-none tracking-tight">{unitPrice ? formatPrice(unitPrice) : '—'}</div>
                {compareAt && compareAt > unitPrice ? (
                  <div className="mt-0.5 text-[9px] font-semibold text-muted-foreground">
                    <span className="line-through">{formatPrice(compareAt)}</span>
                    <span className="ml-1 font-extrabold text-emerald-600">{discountPct}% off</span>
                  </div>
                ) : (
                  <div className="mt-0.5 text-[9px] font-medium text-muted-foreground">Selling price</div>
                )}
              </div>
              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-extrabold">
                <Link href={`/admin/products/${productId}`} target="_blank">
                  <ExternalLink className="mr-1.5 h-3 w-3" /> Open
                </Link>
              </Button>
            </div>
          </div>

          <DialogDescription className="sr-only">
            Complete stock position, warehouse split and stock movement history for {displayName}.
          </DialogDescription>

          <div className="flex items-center gap-1 px-3">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`relative flex h-9 items-center gap-1.5 rounded-t-lg px-2.5 text-[10px] font-extrabold uppercase tracking-widest transition-colors ${
                  tab === item.key
                    ? 'text-violet-700 dark:text-violet-300'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{item.label}</span>
                {typeof item.count === 'number' && (
                  <span className={`rounded-full px-1.5 py-0 text-[9px] font-extrabold ${
                    tab === item.key ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300' : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800'
                  }`}>
                    {item.count}
                  </span>
                )}
                {tab === item.key && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-violet-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/60 px-3.5 py-3 dark:bg-slate-950/40">
          {loading && !product && !stock ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              <p className="text-[11px] font-semibold">Loading stock details…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
              <p className="text-xs font-bold">{error}</p>
              <Button variant="outline" size="sm" onClick={load} className="h-8 rounded-lg text-[10px] font-extrabold">
                <RefreshCw className="mr-1.5 h-3 w-3" /> Try again
              </Button>
            </div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    <StatTile label="On hand" value={onHand} sub="Physical units" icon={Boxes} tone={health.label === 'Out of stock' ? 'text-rose-600' : ''} />
                    <StatTile label="Reserved" value={reserved} sub="Held for orders" icon={Clock} tone={reserved > 0 ? 'text-violet-600' : ''} />
                    <StatTile label="Available" value={available} sub="Sellable now" icon={CheckCircle2} tone={available > 0 ? 'text-emerald-600' : 'text-rose-600'} />
                    <StatTile label="Reorder at" value={threshold} sub="Low-stock trigger" icon={AlertTriangle} />
                    <StatTile label="Stock value" value={stockValue ? formatPrice(stockValue) : '—'} sub={product?.costPrice ? `${formatPrice(retailValue)} at retail` : 'Valued at selling price'} icon={Tag} />
                    <StatTile label="Locations" value={locations.length} sub={locations.length === 0 ? 'No warehouse records' : 'Warehouse records'} icon={WarehouseIcon} />
                  </div>

                  <div className="grid gap-2.5 lg:grid-cols-3">
                    {/* Alert context */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
                        {context?.kind === 'price' ? <Tag className="h-3.5 w-3.5 text-amber-500" /> : <Clock className="h-3.5 w-3.5 text-violet-500" />}
                        <h3 className="text-[11px] font-extrabold tracking-tight">
                          {context?.kind === 'price' ? 'Price alert context' : 'Back-in-stock request'}
                        </h3>
                        <span className="ml-auto text-[9px] font-semibold text-muted-foreground">{formatDate(context?.createdAt)}</span>
                      </div>
                      <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                        {context?.kind === 'price' ? (
                          <>
                            <FactRow label="Target price" value={context?.targetPrice ? formatPrice(context.targetPrice) : '—'} />
                            <FactRow label="Current price" value={unitPrice ? formatPrice(unitPrice) : '—'} />
                            <FactRow
                              label="Drop needed"
                              value={targetReached
                                ? <span className="text-emerald-600">Target reached</span>
                                : atTarget
                                  ? <span className="text-amber-600">At target — waiting for a drop</span>
                                  : <span className="text-amber-600">{formatPrice(priceDropGap)} more</span>}
                            />
                            <FactRow label="Last notified at" value={context?.lastNotifiedPrice ? formatPrice(context.lastNotifiedPrice) : 'Never'} />
                            <FactRow
                              label="Subscriber"
                              value={(
                                <span className="inline-flex items-center gap-1">
                                  <span className="truncate">{context?.contact || 'in-app only'}</span>
                                  {context?.contact && (
                                    <button type="button" onClick={copyContact} className="text-slate-400 transition-colors hover:text-violet-600" aria-label="Copy contact">
                                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                    </button>
                                  )}
                                </span>
                              )}
                            />
                            <FactRow label="Alert status" value={context?.active ? 'Active' : 'Inactive'} />
                          </>
                        ) : (
                          <>
                            <FactRow label="Requested size" value={context?.size || 'Any size'} />
                            <FactRow label="Selected SKU" value={selectedVariant?.sku || sku || '—'} />
                            <FactRow
                              label="Contact"
                              value={(
                                <span className="inline-flex items-center gap-1">
                                  <span className="truncate">{context?.contact || '—'}</span>
                                  {context?.contact && (
                                    <button type="button" onClick={copyContact} className="text-slate-400 transition-colors hover:text-violet-600" aria-label="Copy contact">
                                      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                    </button>
                                  )}
                                </span>
                              )}
                            />
                            <FactRow label="WhatsApp consent" value={context?.whatsappConsent ? 'Yes' : 'No'} />
                            <FactRow label="Notification" value={context?.notified ? 'Sent' : 'Waiting for restock'} />
                          </>
                        )}
                        <FactRow label="Reorder point" value={`${threshold} units`} />
                        <FactRow label="Reserved" value={`${reserved} units`} />
                      </dl>
                    </div>

                    {/* Stock health */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
                        <Boxes className="h-3.5 w-3.5 text-emerald-500" />
                        <h3 className="text-[11px] font-extrabold tracking-tight">Stock health</h3>
                      </div>
                      <div className="space-y-2.5 p-2.5">
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className={health.label === 'In stock' ? 'text-emerald-600' : health.label === 'Out of stock' ? 'text-rose-600' : 'text-amber-600'}>
                              {health.label}
                            </span>
                            <span className="text-muted-foreground">{onHand} units</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${health.rail}`}
                              style={{ width: `${Math.min(100, Math.round((onHand / Math.max(threshold * 2, onHand, 1)) * 100))}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[9px] font-medium text-muted-foreground">
                            {onHand <= 0
                              ? 'No units left — customers cannot buy this product.'
                              : onHand <= threshold
                                ? `At or below the reorder point of ${threshold}. Restock soon.`
                                : `${onHand - threshold} units above the ${threshold}-unit reorder point.`}
                          </p>
                        </div>
                        <dl className="divide-y divide-slate-100 rounded-lg border border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                          <FactRow label="Variants" value={variants.length || (product?.hasVariants ? 0 : 1)} />
                          <FactRow label="Retail value" value={retailValue ? formatPrice(retailValue) : '—'} />
                          <FactRow label="Last movement" value={lastMovement ? formatDate(lastMovement.createdAt) : '—'} />
                        </dl>
                      </div>
                    </div>
                  </div>

                  {/* Variants */}
                  {variants.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
                        <Layers className="h-3.5 w-3.5 text-violet-500" />
                        <h3 className="text-[11px] font-extrabold tracking-tight">Variant stock</h3>
                        <Badge variant="outline" className="ml-auto rounded-full px-1.5 py-0 text-[9px] font-extrabold">{variants.length}</Badge>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {variants.map((variant) => {
                          const variantHealth = stockHealth(variant.stock, variant.lowStockThreshold ?? threshold);
                          return (
                            <div key={variant.sku} className="flex items-center gap-2.5 px-2.5 py-1.5">
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${variantHealth.dot}`} />
                              <span className="w-24 shrink-0 truncate font-mono text-[10px] font-bold">{variant.sku}</span>
                              <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
                                {Object.entries(variant.attributes || {}).map(([key, value]) => `${key}: ${value}`).join(' · ') || '—'}
                              </span>
                              <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">{formatPrice(variant.price)}</span>
                              <span className={`w-16 shrink-0 text-right text-[11px] font-black ${variant.stock <= 0 ? 'text-rose-600' : variant.stock <= (variant.lowStockThreshold ?? threshold) ? 'text-amber-600' : ''}`}>
                                {variant.stock}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LOCATIONS */}
              {tab === 'locations' && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    <h3 className="text-[11px] font-extrabold tracking-tight">Warehouse split</h3>
                    <span className="ml-auto text-[9px] font-semibold text-muted-foreground">
                      {onHand} on hand · {reserved} reserved · {available} available
                    </span>
                  </div>
                  {locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
                      <WarehouseIcon className="h-6 w-6 text-slate-300" />
                      <p className="text-xs font-bold">Not stocked in any warehouse</p>
                      <p className="max-w-xs text-[10px] text-muted-foreground">
                        This product has no warehouse-level stock record yet. Add stock from the stock adjustment page.
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-1 h-8 rounded-lg text-[10px] font-extrabold">
                        <Link href="/admin/inventory/stock">Adjust stock</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 bg-muted/40 dark:border-slate-800">
                            {['Warehouse', 'On hand', 'Reserved', 'Available', 'Reorder', 'Bin', 'Last update'].map((heading) => (
                              <th key={heading} className="whitespace-nowrap px-2.5 py-1.5 text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground">
                                {heading}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {locations.map((warehouse) => {
                            const rows = warehouse.stock;
                            const quantity = rows.reduce((sum, row) => sum + (row.quantity || 0), 0);
                            const warehouseReserved = rows.reduce((sum, row) => sum + (row.reservedQuantity || 0), 0);
                            const warehouseAvailable = rows.reduce((sum, row) => sum + (row.availableQuantity ?? Math.max(0, (row.quantity || 0) - (row.reservedQuantity || 0))), 0);
                            const reorder = Math.max(...rows.map((row) => row.reorderPoint || 0), 0);
                            const bin = rows.find((row) => row.location)?.location;
                            const lastUpdate = rows
                              .map((row) => row.lastStockUpdate)
                              .filter(Boolean)
                              .sort()
                              .at(-1);
                            const warehouseHealth = stockHealth(quantity, reorder || threshold);
                            return (
                              <tr key={warehouse.warehouseId} className="hover:bg-muted/40">
                                <td className="whitespace-nowrap px-2.5 py-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`h-1.5 w-1.5 rounded-full ${warehouseHealth.dot}`} />
                                    <div className="min-w-0">
                                      <div className="truncate text-[11px] font-bold">{warehouse.warehouseName}</div>
                                      <div className="font-mono text-[9px] text-muted-foreground">{warehouse.warehouseCode}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="whitespace-nowrap px-2.5 py-2 text-[11px] font-black">{quantity}</td>
                                <td className="whitespace-nowrap px-2.5 py-2 text-[11px] font-semibold text-violet-600">{warehouseReserved || '—'}</td>
                                <td className={`whitespace-nowrap px-2.5 py-2 text-[11px] font-black ${warehouseAvailable > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{warehouseAvailable}</td>
                                <td className="whitespace-nowrap px-2.5 py-2 text-[11px] font-semibold">{reorder || '—'}</td>
                                <td className="max-w-[110px] truncate px-2.5 py-2 font-mono text-[10px] text-muted-foreground">{bin || '—'}</td>
                                <td className="whitespace-nowrap px-2.5 py-2 text-[10px] text-muted-foreground">{formatDate(lastUpdate)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVITY */}
              {tab === 'activity' && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {([
                      { key: 'all', label: 'All', count: flowCounts.all },
                      { key: 'in', label: 'Stock in', count: flowCounts.in },
                      { key: 'out', label: 'Stock out', count: flowCounts.out },
                    ] as const).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setFlow(option.key)}
                        className={`flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[9px] font-extrabold uppercase tracking-wider transition-colors ${
                          flow === option.key
                            ? 'border-violet-500 bg-violet-500 text-white'
                            : 'border-slate-200 bg-white text-muted-foreground hover:border-violet-300 hover:text-violet-700 dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        {option.label}
                        <span className={`text-[9px] ${flow === option.key ? 'text-white/80' : 'text-slate-400'}`}>{option.count}</span>
                      </button>
                    ))}
                    <Button asChild variant="ghost" size="sm" className="ml-auto h-7 rounded-full px-2 text-[9px] font-extrabold text-violet-600 hover:bg-violet-500/10">
                      <Link href="/admin/inventory/movements">
                        Full ledger <ExternalLink className="ml-1 h-2.5 w-2.5" />
                      </Link>
                    </Button>
                  </div>

                  {visibleMovements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900">
                      <History className="h-6 w-6 text-slate-300" />
                      <p className="text-xs font-bold">No stock movements yet</p>
                      <p className="max-w-xs text-[10px] text-muted-foreground">
                        Every add, remove, set-exact, order and transfer for this product will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                        {visibleMovements.map((movement) => {
                          const meta = movementMeta(movement.type);
                          const positive = movement.quantity > 0;
                          return (
                            <li key={movement._id} className="flex items-start gap-2.5 px-2.5 py-2 transition-colors hover:bg-muted/40">
                              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                <meta.icon className="h-3 w-3" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] font-bold">{meta.label}</span>
                                  <Badge className={`rounded-full px-1.5 py-0 text-[9px] font-extrabold ${positive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                    {positive ? `+${movement.quantity}` : movement.quantity}
                                  </Badge>
                                  <span className="text-[9px] font-semibold text-muted-foreground">
                                    {movement.previousStock} → {movement.newStock}
                                  </span>
                                  {movement.warehouseName && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                      <WarehouseIcon className="h-2.5 w-2.5" /> {movement.warehouseName}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 truncate text-[9px] text-muted-foreground">
                                  <span className="font-mono">{movement.movementNumber}</span>
                                  {movement.reason ? ` · ${String(movement.reason).replace(/_/g, ' ')}` : ''}
                                  {movement.notes ? ` · ${movement.notes}` : ''}
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="text-[9px] font-bold">{formatDate(movement.createdAt)}</div>
                                <div className="text-[9px] text-muted-foreground">
                                  {typeof movement.createdBy === 'object' ? movement.createdBy?.name : movement.createdByName || '—'}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      {movements.length >= 60 && (
                        <div className="border-t border-slate-100 px-2.5 py-1.5 text-center text-[9px] font-medium text-muted-foreground dark:border-slate-800">
                          Showing the latest 60 movements — open the full ledger for the complete history.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground">
            {loading ? <Loader2 className="h-3 w-3 animate-spin text-violet-500" /> : <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
            {loading ? 'Refreshing live stock…' : refreshedAt ? `Live stock as of ${refreshedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : 'Live stock'}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-8 rounded-lg px-2.5 text-[10px] font-extrabold">
              <RefreshCw className={`mr-1.5 h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-extrabold">
              <Link href="/admin/inventory/stock">
                <Boxes className="mr-1.5 h-3 w-3" /> Adjust stock
              </Link>
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)} className="h-8 rounded-lg bg-violet-600 px-3 text-[10px] font-extrabold text-white hover:bg-violet-700">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
