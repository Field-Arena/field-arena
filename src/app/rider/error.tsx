'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

const HUNTER_DEEP = '#1F3A2E';
const MUTED = '#5B6359';
const GEORGIA_SERIF = "Georgia, 'Times New Roman', serif";

// Rendered inside the rider layout, so the portal header stays in place.
export default function RiderError({
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
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
      <h1
        style={{ fontFamily: GEORGIA_SERIF, color: HUNTER_DEEP, fontSize: 28, margin: '0 0 10px' }}
      >
        Something went wrong
      </h1>
      <p style={{ color: MUTED, lineHeight: 1.55, margin: '0 0 24px' }}>
        This page couldn&rsquo;t be loaded. Try again — if it keeps failing, come back in a few
        minutes.
      </p>
      {error.digest && (
        <p style={{ color: MUTED, fontSize: 12, margin: '0 0 20px' }}>Reference: {error.digest}</p>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={reset}
          style={{
            background: HUNTER_DEEP,
            color: '#fff',
            border: 0,
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href={ROUTES.rider}
          prefetch={false}
          style={{
            color: HUNTER_DEEP,
            border: `1px solid ${HUNTER_DEEP}`,
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Rider portal home
        </Link>
      </div>
    </main>
  );
}
