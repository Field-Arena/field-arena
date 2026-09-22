'use client';

import Link from 'next/link';
import { useSignOutRider } from '@/modules/riders/hooks/use-rider-auth-mutations';
import {
  LEGACY_COLOR,
  LEGACY_GEORGIA,
  legacyButtonGhostStyle,
} from '@/modules/riders/ui/legacy-theme';
import type { RiderRow } from '@/modules/riders/types';
import type { RiderShowLink } from '@/modules/riders/data/queries';

export function RiderWelcomePanel({ rider, shows }: { rider: RiderRow; shows: RiderShowLink[] }) {
  const signOut = useSignOutRider();
  const name = [rider.first_name, rider.last_name].filter(Boolean).join(' ') || rider.email;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1
          style={{ fontFamily: LEGACY_GEORGIA, fontSize: 22, color: LEGACY_COLOR.ink, margin: 0 }}
        >
          Welcome, {name}
        </h1>
        <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft, margin: '6px 0 0' }}>
          {shows.length > 0
            ? "You're entered in more than one show — pick which one to open."
            : 'Your rider account is set up. Browse shows to enter classes, manage your horses, and see your schedule and results.'}
        </p>
      </div>

      <Link
        href="/shows"
        className="border-hunter-deep text-hunter-deep hover:bg-hunter-pale focus-visible:ring-gold rounded-lg border px-4 py-3 text-center text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
      >
        Browse shows
      </Link>

      {shows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shows.map((show) => (
            <Link
              key={show.showId}
              href={`/rider/shows/${show.showSlug ?? show.showId}`}
              style={{
                display: 'block',
                padding: '10px 14px',
                border: `1px solid ${LEGACY_COLOR.border}`,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: LEGACY_COLOR.ink,
                textDecoration: 'none',
              }}
            >
              {show.showName}
            </Link>
          ))}
        </div>
      )}

      <button
        type="button"
        style={legacyButtonGhostStyle}
        onClick={() => {
          signOut.mutate();
        }}
        disabled={signOut.isPending}
      >
        {signOut.isPending ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}
