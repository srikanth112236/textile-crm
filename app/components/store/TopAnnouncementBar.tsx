'use client';

import { useEffect, useMemo, useState } from 'react';
import { Truck, ShieldCheck, Sparkles, Zap, Gift, Percent, Star, RotateCcw, Package, Tag } from 'lucide-react';

/** Curated fallback list — the marquee always shows at least 10 messages. */
const DEFAULT_MESSAGES = [
  '🔥 FLAT 15% OFF ON YOUR FIRST ORDER | USE CODE: MENTOOS15',
  '🚚 FREE EXPRESS SHIPPING ON ALL ORDERS OVER ₹999',
  '💵 CASH ON DELIVERY AVAILABLE | EASY 7-DAY EXCHANGES',
  '⚡ NEW ARRIVALS 2026 NOW LIVE — SHOP OVERSIZED TEES & KURTAS',
  '🎉 FESTIVE DROP: FLAT 20% OFF ETHNIC WEAR | CODE: FESTIVE20',
  '🛍️ BUY ANY 2 PRODUCTS & SAVE 10% EXTRA | CODE: BUY2GET10',
  '🏷️ FLAT ₹200 OFF ON ORDERS ABOVE ₹1,499 | CODE: FLAT200',
  '⭐ 4.8/5 RATED BY 10,000+ HAPPY CUSTOMERS',
  '🔁 EASY 7-DAY RETURNS & EXCHANGES — NO QUESTIONS ASKED',
  '📦 SAME-DAY DISPATCH ON ALL ORDERS PLACED BEFORE 2 PM',
];

const MIN_MESSAGES = 10;

const ICONS = [Sparkles, Truck, ShieldCheck, Zap, Gift, Percent, Star, RotateCcw, Package, Tag];

interface MarqueeItem {
  text: string;
  Icon: (typeof ICONS)[number];
}

/** Merge admin messages with defaults so the marquee never runs short. */
function buildMessages(adminMessages: string[]): string[] {
  const clean = (list: (string | undefined | null)[]) =>
    list
      .map((m) => (m || '').trim())
      .filter((m) => m.length > 0);

  const merged = clean(adminMessages || []);

  // Dedupe (case-insensitive) while preserving admin order.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const msg of merged) {
    const key = msg.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(msg);
  }

  // Pad from the curated defaults until we hit the 10-message floor.
  for (const fallback of DEFAULT_MESSAGES) {
    if (unique.length >= MIN_MESSAGES) break;
    const key = fallback.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(fallback);
  }

  return unique;
}

function MarqueeGroup({ items, hidden }: { items: MarqueeItem[]; hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => {
        const Icon = item.Icon;
        return (
          <span key={`${item.text}-${i}`} className="flex items-center">
            <Icon className="mx-2 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
            <span className="whitespace-nowrap tracking-wider uppercase text-[11px] sm:text-xs">
              {item.text}
            </span>
            <span className="mx-8 text-amber-500/50 select-none" aria-hidden="true">
              •
            </span>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Store-wide announcement strip.
 *
 * Messages come from Admin → Settings → Storefront → Announcement messages
 * (falls back to a curated set, padded to at least 10). Rendered as a seamless
 * CSS marquee: the list is duplicated and the track slides exactly -50%, so the
 * loop never jumps. Pauses on hover; static row for prefers-reduced-motion.
 */
export function TopAnnouncementBar() {
  const [adminMessages, setAdminMessages] = useState<string[]>([]);

  useEffect(() => {
    import('@/lib/api/settings')
      .then((m) =>
        m.settingsApi
          .getPublic()
          .then((s) => {
            const list = Array.isArray(s.storefront?.announcements) ? s.storefront!.announcements! : [];
            if (list.length > 0) setAdminMessages(list);
          })
          .catch(() => {})
      )
      .catch(() => {});
  }, []);

  const items = useMemo<MarqueeItem[]>(() => {
    const texts = buildMessages(adminMessages);
    return texts.map((text, i) => ({ text, Icon: ICONS[i % ICONS.length] }));
  }, [adminMessages]);

  // Duplicate short lists so a single group is always wider than the viewport.
  const perGroup = items.length >= 8 ? items : [...items, ...items];
  // Constant-ish reading speed: more messages → longer loop.
  const duration = Math.min(90, Math.max(30, Math.round(perGroup.length * 5.5)));

  return (
    <div
      role="region"
      aria-label="Store announcements"
      data-testid="announcement-marquee"
      data-message-count={items.length}
      className="group relative overflow-hidden border-b border-amber-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 py-2 text-amber-400 select-none"
    >
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-slate-950 to-transparent" />

      <div
        data-testid="announcement-track"
        style={{ animationDuration: `${duration}s`, willChange: 'transform' }}
        className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]"
      >
        <MarqueeGroup items={perGroup} />
        <MarqueeGroup items={perGroup} hidden />
      </div>
    </div>
  );
}
