'use client';

import { useEffect, useRef } from 'react';
import {
  TOKEN_REFRESHED_EVENT,
  SESSION_EXPIRED_EVENT,
  msUntilExpiry,
  isTokenExpired,
  refreshAccessToken,
} from '@/lib/utils/auth';
import { signOut, getSession } from 'next-auth/react';
import { showExpiredPromptInPlace } from '@/lib/authPrompt';

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
  /**
   * Was this visitor actually signed in? Guests have no token and no
   * NextAuth session, which must NOT be mistaken for an expired session —
   * otherwise every focus/visibility change bounces a guest to
   * /?expired=1&authRequired=1&callbackUrl=… and pollutes the URL.
   */
  const wasAuthed = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Seed the flag from an existing token or live NextAuth session.
    let cancelled = false;
    (async () => {
      try {
        if (localStorage.getItem('accessToken')) {
          wasAuthed.current = true;
          return;
        }
        const session = await getSession();
        if (!cancelled && session) wasAuthed.current = true;
      } catch { /* ignore */ }
    })();

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
      // A guest was never signed in — nothing expired.
      if (!wasAuthed.current) return;
      wasAuthed.current = false;
      clear();
      try {
        await signOut({ redirect: false });
      } catch { /* already out */ }
      // Storefront + login prompt: show the "Session Expired" modal on top
      // of the homepage. Only navigate when we're on another page; on `/`
      // itself the modal opens in place, keeping the address bar clean.
      if (window.location.pathname === '/') {
        showExpiredPromptInPlace();
        return;
      }
      const back = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/?expired=1&authRequired=1&callbackUrl=${encodeURIComponent(back)}`;
    };

    const onFocus = async () => {
      try {
        const stored = localStorage.getItem('accessToken');
        if (stored) {
          wasAuthed.current = true;
          if (isTokenExpired(stored)) {
            await refreshAccessToken();
            schedule();
          }
          return;
        }
        // No token and never authenticated in this tab: this is a guest,
        // not an expired session. Leave the page and URL untouched.
        if (!wasAuthed.current) return;
        // NextAuth session may have gone away in another tab.
        const session = await getSession();
        if (session) {
          wasAuthed.current = true;
          return;
        }
        void onExpired();
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
      cancelled = true;
      clear();
      window.removeEventListener(TOKEN_REFRESHED_EVENT, onRefreshed);
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
