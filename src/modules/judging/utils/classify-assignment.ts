import { isPast } from '@/shared/lib/format/date';
import type { AssignmentRow } from '@/modules/judging/data/queries';

/**
 * Which of the "My Assignments" tab's two groups, or History, a class falls
 * into. Published results always mean History even if the date is today or
 * later (a same-day reschedule with results already in); otherwise it's a
 * date compare against the viewer's own day, same convention as `isPast`.
 */
export function classifyAssignment(
  assignment: Pick<AssignmentRow, 'classDate' | 'resultsPublished'>,
  todayIso: string,
): 'today' | 'upcoming' | 'history' {
  if (assignment.resultsPublished) return 'history';
  if (assignment.classDate && isPast(assignment.classDate)) return 'history';
  if (assignment.classDate === todayIso) return 'today';
  return 'upcoming';
}
