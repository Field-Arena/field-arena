import { resolveTimeZone, todayInZone } from '@/shared/lib/format/time-zone';
import { toIsoDate } from '@/modules/shows/utils/to-iso-date';

// "Today" as a YYYY-MM-DD string in the viewer's own calendar, not UTC —
// `new Date().toISOString().slice(0, 10)` flips to tomorrow every US evening.
export function localTodayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

// For "can't be in the past" checks that also run on the server, where the
// process clock is UTC and doesn't know the organizer's timezone: the
// earliest calendar date still current anywhere (UTC-12), so a date that is
// today for the person submitting is never rejected as past.
export function earliestTodayIso(now: Date = new Date()): string {
  return new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// With the show's timezone known, "today" is that zone's calendar day on both
// client and server. Without it, fall back to the lenient rule above.
export function minAllowedTodayIso(timeZone?: string | null): string {
  if (timeZone?.trim()) return todayInZone(resolveTimeZone(timeZone));
  return typeof window === 'undefined' ? earliestTodayIso() : localTodayIso();
}
