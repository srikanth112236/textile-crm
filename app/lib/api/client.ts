import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://textile-crm-backend.onrender.com';

export interface ApiError {
  error: {
    message: string;
    stack?: string;
  };
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
  timeout: 30000, // order placement does sequential writes; fail-fast 12s caused phantom duplicates
});

// In-memory token cache: avoids re-reading localStorage churn and lets the
// 401 path know which token just failed (never retry with the same one).
let cachedToken: string | null | undefined;

// Request interceptor to add auth token (fast path: no network call)
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      let token: string | null = null;
      try {
        token = localStorage.getItem('accessToken');
      } catch { /* ignore */ }
      if (token) {
        cachedToken = token;
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      }
      // No stored token: attach cached one if fresh, else let request go
      // unauthenticated (server returns 401 fast) instead of blocking on getSession().
      if (cachedToken) {
        config.headers.Authorization = `Bearer ${cachedToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as any;

    // Handle connection refused (backend not running)
    if (error.code === 'ECONNREFUSED' || error.message.includes('ERR_CONNECTION_REFUSED')) {
      const errorMessage = 'Backend server is not running. Please start the server with: cd server && npm run dev';
      console.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }

    // Handle 429 (rate limited) — show a friendly countdown banner (plain
    // English, no tech jargon) instead of the raw server error.
    if (error.response?.status === 429 && !originalRequest._retry429) {
      originalRequest._retry429 = true;
      const bodySecs = Number((error.response?.data as any)?.retryAfterSeconds);
      const headerSecs = Number(
        error.response?.headers?.['ratelimit-reset'] ?? error.response?.headers?.['retry-after']
      );
      const secs = Number.isFinite(bodySecs) && bodySecs > 0 ? Math.ceil(bodySecs)
        : Number.isFinite(headerSecs) && headerSecs > 0 ? Math.min(60, Math.ceil(headerSecs))
        : 30;
      if (typeof window !== 'undefined') {
        import('@/components/notifications/RateLimitNotice')
          .then((m) => m.notifyRateLimited(secs))
          .catch(() => {});
      }
      // Flagged so callers can skip console.error / error toasts for 429s —
      // the countdown banner already informs the shopper.
      const friendly = new Error(`Please wait ${secs} seconds and try again.`) as any;
      friendly.isRateLimited = true;
      friendly.retryAfterSeconds = secs;
      friendly.status = 429;
      return Promise.reject(friendly);
    }

    // Handle 401 (Unauthorized) — refresh FIRST, session-sync only as fallback.
    // Order matters: the NextAuth session holds a login-time snapshot that is
    // usually STALE, so syncing before refreshing poisoned the retry with an
    // expired token and logged users out mid-checkout. Single-flight refresh
    // is shared via utils/auth so parallel 401s make one network call.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const failedToken =
        typeof window !== 'undefined'
          ? String(originalRequest.headers?.Authorization || '').replace(/^Bearer\s+/i, '') || null
          : null;

      // 1) Refresh (cookie primary, stored copy fallback) — shared single-flight.
      try {
        const { refreshAccessToken } = await import('../utils/auth');
        const fresh = await refreshAccessToken();
        if (fresh && fresh !== failedToken) {
          cachedToken = fresh;
          originalRequest.headers.Authorization = `Bearer ${fresh}`;
          return apiClient(originalRequest);
        }
      } catch (e) {
        console.warn('Token refresh attempt failed:', e);
      }

      // 2) Fallback: expiry-aware session sync — only retry when it yields a
      // DIFFERENT, non-expired token (never the same dead one).
      try {
        const { syncTokenFromSession, isTokenExpired } = await import('../utils/auth');
        const synced = await syncTokenFromSession({ onlyIfNewer: true });
        if (synced && synced !== failedToken && !isTokenExpired(synced)) {
          cachedToken = synced;
          originalRequest.headers.Authorization = `Bearer ${synced}`;
          return apiClient(originalRequest);
        }
      } catch (syncError) {
        console.warn('Could not sync token from session:', syncError);
      }

      // 3) Truly logged out: clear local tokens, tell the app once, and reject
      // with the ORIGINAL 401 (not the refresh error) so callers show the
      // right message and the resume-after-login flow can trigger.
      if (typeof window !== 'undefined') {
        try {
          const { clearAuthTokens, broadcastSessionExpired } = await import('../utils/auth');
          clearAuthTokens();
          cachedToken = null;
          broadcastSessionExpired();
        } catch { /* non-fatal */ }
      }
      return Promise.reject(error);
    }

    // Transient backend restart (nodemon reload / deploy): retry idempotent
    // GETs once after a short wait instead of surfacing Network Error.
    if (!error.response && !originalRequest._retryNetwork) {
      const method = (originalRequest.method || 'get').toLowerCase();
      if (method === 'get') {
        originalRequest._retryNetwork = true;
        await new Promise((r) => setTimeout(r, 1200));
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

