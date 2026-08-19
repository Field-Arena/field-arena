'use client';

import { useSignOutRider } from '@/modules/riders/hooks/use-rider-auth-mutations';
import { LEGACY_COLOR, LEGACY_GEORGIA, legacyButtonGhostStyle } from '@/modules/riders/ui/legacy-theme';
import type { RiderRow } from '@/modules/riders/types';

/**
 * The signed-in rider's landing state on the bare `/rider` route (no show
 * context). Legacy has no equivalent standalone screen — rider.html is
 * always reached with a `?show=` param, so there's nothing to pixel-match
 * here; this is a real gap in legacy's own design (a rider who navigates to
 * the portal root with no specific show in mind has nowhere to go), not a
 * deviation from it. Kept deliberately simple, styled with the same legacy
 * tokens as the rest of the portal for visual consistency.
 */
export function RiderWelcomePanel({ rider }: { rider: RiderRow }) {
  const signOut = useSignOutRider();
  const name = [rider.first_name, rider.last_name].filter(Boolean).join(' ') || rider.email;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: LEGACY_GEORGIA, fontSize: 22, color: LEGACY_COLOR.ink, margin: 0 }}>
          Welcome, {name}
        </h1>
        <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft, margin: '6px 0 0' }}>
          Your rider account is set up. Open the link to a show&apos;s ticket page to enter classes,
          manage your horses, and see your schedule and results there.
        </p>
      </div>
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
