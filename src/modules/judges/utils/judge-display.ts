import type { PillTone } from '@/shared/ui/organizer/fa-page';
import type { JudgeListItem } from '@/modules/judges/types';

export interface UsefIdSourceInfo {
  label: string;
  tone: PillTone;
}

/** The pill next to a judge's USEF ID: who entered it, or that it is missing. */
export function usefIdSourceInfo(
  judge: Pick<
    JudgeListItem,
    'usefId' | 'usefIdSource' | 'usefIdEnteredBy' | 'usefIdVerifiedAt'
  >,
): UsefIdSourceInfo {
  if (!judge.usefId) return { label: 'needed for USEF export', tone: 'yellow' };
  if (judge.usefIdVerifiedAt) return { label: 'verified by USEF', tone: 'green' };
  if (judge.usefIdSource === 'usef') return { label: 'from USEF', tone: 'green' };
  if (judge.usefIdEnteredBy === 'judge') return { label: 'typed by judge', tone: 'blue' };
  if (judge.usefIdEnteredBy === 'organizer') return { label: 'typed by organizer', tone: 'grey' };
  return { label: 'typed by hand', tone: 'grey' };
}

export interface JudgeStats {
  total: number;
  withUsefId: number;
  missingUsefId: number;
  inUpcomingShow: number;
}

export function judgeStats(judges: JudgeListItem[]): JudgeStats {
  const withUsefId = judges.filter((j) => !!j.usefId).length;
  return {
    total: judges.length,
    withUsefId,
    missingUsefId: judges.length - withUsefId,
    inUpcomingShow: judges.filter((j) => j.shows.some((s) => s.upcoming)).length,
  };
}

/** A show is "upcoming" until the day after it ends (undated shows count). */
export function isUpcomingShow(
  show: { startDate: string | null; endDate: string | null },
  today: string,
): boolean {
  const last = show.endDate ?? show.startDate;
  return last === null || last >= today;
}

/** Blank → null, otherwise the digits. Callers validate with usefIdSchema first. */
export function normalizeUsefId(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  return v === '' ? null : v;
}

/** "today 9:14 AM", "yesterday 4:02 PM" or "Nov 11, 2:30 PM". */
export function formatChangedAt(iso: string | null, now: Date = new Date()): string | null {
  if (!iso) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;

  const time = at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(at)) / 86_400_000);

  if (days === 0) return `today ${time}`;
  if (days === 1) return `yesterday ${time}`;
  const date = at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${date}, ${time}`;
}
