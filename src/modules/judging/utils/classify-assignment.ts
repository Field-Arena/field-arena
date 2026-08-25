import { isPast } from '@/shared/lib/format/date';
import type { AssignmentRow } from '@/modules/judging/data/queries';

export function classifyAssignment(
  assignment: Pick<AssignmentRow, 'classDate' | 'resultsPublished'>,
  todayIso: string,
): 'today' | 'upcoming' | 'history' {
  if (assignment.resultsPublished) return 'history';
  if (assignment.classDate && isPast(assignment.classDate)) return 'history';
  if (assignment.classDate === todayIso) return 'today';
  return 'upcoming';
}
