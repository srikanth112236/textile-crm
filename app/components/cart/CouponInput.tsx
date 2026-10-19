'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Ticket, X, Loader2 } from 'lucide-react';

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
  } catch { /* ignore */ }
}

export interface CouponPreview {
  code: string;
  discount: number;
  freeShipping: boolean;
}

// Compact coupon capture with LIVE server validation. Pass cart items so the
// shopper sees the actual discount (or a clear reason) before checkout.
// The code is still re-validated server-side at order creation.
export function CouponInput({
  items,
  onChange,
}: {
  items?: Array<{ productId: string; quantity: number }>;
  onChange?: (code: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [applied, setApplied] = useState<CouponPreview | null>(() => {
    if (typeof window === 'undefined') return null;
    const code = getCoupon();
    return code ? { code, discount: 0, freeShipping: false } : null;
  });
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    const code = draft.trim().toUpperCase();
    if (code.length < 3) return;
    setError(null);
    // No items to check against (e.g. empty cart edge): persist, server validates at order.
    if (!items || items.length === 0) {
      try {
        localStorage.setItem(COUPON_KEY, code);
      } catch { /* ignore */ }
      setApplied({ code, discount: 0, freeShipping: false });
      setDraft('');
      onChange?.(code);
      return;
    }
    setChecking(true);
    try {
      const api = (await import('@/lib/api/client')).default;
      const res = await api.post('/discounts/validate', {
        code,
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
      });
      const d = res.data.data;
      try {
        localStorage.setItem(COUPON_KEY, code);
      } catch { /* ignore */ }
      setApplied({ code, discount: d.discount || 0, freeShipping: !!d.freeShipping });
      setDraft('');
      onChange?.(code);
    } catch (e: any) {
      const msg =
        e.response?.data?.error && typeof e.response.data.error === 'string'
          ? e.response.data.error
          : 'Invalid coupon code';
      setError(msg);
    } finally {
      setChecking(false);
    }
  };

  const remove = () => {
    clearCoupon();
    setApplied(null);
    setError(null);
    onChange?.('');
  };

  if (applied) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2">
          <span className="text-xs font-bold flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-mono tracking-wide">{applied.code}</span>
            {applied.discount > 0 ? (
              <span className="text-emerald-600 font-extrabold">−₹{applied.discount}</span>
            ) : applied.freeShipping ? (
              <span className="text-emerald-600 font-extrabold">FREE shipping</span>
            ) : (
              <span className="text-muted-foreground font-medium">applied at checkout</span>
            )}
          </span>
          <button onClick={remove} className="text-muted-foreground hover:text-destructive" aria-label="Remove coupon">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => { setDraft(e.target.value.toUpperCase()); setError(null); }}
          placeholder="Coupon code (e.g. MENTOOS15)"
          className="h-9 text-xs font-mono uppercase"
          maxLength={24}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
        />
        <Button size="sm" variant="outline" className="h-9 shrink-0" disabled={draft.trim().length < 3 || checking} onClick={apply}>
          {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && <p className="text-[11px] font-semibold text-rose-500">{error}</p>}
    </div>
  );
}
