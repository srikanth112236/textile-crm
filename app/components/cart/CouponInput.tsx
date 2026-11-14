'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Ticket,
  X,
  Loader2,
  Check,
  ChevronDown,
  Sparkles,
  Truck,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Discount } from '@/lib/api/discounts';

export const COUPON_KEY = 'mentoos_coupon';

export function getCoupon(): string {
  try {
    return localStorage.getItem(COUPON_KEY) || '';
  } catch {
    return '';
  }
}

export function clearCoupon() {
  try {
    localStorage.removeItem(COUPON_KEY);
  } catch {
    /* ignore */
  }
}

export interface CouponPreview {
  code: string;
  discount: number;
  freeShipping: boolean;
}

interface CouponInputProps {
  items?: Array<{ productId: string; quantity: number }>;
  onChange?: (code: string) => void;
  /** Merchandise subtotal — used to show which offers are unlocked right now. */
  subtotal?: number;
}

const formatINR = (n: number) =>
  `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Headline on the coupon card: what the shopper gets. */
function saveLabel(d: Discount): string {
  if (d.freeShipping) return 'FREE SHIPPING';
  if (d.type === 'percentage') return `${d.value}% OFF`;
  return `${formatINR(d.value)} OFF`;
}

/** Secondary line: what unlocks the coupon. */
function conditionLabel(d: Discount): string {
  const bits: string[] = [];
  if (d.minPurchase) bits.push(`Min ${formatINR(d.minPurchase)}`);
  if (d.minItems) bits.push(`${d.minItems}+ items`);
  if (d.firstOrderOnly) bits.push('First order');
  if ((d.applicableCategories || []).length > 0) bits.push('Selected styles');
  if (d.maxDiscount) bits.push(`Up to ${formatINR(d.maxDiscount)}`);
  return bits.length > 0 ? bits.join(' · ') : 'No minimum order';
}

function estimatedSaving(d: Discount, subtotal: number): number {
  if (d.freeShipping || subtotal <= 0) return 0;
  if (d.type === 'percentage') {
    const raw = (subtotal * d.value) / 100;
    return d.maxDiscount ? Math.min(raw, d.maxDiscount) : raw;
  }
  return Math.min(d.value, subtotal);
}

/**
 * Coupon capture + "available offers" rail.
 *
 * Codes are never advertised on the public storefront: they surface here, at
 * cart/checkout, where the basket is known — so each card can be marked
 * eligible / locked and applied in a single click. Rates are still
 * re-validated server-side at order creation.
 */
export function CouponInput({ items, onChange, subtotal }: CouponInputProps) {
  const [draft, setDraft] = useState('');
  const [applied, setApplied] = useState<CouponPreview | null>(() => {
    if (typeof window === 'undefined') return null;
    const code = getCoupon();
    return code ? { code, discount: 0, freeShipping: false } : null;
  });
  const [checking, setChecking] = useState(false);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Discount[]>([]);
  const [offersOpen, setOffersOpen] = useState(true);

  const itemCount = useMemo(
    () => (items || []).reduce((sum, it) => sum + (it.quantity || 0), 0),
    [items]
  );
  const hasBasket = Boolean(items && items.length > 0);
  const knownSubtotal = typeof subtotal === 'number' && subtotal > 0 ? subtotal : 0;
  const canEvaluate = hasBasket && knownSubtotal > 0;

  // Load every live coupon (backend already filters inactive/expired).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { discountsApi } = await import('@/lib/api/discounts');
        const res = await discountsApi.getDiscounts();
        if (cancelled) return;
        const list = (res?.data || []).filter(
          (d: Discount) => d.isActive && new Date(d.expiry) > new Date()
        );
        setOffers(list);
      } catch {
        /* offers are optional — manual entry still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyCode = async (raw?: string) => {
    const code = String(raw ?? draft).trim().toUpperCase();
    if (code.length < 3) return;
    const fromOffer = raw !== undefined;
    if (fromOffer) setApplyingCode(code);
    else setChecking(true);
    setError(null);
    try {
      // No basket (e.g. empty-cart edge) → persist and let the server score it.
      if (!hasBasket) {
        try {
          localStorage.setItem(COUPON_KEY, code);
        } catch {
          /* ignore */
        }
        setApplied({ code, discount: 0, freeShipping: false });
        setDraft('');
        onChange?.(code);
        return;
      }
      const api = (await import('@/lib/api/client')).default;
      const res = await api.post('/discounts/validate', {
        code,
        items: (items || []).map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      });
      const d = res.data.data;
      try {
        localStorage.setItem(COUPON_KEY, code);
      } catch {
        /* ignore */
      }
      setApplied({
        code,
        discount: Number(d.discount) || 0,
        freeShipping: Boolean(d.freeShipping),
      });
      setDraft('');
      onChange?.(code);
    } catch (e: any) {
      setError(
        e.response?.data?.error && typeof e.response.data.error === 'string'
          ? e.response.data.error
          : 'Invalid coupon code'
      );
    } finally {
      setChecking(false);
      setApplyingCode(null);
    }
  };

  const remove = () => {
    clearCoupon();
    setApplied(null);
    setError(null);
    onChange?.('');
  };

  // Eligible first, then biggest estimated saving — the "best offer" is on top.
  const sortedOffers = useMemo(() => {
    const scored = offers.map((d) => {
      const locked =
        Boolean(d.usageLimit && d.usedCount >= d.usageLimit) ||
        (canEvaluate && Boolean(d.minItems) && itemCount < (d.minItems || 0)) ||
        (canEvaluate && Boolean(d.minPurchase) && knownSubtotal < (d.minPurchase || 0));
      return { d, locked, saving: estimatedSaving(d, knownSubtotal) };
    });
    return scored.sort((a, b) => {
      if (a.locked !== b.locked) return a.locked ? 1 : -1;
      return b.saving - a.saving;
    });
  }, [offers, canEvaluate, itemCount, knownSubtotal]);

  const eligibleCount = sortedOffers.filter((o) => !o.locked).length;

  return (
    <div className="space-y-2">
      {/* Applied coupon */}
      {applied ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-bold">
            <Ticket className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-mono tracking-wide">{applied.code}</span>
            {applied.discount > 0 ? (
              <span className="font-extrabold text-emerald-600">−{formatINR(applied.discount)}</span>
            ) : applied.freeShipping ? (
              <span className="font-extrabold text-emerald-600">FREE shipping</span>
            ) : (
              <span className="font-medium text-muted-foreground">applied at checkout</span>
            )}
          </span>
          <button
            onClick={remove}
            className="text-muted-foreground transition-colors hover:text-destructive"
            aria-label="Remove coupon"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="Coupon code (e.g. MENTOOS15)"
            className="h-9 text-xs font-mono uppercase"
            maxLength={24}
            aria-label="Coupon code"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyCode();
              }
            }}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-9 shrink-0"
            disabled={draft.trim().length < 3 || checking}
            onClick={() => applyCode()}
          >
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
          </Button>
        </div>
      )}

      {error && <p className="text-[11px] font-semibold text-rose-500">{error}</p>}

      {/* Available offers */}
      {sortedOffers.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={() => setOffersOpen((v) => !v)}
            aria-expanded={offersOpen}
            aria-controls="available-coupons"
            data-testid="available-coupons-toggle"
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
          >
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Available coupons
              <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {eligibleCount} usable
              </span>
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                offersOpen && 'rotate-180'
              )}
            />
          </button>

          {offersOpen && (
            <div
              id="available-coupons"
              data-testid="available-coupons"
              className="max-h-64 space-y-1.5 overflow-y-auto px-2 pb-2 pr-1.5 scrollbar-thin"
            >
              {sortedOffers.map(({ d, locked, saving }) => {
                const isApplied = applied?.code === d.code;
                return (
                  <div
                    key={d.code}
                    data-testid={`coupon-card-${d.code}`}
                    data-locked={locked ? 'true' : 'false'}
                    className={cn(
                      'relative flex items-stretch overflow-hidden rounded-lg border transition-colors',
                      isApplied
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : locked
                          ? 'border-slate-200 bg-white/40 opacity-70 dark:border-slate-800 dark:bg-slate-950/30'
                          : 'border-amber-500/40 bg-white hover:border-amber-500 dark:bg-slate-950/40'
                    )}
                  >
                    {/* Ticket stub */}
                    <div
                      className={cn(
                        'flex w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-dashed px-1 py-2 text-center',
                        locked
                          ? 'border-slate-300/70 text-slate-400 dark:border-slate-700'
                          : 'border-amber-500/40 text-amber-700 dark:text-amber-300'
                      )}
                    >
                      {d.freeShipping ? (
                        <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span className="text-[9px] font-black uppercase leading-tight">
                        {d.freeShipping ? 'Ship' : d.type === 'percentage' ? `${d.value}%` : '₹'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 px-2 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono text-[11px] font-black tracking-widest">
                          {d.code}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 text-[10px] font-black uppercase',
                            locked ? 'text-slate-400' : 'text-amber-700 dark:text-amber-300'
                          )}
                        >
                          {saveLabel(d)}
                        </span>
                      </div>
                      <p className="truncate text-[10px] leading-tight text-muted-foreground">
                        {d.description || conditionLabel(d)}
                      </p>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] text-muted-foreground">
                          {locked
                            ? d.usageLimit && d.usedCount >= d.usageLimit
                              ? 'Fully redeemed'
                              : d.minItems && canEvaluate && itemCount < d.minItems
                                ? `Add ${d.minItems - itemCount} more item(s)`
                                : `Add ${formatINR((d.minPurchase || 0) - knownSubtotal)} more`
                            : saving > 0
                              ? `You save ${formatINR(saving)}`
                              : conditionLabel(d)}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant={isApplied ? 'secondary' : 'outline'}
                          disabled={locked || isApplied || applyingCode !== null}
                          onClick={() => applyCode(d.code)}
                          aria-label={`Apply coupon ${d.code}`}
                          data-testid={`coupon-apply-${d.code}`}
                          className={cn(
                            'h-6 shrink-0 rounded-md px-2 text-[10px] font-black uppercase',
                            !locked && !isApplied && 'border-amber-500/60 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300'
                          )}
                        >
                          {applyingCode === d.code ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isApplied ? (
                            <span className="flex items-center gap-0.5">
                              <Check className="h-3 w-3" /> On
                            </span>
                          ) : locked ? (
                            'Locked'
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
