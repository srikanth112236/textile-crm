'use client';

import { useEffect, useRef } from 'react';
import {
  TOKEN_REFRESHED_EVENT,
  SESSION_EXPIRED_EVENT,
  msUntilExpiry,
  isTokenExpired,
  refreshAccessToken,
} from '@/lib/utils/auth';import { signOut, getSession } from 'next-auth/react';

const REFRESH_AT_FRACTION = 0.8;
const MIN_REFRESH_IN_MS = 60_000;
/**
 * AuthSessionManager — mounted once inside <Providers>.
 * - Proactively refreshes the access token at 80% of its life so API calls
 *   (and Razorpay verify-after-payment) never hit a 401 in the first place.
 * - Re-checks on tab focus/visibility (covers sleep + long payment popups).
 * - On session-expired broadcast: signs out of NextAuth too (kills the
 *   split-brain "avatar says logged in but API is dead") and sends the user
 *   to login with a callback so they land back where they were.
 */
export function AuthSessionManager() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const clear = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };

    const schedule = () => {
      clear();
      const msLeft = msUntilExpiry();
      // No token (logged out) or unreadable: nothing to schedule.
      if (msLeft <= 0) return;
      // Fire at 80% of remaining life; if that is sooner than a minute,
      // refresh on the next tick instead of letting it die.
      const delay = Math.max(MIN_REFRESH_IN_MS, msLeft * REFRESH_AT_FRACTION);
      timer.current = setTimeout(async () => {
        const token = localStorage.getItem('accessToken');
        if (token && isTokenExpired(token)) {
          await refreshAccessToken();
        }
        schedule();
      }, delay);
    };

    const onRefreshed = () => schedule();
    const onExpired = async () => {
      clear();
      try {
        await signOut({ redirect: false });
      } catch { /* already out */ }
      // Storefront + login prompt: AuthPromptListener on `/` shows a
      // "Session Expired" modal (never a hard /login bounce).
      const back = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/?expired=1&authRequired=1&callbackUrl=${encodeURIComponent(back)}`;
    };

    const onFocus = async () => {
      try {
        const stored = localStorage.getItem('accessToken');
        if (stored && isTokenExpired(stored)) {
          await refreshAccessToken();
          schedule();
        } else {
          // NextAuth session may have gone away in another tab.
          const session = await getSession();
          if (!session) onExpired();
        }
      } catch { /* ignore */ }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void onFocus();
    };

    schedule();
    window.addEventListener(TOKEN_REFRESHED_EVENT, onRefreshed);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clear();
      window.removeEventListener(TOKEN_REFRESHED_EVENT, onRefreshed);
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
