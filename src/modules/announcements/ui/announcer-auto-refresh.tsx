'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ANNOUNCER_REFRESH_MS } from '@/modules/announcements/constants';

/* Legacy polled /api/shows/:id/scoring every 4 seconds in real mode
 * (announcer.html:424 `setInterval(pollRealScoring, 4000)`) and re-rendered the
 * ring feed from the response.
 *
 * This board is read aloud over a PA while a ring is running, so "Now in ring"
 * being one rider behind is worse than the board being blank — the announcer
 * reads the wrong name to a full arena. router.refresh() re-runs the Server
 * Component and swaps in fresh props without losing scroll position.
 *
 * Pauses while the tab is hidden: nobody is reading it, and a board left open
 * overnight on a ring-side laptop shouldn't keep hitting the database every
 * four seconds until someone closes it. */
export function AnnouncerAutoRefresh({
  intervalMs = ANNOUNCER_REFRESH_MS,
}: {
  intervalMs?: number;
}) {
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
