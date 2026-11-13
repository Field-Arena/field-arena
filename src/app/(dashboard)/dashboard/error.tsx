'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

// Rendered inside the dashboard shell (the layout stays mounted), so one
// failed page query no longer blanks the sidebar and topbar with it.
export default function DashboardError({
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
    <div>
      <div className="fa-page-head">
        <div>
          <h2>Something went wrong</h2>
          <p>This page couldn&rsquo;t be loaded. The rest of your workspace is still available.</p>
        </div>
      </div>
      <div className="fa-card" style={{ padding: 24 }}>
        <p style={{ margin: '0 0 16px', color: 'var(--fa-ink-2)' }}>
          Try again — if it keeps failing, reload the page or come back in a few minutes.
          {error.digest && (
            <span
              style={{ display: 'block', marginTop: 8, color: 'var(--fa-ink-3)', fontSize: 12 }}
            >
              Reference: {error.digest}
            </span>
          )}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="fa-btn fa-btn-primary" onClick={reset}>
            Try again
          </button>
          <Link href={ROUTES.dashboard} prefetch={false} className="fa-btn fa-btn-ghost">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
