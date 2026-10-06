'use client';

import { useEffect } from 'react';

// Replaces the root layout when it (or anything not caught lower down)
// throws, so it must render its own <html>/<body> and can't rely on
// globals.css — styles are inline on purpose.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#f7f4ec',
          color: '#0d2c23',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          padding: 20,
        }}
      >
        <main style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, margin: '0 0 10px' }}>Something went wrong</h1>
          <p style={{ color: '#5b6b65', lineHeight: 1.55, margin: '0 0 24px' }}>
            Field &amp; Arena hit an unexpected error. Try again, and if it keeps happening, reload
            the page.
          </p>
          {error.digest && (
            <p style={{ color: '#8a948f', fontSize: 12, margin: '0 0 20px' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#0d2c23',
              color: '#fff',
              border: 0,
              borderRadius: 10,
              padding: '11px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
