import type { AssignmentRow } from '@/modules/judging/types';

export function isAssignmentComplete(
  assignment: Pick<AssignmentRow, 'entryCount' | 'advancedCount'>,
): boolean {
  return assignment.entryCount > 0 && assignment.advancedCount === assignment.entryCount;
}
