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

export function authPromptUrl(callbackUrl?: string | null, opts?: { expired?: boolean }) {
  const params = new URLSearchParams({ authRequired: '1' });
  if (callbackUrl) params.set('callbackUrl', callbackUrl);
  if (opts?.expired) params.set('expired', '1');
  return `/?${params.toString()}`;
}
