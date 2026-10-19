'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoginModal } from '@/components/auth/LoginModal';
import { AUTH_EXPIRED_EVENT } from '@/lib/authPrompt';

/**
 * Homepage-based auth prompt.
 *
 * Redirects land on `/?authRequired=1` (&expired=1&callbackUrl=…) instead of
 * forcing /login: the visitor keeps browsing the storefront; this listener
 * flashes the "Login Required" modal on top, then cleans the URL so a
 * refresh doesn't replay the prompt.
 */
export function AuthPromptListener() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [wasExpired, setWasExpired] = useState(false);
  const handledRef = useRef(false);
  /** Once dismissed, stay dismissed for this page session — never re-pop. */
  const dismissedRef = useRef(false);

  // The visitor was already on `/` when a real session expired: open the
  // modal in place instead of rewriting the URL with prompt params.
  useEffect(() => {
    const onExpired = () => {
      if (dismissedRef.current) return;
      setWasExpired(true);
      setOpen(true);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    const authRequired = searchParams.get('authRequired') === '1';
    const expired = searchParams.get('expired') === '1';
    if (!authRequired && !expired) {
      // Params gone: allow a future redirect to prompt again.
      handledRef.current = false;
      return;
    }
    if (handledRef.current) return;
    handledRef.current = true;
    setWasExpired(expired);
    setOpen(true);

    // Strip prompt params so refresh/back doesn't re-trigger the modal,
    // but keep the page itself (history entry) stable.
    const clean = new URLSearchParams(searchParams.toString());
    clean.delete('authRequired');
    clean.delete('expired');
    if (clean.get('callbackUrl')) {
      try {
        sessionStorage.setItem('authCallbackUrl', clean.get('callbackUrl') as string);
      } catch { /* private mode */ }
    }
    clean.delete('callbackUrl');
    const qs = clean.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [searchParams, router]);

  if (!open) return null;

  return <AuthPromptModal expired={wasExpired} onClose={() => { dismissedRef.current = true; setOpen(false); }} />;
}

function AuthPromptModal({ expired, onClose }: { expired: boolean; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    try { setCallbackUrl(sessionStorage.getItem('authCallbackUrl')); } catch { /* ignore */ }
  }, []);

  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/login';

  return (
    <LoginModal
      open={open}
      onOpenChange={(o) => (o ? setOpen(true) : onClose())}
      title={expired ? 'Session Expired' : 'Login Required'}
      description={
        expired
          ? 'Your session has expired for security. Browsing stays open — log in again to continue shopping where you left off.'
          : 'Login or register to add to cart, wishlist, checkout or place orders. Browsing and pincode check work without login.'
      }
      loginHref={loginHref}
    />
  );
}
