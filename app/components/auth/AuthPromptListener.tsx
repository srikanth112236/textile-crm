'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoginModal } from '@/components/auth/LoginModal';
import { AUTH_EXPIRED_EVENT } from '@/lib/authPrompt';
import type { AuthAction } from '@/lib/analytics/events';

function inferAction(callbackUrl?: string | null): AuthAction {
  if (!callbackUrl) return 'generic';
  if (callbackUrl.startsWith('/checkout')) return 'checkout';
  if (callbackUrl.startsWith('/cart')) return 'cart';
  if (callbackUrl.startsWith('/user/wishlist')) return 'wishlist';
  return 'generic';
}

/**
 * Storefront auth prompt.
 *
 * Protected routes land on `/?authRequired=1&callbackUrl=…` instead of a hard
 * /login bounce. This listener opens one contextual modal, cleans the URL and
 * returns the shopper to the callback page after sign-in. It never redirects
 * to a dashboard on its own.
 */
export function AuthPromptListener() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [action, setAction] = useState<AuthAction>('generic');
  const handledRef = useRef(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    const onExpired = () => {
      if (dismissedRef.current) return;
      const back =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : null;
      setExpired(true);
      setCallbackUrl(back && back !== '/' ? back : null);
      setAction(inferAction(back));
      setOpen(true);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    const authRequired = searchParams.get('authRequired') === '1';
    const isExpired = searchParams.get('expired') === '1';
    if (!authRequired && !isExpired) {
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;

    let target = searchParams.get('callbackUrl');
    if (!target) {
      try {
        target = sessionStorage.getItem('authCallbackUrl');
      } catch {
        target = null;
      }
    }

    setExpired(isExpired);
    setCallbackUrl(target);
    setAction(inferAction(target));
    setOpen(true);

    // Strip prompt params so refresh/back does not replay the modal.
    const clean = new URLSearchParams(searchParams.toString());
    clean.delete('authRequired');
    clean.delete('expired');
    clean.delete('callbackUrl');
    const qs = clean.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [searchParams, router]);

  if (!open) return null;

  return (
    <LoginModal
      open={open}
      onOpenChange={(next) => {
        if (!next) dismissedRef.current = true;
        setOpen(next);
      }}
      action={action}
      callbackUrl={callbackUrl ?? undefined}
      source="listener"
      title={expired ? 'Session expired' : undefined}
      description={
        expired
          ? 'Your session ended for security. Sign in again and we will take you back to where you left off.'
          : undefined
      }
    />
  );
}
