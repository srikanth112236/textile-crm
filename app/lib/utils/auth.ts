/**
 * Auth utility functions for token management.
 *
 * Token model (do not break these invariants):
 * - localStorage.accessToken = short-lived Bearer used on every API call.
 * - Refresh happens via HttpOnly cookie (primary) or stored refreshToken (fallback).
 * - NextAuth session holds a LOGIN-TIME snapshot only — it is NEVER newer
 *   than a rotated token, so syncs must be expiry-aware (never clobber fresh).
 */

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const TOKEN_REFRESHED_EVENT = 'mentoos:token-refreshed';
export const SESSION_EXPIRED_EVENT = 'mentoos:session-expired';

function decodePayload(token: string): Record<string, any> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Expiry of a JWT in ms-since-epoch, or null if unreadable. */
export function getAccessTokenExpiry(token?: string | null): number | null {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null);
  if (!t) return null;
  const payload = decodePayload(t);
  const exp = payload?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

/** True when the token is missing or past expiry (minus clock skew). */
export function isTokenExpired(token?: string | null, skewMs = 30_000): boolean {
  const exp = getAccessTokenExpiry(token);
  if (exp === null) return true;
  return Date.now() + skewMs >= exp;
}

/** Milliseconds until the stored access token expires (0 when already dead). */
export function msUntilExpiry(token?: string | null): number {
  const exp = getAccessTokenExpiry(token);
  if (exp === null) return 0;
  return Math.max(0, exp - Date.now());
}

export function broadcastTokenRefreshed(accessToken: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: { accessToken } }));
  }
}

export function broadcastSessionExpired(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

/**
 * Shared, single-flight access-token refresh. Concurrent callers share one
 * network request. On success stores + broadcasts; on failure broadcasts
 * session-expired exactly once per call chain (callers decide UX).
 */
let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<string | null> => {
    try {
      const { default: axios } = await import('axios');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com';
      const storedRefresh = localStorage.getItem(REFRESH_KEY);
      const response = await axios.post(
        `${API_URL}/api/auth/refresh`,
        storedRefresh ? { refreshToken: storedRefresh } : {},
        { withCredentials: true, headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      const { accessToken, refreshToken: rotatedRefresh } = response.data as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!accessToken) return null;
      localStorage.setItem(ACCESS_KEY, accessToken);
      if (rotatedRefresh) localStorage.setItem(REFRESH_KEY, rotatedRefresh);
      broadcastTokenRefreshed(accessToken);
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Sync access + refresh tokens from NextAuth session to localStorage —
 * EXPIRY-AWARE. The session snapshot is frozen at login time, so it must
 * never overwrite a newer stored token (that bug silently logged users out).
 * Returns the best usable token: stored when it outlives the session one.
 */
export const syncTokenFromSession = async (opts?: { onlyIfNewer?: boolean }): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    const sessionToken = (session as any)?.accessToken as string | undefined;
    const sessionRefresh = (session as any)?.refreshToken as string | undefined;

    if (sessionRefresh) {
      localStorage.setItem(REFRESH_KEY, sessionRefresh);
    }

    const stored = localStorage.getItem(ACCESS_KEY);
    if (!sessionToken) return stored;

    if (opts?.onlyIfNewer !== false) {
      const sessionExp = getAccessTokenExpiry(sessionToken) ?? 0;
      const storedExp = stored ? getAccessTokenExpiry(stored) ?? 0 : 0;
      // Stored token is same-or-newer: keep it, return it.
      if (stored && storedExp >= sessionExp) return stored;
    }
    localStorage.setItem(ACCESS_KEY, sessionToken);
    return sessionToken;
  } catch (error) {
    // Silently fail - session might not be available
  }

  // Fallback to stored token if session doesn't have one
  return localStorage.getItem(ACCESS_KEY);
};

/**
 * Clear all auth tokens
 */
export const clearAuthTokens = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
};
