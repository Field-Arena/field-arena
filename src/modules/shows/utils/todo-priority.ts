import type { DashboardTodo, TodoPriority } from '@/modules/shows/types';

export type TodoKind =
  /** Expired, rejected or replacement-requested documents. */
  | 'document-problem'
  /** Uploaded documents waiting for the organizer's approval. */
  | 'document-review'
  /** Required documents riders haven't uploaded yet. */
  | 'document-missing'
  /** Blocking setup gaps: unpublished, schedule unapproved, waiver, no entries. */
  | 'setup-warning'
  /** Things that can wait: pending vendors, unaccepted staff invites. */
  | 'note';

/* How urgent a to-do is depends on what it is and how close the show is.
 * A problem document is always urgent — a horse can't be on the grounds
 * without a valid Coggins. Everything else escalates as the show nears;
 * with no show date there's nothing to count down to, so nothing escalates. */
export function todoPriority(kind: TodoKind, daysOut: number | null): TodoPriority {
  if (kind === 'document-problem') return 'urgent';
  const within = (days: number) => daysOut !== null && daysOut <= days;

  switch (kind) {
    case 'document-review':
      return within(14) ? 'urgent' : 'soon';
    case 'document-missing':
      return within(7) ? 'urgent' : within(30) ? 'soon' : 'later';
    case 'setup-warning':
      return within(7) ? 'urgent' : 'soon';
    case 'note':
      return within(7) ? 'soon' : 'later';
  }
}

const ORDER: Record<TodoPriority, number> = { urgent: 0, soon: 1, later: 2 };

export function sortTodos(todos: DashboardTodo[]): DashboardTodo[] {
  return [...todos].sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
}
