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

/** Ticket sales right now: open (days until close), not open yet (days
 * until they open), or closed. days is null when no date is set. */
export interface TicketSales {
  state: 'open' | 'not-open' | 'closed';
  days: number | null;
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
  /** Horses whose Coggins is approved and in date, out of horses needing one. */
  cogginsConfirmed: number;
  cogginsTotal: number;
  /** Entered riders who've signed this show's waiver, out of all entered. */
  waiversSigned: number;
  waiversTotal: number;
}
