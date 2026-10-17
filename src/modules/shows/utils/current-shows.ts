import type { DashboardShowRow } from '@/modules/shows/types';

/* A show is finished once results are published or its last day has passed.
 * Both count: an organizer thinks of a show as over when the trailers leave,
 * not only when the last class's results go out. */
export function isShowFinished(show: DashboardShowRow, todayIso: string): boolean {
  if (show.stage === 'complete') return true;
  const lastDay = show.endDate ?? show.startDate;
  return lastDay !== null && lastDay < todayIso;
}

/* The shows an organizer is working on right now, most pressing first:
 * a show running today, then upcoming shows soonest first, then shows still
 * being set up with no dates yet. */
export function pickCurrentShows(
  shows: DashboardShowRow[],
  todayIso: string,
  limit = 3,
): DashboardShowRow[] {
  const rank = (s: DashboardShowRow) => (s.stage === 'live' ? 0 : s.startDate ? 1 : 2);
  return shows
    .filter((s) => !isShowFinished(s, todayIso))
    .sort((a, b) => rank(a) - rank(b) || (a.startDate ?? '').localeCompare(b.startDate ?? ''))
    .slice(0, limit);
}

/* Finished shows, most recent first. */
export function pickFinishedShows(shows: DashboardShowRow[], todayIso: string): DashboardShowRow[] {
  return shows
    .filter((s) => isShowFinished(s, todayIso))
    .sort((a, b) => (b.endDate ?? b.startDate ?? '').localeCompare(a.endDate ?? a.startDate ?? ''));
}

/* Whole days from today until the show starts; null when it has no date. */
export function daysUntilShow(show: { startDate: string | null }, todayIso: string): number | null {
  if (!show.startDate) return null;
  const ms = Date.parse(`${show.startDate}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}
