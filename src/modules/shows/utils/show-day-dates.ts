import { toIsoDate } from '@/modules/shows/utils/to-iso-date';

/** One 'YYYY-MM-DD' per day in [start, end], inclusive. Falls back to a single "Day 1" when no dates are set yet — matches showstaff.html's effDays fallback in renderSetupView. */
export function showDayDates(startDate: string, endDate: string): string[] {
  if (!startDate) return [];
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start)
    return [startDate];
  const days: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(toIsoDate(d));
  }
  return days;
}
