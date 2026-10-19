'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Hourglass } from 'lucide-react';

export const RATE_LIMITED_EVENT = 'mentoos:rate-limited';

export function notifyRateLimited(retryAfterSeconds: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(RATE_LIMITED_EVENT, { detail: { retryAfterSeconds } })
  );
}

/**
 * Friendly "slow down" banner. Plain English, live countdown, auto-dismisses
 * when the limit resets — no technical jargon shown to shoppers.
 */
export default function RateLimitNotice() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const onLimited = (e: Event) => {
      const secs = Math.max(1, Math.min(60, Number((e as CustomEvent).detail?.retryAfterSeconds) || 30));
      setSecondsLeft(secs);
    };
    window.addEventListener(RATE_LIMITED_EVENT, onLimited);
    return () => window.removeEventListener(RATE_LIMITED_EVENT, onLimited);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  if (secondsLeft <= 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] w-[340px] max-w-[calc(100vw-24px)]" role="status" aria-live="polite">
      <Card className="border-amber-500/50 bg-white dark:bg-slate-900 shadow-xl">
        <CardContent className="p-3 flex items-start gap-2.5">
          <Hourglass className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-[13px] leading-tight">Just a moment!</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              You tapped a little too fast. Please try again in{' '}
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {secondsLeft} second{secondsLeft === 1 ? '' : 's'}
              </span>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
