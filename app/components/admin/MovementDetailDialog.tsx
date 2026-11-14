'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { ArrowUp, ArrowDown, ArrowUpDown, Clock, User, Warehouse, Package, Layers, TrendingDown, TrendingUp, Info } from 'lucide-react';
import type { StockMovement } from '@/lib/api/inventory';

const META_MAP: Record<string, { label: string; tone: string; icon: any; desc: string }> = {
  stock_in: { label: 'Stock In', tone: 'bg-emerald-500 text-white', icon: ArrowUp, desc: 'New units added to warehouse inventory.' },
  stock_out: { label: 'Stock Out', tone: 'bg-rose-500 text-white', icon: ArrowDown, desc: 'Units removed — orders, damage, or loss.' },
  transfer: { label: 'Transfer', tone: 'bg-amber-500 text-slate-950', icon: ArrowUpDown, desc: 'Stock moved between warehouses.' },
  order: { label: 'Order', tone: 'bg-violet-500 text-white', icon: Package, desc: 'Stock reserved or deducted for a customer order.' },
  order_cancelled: { label: 'Order Cancelled', tone: 'bg-slate-400 text-white', icon: TrendingDown, desc: 'Order cancelled — stock returned to available.' },
  order_refund: { label: 'Refund', tone: 'bg-rose-400 text-white', icon: TrendingDown, desc: 'Refund processed — stock added back.' },
  adjustment: { label: 'Adjustment', tone: 'bg-amber-500 text-slate-950', icon: Layers, desc: 'Manual correction to inventory count.' },
  damage: { label: 'Damage', tone: 'bg-rose-500 text-white', icon: ArrowDown, desc: 'Damaged goods removed from stock.' },
  return: { label: 'Return', tone: 'bg-emerald-500 text-white', icon: ArrowUp, desc: 'Returned item added back to inventory.' },
  recount: { label: 'Recount', tone: 'bg-violet-500 text-white', icon: Clock, desc: 'Physical recount — on-hand overwritten.' },
};

export function MovementDetailDialog({
  open,
  onOpenChange,
  movement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: StockMovement | null;
}) {
  if (!movement) return null;
  const meta = META_MAP[movement.type] || META_MAP['adjustment'];
  const prodName = (typeof movement.productId === 'object' ? movement.productId?.name : movement.productName) || 'Unknown product';
  const prodSku = (typeof movement.productId === 'object' ? movement.productId?.sku : '') || (movement.variantSku || '');
  const created = new Date(movement.createdAt);
  const createdStr = created.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
  const positive = movement.quantity > 0;
  const previousStock = movement.previousStock ?? 0;
  const newStock = movement.newStock ?? 0;
  const change = movement.quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-xl rounded-2xl gap-0 overflow-hidden p-0 sm:w-full">
        {/* Header */}
        <div className={`${meta.tone} px-4 py-3 flex items-start gap-2.5 border-b border-white/10`}>
          <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <meta.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-base font-extrabold leading-tight tracking-tight text-white">{meta.label}</DialogTitle>
            <DialogDescription className="text-[10px] text-white/80 mt-0.5 truncate">{movement.movementNumber}</DialogDescription>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 bg-white dark:bg-slate-900">
          {/* Product + Warehouse */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="h-3 w-3 text-violet-500" />
                <span className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Product</span>
              </div>
              <p className="text-[11px] font-extrabold truncate">{prodName}</p>
              <p className="text-[9px] font-mono text-muted-foreground truncate">SKU: {prodSku || '—'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Warehouse className="h-3 w-3 text-amber-500" />
                <span className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Warehouse</span>
              </div>
              <p className="text-[11px] font-extrabold truncate">{movement.warehouseName || '—'}</p>
              <p className="text-[9px] font-mono text-muted-foreground truncate">{movement.warehouseCode || '—'}</p>
            </div>
          </div>

          {/* Numbers grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-center">
              <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Previous</p>
              <p className="text-xl font-black mt-0.5">{previousStock}</p>
            </div>
            <div className={`rounded-xl border p-2 text-center ${positive ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20'}`}>
              <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">Change</p>
              <p className={`text-xl font-black mt-0.5 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>{positive ? '+' : ''}{change}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2 text-center">
              <p className="text-[8px] uppercase tracking-widest font-extrabold text-muted-foreground">New total</p>
              <p className="text-xl font-black mt-0.5">{newStock}</p>
            </div>
          </div>

          {/* Details list */}
          <dl className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
            {[
              ['Movement #', movement.movementNumber],
              ['Type', meta.label],
              ['Reason', movement.reason ? String(movement.reason).replace(/_/g, ' ') : '—'],
              ['Notes', movement.notes || '—'],
              ['Created by', typeof movement.createdBy === 'object' ? movement.createdBy?.name : movement.createdByName || '—'],
              ['Created at', createdStr],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex items-start justify-between gap-3 px-2.5 py-1.5">
                <dt className="text-muted-foreground shrink-0">{k}</dt>
                <dd className="font-bold text-right break-words min-w-0">{v}</dd>
              </div>
            ))}
          </dl>

          {/* Explanation */}
          <div className="rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/20 px-2.5 py-2 flex items-start gap-2">
            <Info className="h-3 w-3 text-violet-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-violet-800 dark:text-violet-300 font-medium leading-snug">
              <span className="font-extrabold">{meta.desc}</span> Every movement writes an audited record so the change is fully traceable.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
