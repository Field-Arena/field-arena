import { resolveTimeZone, todayInZone } from '@/shared/lib/format/time-zone';

/** Today's calendar date (YYYY-MM-DD) in the given IANA time zone — the date
 * a signature is dated with. Falls back to the app default zone
 * (America/New_York) when the zone is missing or not one the runtime
 * recognises, never to UTC, which is already tomorrow on US evenings. */
export function todayInTimeZone(timeZone: string | null | undefined, now = new Date()): string {
  return todayInZone(resolveTimeZone(timeZone), now);
}
