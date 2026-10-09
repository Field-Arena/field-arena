'use client';

import { useEffect } from 'react';
import {
  RIDER_RECENT_SHOWS_COOKIE,
  RIDER_RECENT_SHOWS_MAX_AGE_SECONDS,
} from '@/modules/riders/constants';
import { addRecentShowId } from '@/modules/riders/utils/recent-show-ids';

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const match = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
}

/** Notes that the rider opened this show's entry page, so their portal home
 * lists it ("the show you came from") with a link straight back. Renders
 * nothing. */
export function RememberShowVisit({ showId }: { showId: string }) {
  useEffect(() => {
    const value = addRecentShowId(readCookie(RIDER_RECENT_SHOWS_COOKIE), showId);
    document.cookie = `${RIDER_RECENT_SHOWS_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${RIDER_RECENT_SHOWS_MAX_AGE_SECONDS.toString()}; samesite=lax`;
  }, [showId]);

  return null;
}
