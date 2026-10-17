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
  published: boolean;
  /** Null when the count wasn't loaded for this view. */
  riderCount: number | null;
}

/** Ticket sales right now: open (days until close), not open yet (days
 * until they open), or closed. days is null when no date is set. */
export interface TicketSales {
  state: 'open' | 'not-open' | 'closed';
  days: number | null;
}

/** Vendor bookings for one show, by where they stand. */
export interface ShowVendorSummary {
  paid: number;
  /** Applications waiting for the organizer's review. */
  pending: number;
  /** Approved but not paid yet. */
  approvedUnpaid: number;
  revenue: number;
  /** Booth spaces offered (sum of vendor item quantities); null if none set. */
  spaces: number | null;
}

/** The expanded show panel's extra numbers. */
export interface ShowPanelDetail {
  riders: number;
  horses: number;
  classes: number;
  rings: number;
  venue: string | null;
  /** Raw ticket close date as stored, for "ended Oct 15" / "closes Oct 31". */
  ticketClose: string | null;
  ticketOpen: string | null;
  vendors: ShowVendorSummary;
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
  /** Coggins uploaded and waiting for the organizer's approval. */
  cogginsAwaiting: number;
  /** Coggins rejected or a replacement was asked for (expired counted above). */
  cogginsRejected: number;
  cogginsNotUploaded: number;
  /** Entered riders who've signed this show's waiver, out of all entered. */
  waiversSigned: number;
  waiversTotal: number;
}
