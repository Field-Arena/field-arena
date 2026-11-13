import type { AssignmentRow } from '@/modules/judging/types';

/* Compared against the row's own todayIso — today in that show's timezone —
 * not the server clock (UTC on Vercel). */
export function classifyAssignment(
  assignment: Pick<AssignmentRow, 'classDate' | 'resultsPublished' | 'todayIso'>,
): 'today' | 'upcoming' | 'history' {
  if (assignment.resultsPublished) return 'history';
  if (assignment.classDate && assignment.classDate < assignment.todayIso) return 'history';
  if (assignment.classDate === assignment.todayIso) return 'today';
  return 'upcoming';
}
