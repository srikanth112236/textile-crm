'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, LifeBuoy } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error monitoring hook: replace console with Sentry/Logtail in production.
    console.error('[app-error]', {
      message: error.message,
      digest: error.digest,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-8 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This page hit an unexpected error. Your cart and account are safe — try again, or contact support if it keeps happening.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset} className="bg-slate-950 text-white hover:bg-amber-500 hover:text-slate-950">
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/"><Home className="mr-2 h-4 w-4" /> Home</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/support"><LifeBuoy className="mr-2 h-4 w-4" /> Support</Link>
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 font-mono text-[10px] text-slate-400">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
