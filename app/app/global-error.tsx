'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#fbf9f5', color: '#171513', margin: 0 }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <p style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: '#b7791f', fontWeight: 800 }}>
              Mentoos
            </p>
            <h1 style={{ fontSize: 28, margin: '10px 0 8px', letterSpacing: '-.03em' }}>The store is temporarily unavailable</h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6f675d' }}>
              We could not load this page. Please retry in a moment. If you were checking out, your bag is safe.
            </p>
            <button
              onClick={reset}
              style={{ marginTop: 20, border: 0, borderRadius: 10, background: '#171513', color: '#fff', padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
