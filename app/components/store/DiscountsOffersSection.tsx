'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, Sparkles, Copy, Check, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OfferView {
  code: string;
  title: string;
  subtitle: string;
  condition: string;
  badge: string;
  link: string;
  linkLabel: string;
  bg: string;
  border: string;
}

const FALLBACK_OFFERS: OfferView[] = [
  { code: 'MENTOOS15', title: 'FLAT 15% OFF', subtitle: 'On First Order', condition: 'Min Order: ₹999', badge: 'NEW CUSTOMER', link: '/products', linkLabel: 'Shop now', bg: 'from-amber-500/20 via-amber-500/10 to-transparent', border: 'border-amber-500/30' },
  { code: 'BUY2GET10', title: 'COMBO 10% OFF', subtitle: 'Buy Any 2 Products', condition: 'Min 2 items · max ₹500 off', badge: 'COMBO', link: '/products', linkLabel: 'Shop now', bg: 'from-rose-500/20 via-rose-500/10 to-transparent', border: 'border-rose-500/30' },
  { code: 'FESTIVE20', title: 'FLAT 20% OFF', subtitle: 'On Ethnic Wear & Kurtas', condition: 'Min Order: ₹1,999 on ethnic', badge: 'FESTIVE SPECIAL', link: '/products?category=ethnic-wear', linkLabel: 'Shop ethnic', bg: 'from-emerald-500/20 via-emerald-500/10 to-transparent', border: 'border-emerald-500/30' },
  { code: 'FREESHIP', title: 'FREE SHIPPING', subtitle: 'Express Nationwide Delivery', condition: 'No Min Amount Needed', badge: 'ALL ORDERS', link: '/products', linkLabel: 'Shop now', bg: 'from-indigo-500/20 via-indigo-500/10 to-transparent', border: 'border-indigo-500/30' },
];

const BGS = [
  { bg: 'from-amber-500/20 via-amber-500/10 to-transparent', border: 'border-amber-500/30' },
  { bg: 'from-rose-500/20 via-rose-500/10 to-transparent', border: 'border-rose-500/30' },
  { bg: 'from-emerald-500/20 via-emerald-500/10 to-transparent', border: 'border-emerald-500/30' },
  { bg: 'from-indigo-500/20 via-indigo-500/10 to-transparent', border: 'border-indigo-500/30' },
];

function toOffer(d: any, i: number): OfferView {
  const style = BGS[i % BGS.length];
  const badge = d.firstOrderOnly ? 'NEW CUSTOMER' : (d.applicableCategories || []).length > 0 ? 'CATEGORY SPECIAL' : d.minItems ? 'COMBO' : d.freeShipping ? 'ALL ORDERS' : 'LIMITED TIME';
  const title = d.freeShipping
    ? 'FREE SHIPPING'
    : d.type === 'percentage'
      ? `FLAT ${d.value}% OFF`
      : `FLAT ₹${d.value} OFF`;
  const bits: string[] = [];
  if (d.minPurchase) bits.push(`Min Order: ₹${d.minPurchase}`);
  if (d.minItems) bits.push(`Min ${d.minItems} items`);
  if (d.firstOrderOnly) bits.push('First order');
  const scoped = (d.applicableCategories || []).length > 0;
  return {
    code: d.code,
    title,
    subtitle: d.description || (scoped ? 'On selected categories' : d.freeShipping ? 'Express Nationwide Delivery' : 'On your order'),
    condition: bits.length > 0 ? bits.join(' · ') : d.freeShipping ? 'No Min Amount Needed' : 'Auto-checks at checkout',
    badge,
    link: scoped ? '/products?category=ethnic-wear' : '/products',
    linkLabel: scoped ? 'Shop the range' : 'Shop now',
    ...style,
  };
}

// Offers showcase — live coupons from the backend (admin-managed), with the
// curated 4-coupon set as fallback so the section never goes blank.
export function DiscountsOffersSection() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [offers, setOffers] = useState<OfferView[]>(FALLBACK_OFFERS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { discountsApi } = await import('@/lib/api/discounts');
        const res = await discountsApi.getDiscounts({ isActive: true } as any);
        const list = (res?.data || []).filter((d: any) => d.isActive && new Date(d.expiry) > new Date());
        if (!cancelled && list.length > 0) setOffers(list.slice(0, 4).map(toOffer));
      } catch {
        // keep curated fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCopy = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
    } catch { /* clipboard unavailable */ }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
    try {
      localStorage.setItem('mentoos_coupon', code);
    } catch { /* ignore */ }
  };

  return (
    <section className="py-6 my-4 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
            <Gift className="w-4 h-4" />
            Exclusive Savings & Coupons
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
            OFFERS & DISCOUNT SHOWCASE
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-sm mt-2 sm:mt-0">
          Copy a code or tap it to apply at cart — extra instant discounts at checkout.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.code}
            className={`bg-gradient-to-br ${offer.bg} p-4 rounded-2xl border ${offer.border} backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-amber-400 transition-all`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-white/10 text-amber-300 border-white/20 text-[10px] font-bold">
                  {offer.badge}
                </Badge>
                <Percent className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">
                {offer.title}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {offer.subtitle}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">
                {offer.condition}
              </span>
            </div>

            {/* Coupon Code Pill with Copy + Shop Actions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-white/10">
                <span className="text-xs font-black tracking-widest text-amber-400 uppercase pl-1">
                  {offer.code}
                </span>
                <button
                  onClick={() => handleCopy(offer.code)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] transition-all"
                >
                  {copiedCode === offer.code ? (
                    <>
                      <Check className="w-3 h-3" />
                      COPIED
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      COPY
                    </>
                  )}
                </button>
              </div>
              <Link
                href={offer.link}
                className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                {offer.linkLabel}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
