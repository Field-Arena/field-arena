'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useSignOutRider } from '@/modules/riders/hooks/use-rider-auth-mutations';
import {
  LEGACY_COLOR,
  LEGACY_GEORGIA,
  LegacySecTitle,
  legacyButtonGhostStyle,
  legacyButtonPrimaryStyle,
  legacyCardStyle,
  legacyPillStyle,
  legacySecNoteStyle,
} from '@/modules/riders/ui/legacy-theme';
import { ROUTES } from '@/shared/constants/routes';
import type { RiderPortalShow, RiderPortalShowStatus, RiderRow } from '@/modules/riders/types';

const STATUS_COPY: Record<
  RiderPortalShowStatus,
  { pill: string; tone: 'ok' | 'warn' | 'bad'; action: string }
> = {
  entered: { pill: 'Entered', tone: 'ok', action: 'View my entries' },
  in_progress: { pill: 'Entry not finished', tone: 'warn', action: 'Continue entry' },
  not_started: { pill: 'Not entered yet', tone: 'warn', action: 'Enter this show' },
};

const linkButtonStyle: CSSProperties = {
  ...legacyButtonPrimaryStyle,
  textDecoration: 'none',
  display: 'inline-block',
  whiteSpace: 'nowrap',
};

export function RiderWelcomePanel({ rider, shows }: { rider: RiderRow; shows: RiderPortalShow[] }) {
  const signOut = useSignOutRider();
  const name = [rider.first_name, rider.last_name].filter(Boolean).join(' ') || rider.email;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1
          style={{ fontFamily: LEGACY_GEORGIA, fontSize: 24, color: LEGACY_COLOR.ink, margin: 0 }}
        >
          Welcome, {name}
        </h1>
        <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft, margin: '6px 0 0' }}>
          Everything you do here belongs to a show. Pick a show to enter classes, finish an entry,
          or see your schedule and results.
        </p>
      </div>

      <div style={legacyCardStyle}>
        <LegacySecTitle>My shows</LegacySecTitle>
        {shows.length === 0 ? (
          <p style={legacySecNoteStyle}>
            You haven&apos;t entered a show yet. Find your show and press <b>Enter this show</b> —
            you&apos;ll come back here with it listed.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {shows.map((show) => {
              const copy = STATUS_COPY[show.status];
              const meta = [show.dateLabel, show.venueName].filter(Boolean).join(' · ');
              return (
                <div
                  key={show.showId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: '14px 16px',
                    background: LEGACY_COLOR.white,
                    border: `1px solid ${LEGACY_COLOR.border}`,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: LEGACY_COLOR.ink }}>
                      {show.showName}
                    </div>
                    {meta && (
                      <div style={{ fontSize: 12.5, color: LEGACY_COLOR.inkSoft, marginTop: 2 }}>
                        {meta}
                      </div>
                    )}
                    <div style={{ marginTop: 6 }}>
                      <span style={legacyPillStyle(copy.tone)}>
                        {copy.pill}
                        {show.status === 'entered' && show.riderNumber
                          ? ` · Rider #${show.riderNumber}`
                          : ''}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/rider/shows/${show.showSlug ?? show.showId}`}
                    prefetch={false}
                    style={linkButtonStyle}
                  >
                    {copy.action} →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <Link
            href={ROUTES.browseShows}
            prefetch={false}
            style={{ fontSize: 13.5, fontWeight: 600, color: LEGACY_COLOR.hunterDeep }}
          >
            Find another show to enter →
          </Link>
        </div>
      </div>

      <button
        type="button"
        style={{ ...legacyButtonGhostStyle, alignSelf: 'flex-start' }}
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
