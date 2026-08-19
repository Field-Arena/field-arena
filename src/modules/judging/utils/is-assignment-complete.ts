import type { AssignmentRow } from '@/modules/judging/data/queries';

/** A class is "complete" once every entry has been scored, scratched, or disqualified — drives the Results view. */
export function isAssignmentComplete(
  assignment: Pick<AssignmentRow, 'entryCount' | 'advancedCount'>,
): boolean {
  return assignment.entryCount > 0 && assignment.advancedCount === assignment.entryCount;
}
