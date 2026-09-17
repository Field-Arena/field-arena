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
            : "Your rider account is set up. Open the link to a show's ticket page to enter classes, manage your horses, and see your schedule and results there."}
        </p>
      </div>

      {shows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shows.map((show) => (
            <Link
              key={show.showId}
              href={`/rider/shows/${show.showId}`}
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
