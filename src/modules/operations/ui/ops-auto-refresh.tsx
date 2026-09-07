'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OPS_REFRESH_MS } from '@/modules/operations/constants';

/* Legacy re-polled the whole roster every 10 seconds
 * (showstaff-ops.html:378 `setInterval(loadRealOps, 10000)`), because this is a
 * show-day board: it sits open on a screen while rides are scored, and a stale
 * "Now in ring" is worse than no board at all.
 *
 * The Next equivalent is router.refresh(), which re-runs the Server Component
 * and streams fresh props in without losing client state or scroll position.
 *
 * Pauses while the tab is hidden — nobody is reading it, and a board left open
 * overnight shouldn't keep hitting the database every 10 seconds. */
export function OpsAutoRefresh({ intervalMs = OPS_REFRESH_MS }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => {
      clearInterval(id);
    };
  }, [router, intervalMs]);

  return null;
}
