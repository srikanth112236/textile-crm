import { API_URL } from '@/lib/config';

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  get isNetwork() {
    return this.status === 0;
  }

  get isAuth() {
    return this.status === 401 || this.status === 403;
  }
}

type TokenState = { accessToken: string | null; refreshToken: string | null };

const tokens: TokenState = { accessToken: null, refreshToken: null };

let onExpired: (() => void) | null = null;
let onRefreshed: ((next: TokenState) => void) | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAuthTokens(next: Partial<TokenState>) {
  if ('accessToken' in next) tokens.accessToken = next.accessToken ?? null;
  if ('refreshToken' in next) tokens.refreshToken = next.refreshToken ?? null;
}

export function getAuthTokens(): TokenState {
  return { ...tokens };
}

export function setSessionHandlers(handlers: {
  onExpired?: () => void;
  onRefreshed?: (next: TokenState) => void;
}) {
  onExpired = handlers.onExpired ?? null;
  onRefreshed = handlers.onRefreshed ?? null;
}

function buildUrl(path: string, query?: Record<string, unknown>) {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'boolean') {
      if (value) params.append(key, 'true');
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length > 0) params.append(key, value.join(','));
      continue;
    }
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!tokens.refreshToken) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      if (!response.ok) return null;
      const payload = await response.json();
      const next = {
        accessToken: payload?.accessToken ?? null,
        refreshToken: payload?.refreshToken ?? tokens.refreshToken,
      };
      if (!next.accessToken) return null;
      setAuthTokens(next);
      onRefreshed?.(next);
      return next.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

type Primitive = string | number | boolean;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, Primitive | Primitive[] | undefined | null>;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, auth = true } = options;
  // Render free tier cold-starts in ~50s; a 30s abort made that look "offline".
  const timeoutMs = options.timeoutMs ?? (method === 'GET' ? 75000 : 45000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  options.signal?.addEventListener('abort', abortFromCaller);

  const send = (token: string | null) =>
    fetch(buildUrl(path, query), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

  let response: Response;
  try {
    response = await send(tokens.accessToken);
    if (response.status === 401 && auth && tokens.accessToken && tokens.refreshToken) {
      const fresh = await refreshAccessToken();
      if (fresh) response = await send(fresh);
      else onExpired?.();
    }
  } catch (error) {
    const aborted = (error as Error)?.name === 'AbortError';
    throw new ApiError(
      0,
      aborted
        ? 'The request timed out. Check your connection and try again.'
        : 'Can’t reach the store right now. Check your connection and try again.'
    );
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }

  const text = await response.text();
  const payload = text ? safeJson(text) : null;

  if (!response.ok) {
    const message =
      payload?.error?.message ??
      (typeof payload?.error === 'string' ? payload.error : undefined) ??
      payload?.message ??
      `Request failed (${response.status})`;
    const details = Array.isArray(payload?.details) ? payload.details : undefined;
    throw new ApiError(response.status, message, details);
  }

  return payload as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], options?: Omit<RequestOptions, 'method' | 'query'>) =>
    apiRequest<T>(path, { ...options, method: 'GET', query }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  del: <T>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
