/* Types for the organizer dashboard's show tabs, home and to-do list. */

export interface DashboardShowRow {
  id: string;
  slug: string | null;
  name: string;
  dateLabel: string | null;
  /** ISO 'YYYY-MM-DD'; null while the show is still being set up. */
  startDate: string | null;
  endDate: string | null;
  stage: string;
  /** Null when the count wasn't loaded for this view. */
  riderCount: number | null;
}

export type TodoPriority = 'urgent' | 'soon' | 'later';

/** One line on the dashboard's running to-do list. */
export interface DashboardTodo {
  key: string;
  priority: TodoPriority;
  label: string;
  detail: string;
  actionLabel: string;
  href: string;
}

/** Rider-document counts for one show, one count per horse-document. */
export interface ShowDocumentSummary {
  notUploaded: number;
  awaitingReview: number;
  /** Expired, rejected, or a replacement was requested. */
  problem: number;
  cogginsExpired: number;
}
