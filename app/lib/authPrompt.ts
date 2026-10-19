/**
 * Homepage-based auth prompt URL builder.
 *
 * The product rule: unauthenticated visitors are never force-redirected to
 * /login. Protected pages and expired sessions land on the storefront `/`
 * with `?authRequired=1` (plus optional ?expired=1 and ?callbackUrl=…), and
 * <AuthPromptListener /> shows the login / register modal on top of the
 * normal homepage content. The dedicated /login page stays reachable from
 * the header for anyone who prefers it.
 */
export const AUTH_REQUIRED_PARAM = 'authRequired';

/** Broadcast that a real session ended while the visitor is on the homepage. */
export const AUTH_EXPIRED_EVENT = 'auth:expired';

/**
 * Open the "Session Expired" prompt without touching the URL.
 * Used when the visitor is already on `/` — navigating to
 * `/?expired=1&authRequired=1` would only pollute the address bar.
 */
export function showExpiredPromptInPlace() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

export function authPromptUrl(callbackUrl?: string | null, opts?: { expired?: boolean }) {
  const params = new URLSearchParams({ authRequired: '1' });
  if (callbackUrl) params.set('callbackUrl', callbackUrl);
  if (opts?.expired) params.set('expired', '1');
  return `/?${params.toString()}`;
}
