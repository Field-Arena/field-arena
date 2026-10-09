import { RIDER_RECENT_SHOWS_MAX } from '@/modules/riders/constants';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Show ids from the recent-shows cookie value — only well-formed uuids, so a
 * tampered cookie can never reach a query as anything else. */
export function parseRecentShowIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return decodeURIComponent(raw)
    .split(',')
    .map((id) => id.trim())
    .filter((id) => UUID_PATTERN.test(id))
    .slice(0, RIDER_RECENT_SHOWS_MAX);
}

/** The cookie value with `showId` moved to the front. */
export function addRecentShowId(raw: string | null | undefined, showId: string): string {
  const ids = [showId, ...parseRecentShowIds(raw).filter((id) => id !== showId)];
  return ids.slice(0, RIDER_RECENT_SHOWS_MAX).join(',');
}
