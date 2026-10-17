import type { ShowPickerSummary } from '@/modules/shows/data/queries';
import type { DashboardShowRow } from '@/modules/shows/types';

/* The show picker's rows, in the shape the dashboard's tabs and home use. */
export function toDashboardShowRows(shows: ShowPickerSummary[]): DashboardShowRow[] {
  return shows.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    dateLabel: s.dateLabel,
    startDate: s.startDate,
    endDate: s.endDate,
    stage: s.stage,
    riderCount: null,
  }));
}
