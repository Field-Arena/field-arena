import { todayInZone } from '@/shared/lib/format/time-zone';

/* The calendar day (YYYY-MM-DD) a ride was scored on, as seen in the show's
 * timezone — scoredAt is a UTC timestamp, so slicing it gives the wrong day
 * for evening rides in the Americas. */
export function scoredDayIso(scoredAt: string | null, timeZone: string): string | null {
  if (!scoredAt) return null;
  const at = new Date(scoredAt);
  if (Number.isNaN(at.getTime())) return null;
  return todayInZone(timeZone, at);
}
