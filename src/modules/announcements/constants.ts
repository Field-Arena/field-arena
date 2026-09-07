/* Legacy showed the ENTIRE remaining running order in "Up Next"
 * (announcer.html:450 `order.filter(r=>r.status==='upcoming')`), not a window
 * of it. An announcer preps reads several riders ahead — name pronunciation,
 * sponsor copy, hometown — so truncating the queue is a real loss of function,
 * not a display choice. Kept as a named constant so the intent is explicit. */
export const UP_NEXT_DEPTH = Infinity;

/* Legacy re-polled /api/shows/:id/scoring every 4 seconds
 * (announcer.html:424 `setInterval(pollRealScoring, 4000)`). This is a live
 * show-day board read aloud over a PA while a ring is running — a stale
 * "Now in ring" is actively wrong, not merely late. */
export const ANNOUNCER_REFRESH_MS = 4_000;

export const CONTACT_ROLES = ['Judge', 'Scribe', 'Show Admin'] as const;

export const ANNOUNCING_PATH = '/dashboard/announcing';
export const ANNOUNCING_RESULTS_PATH = '/dashboard/announcing/results';
export const ANNOUNCING_SCHEDULE_PATH = '/dashboard/announcing/schedule';
export const ANNOUNCING_CONTACTS_PATH = '/dashboard/announcing/contacts';
export const ANNOUNCING_DOCUMENTS_PATH = '/dashboard/announcing/documents';
export const ANNOUNCING_HISTORY_PATH = '/dashboard/announcing/history';

/* staff_assignments.role value this workspace is scoped to. Legacy fetched
 * `staff-assignments?email=…&role=Announcer` (announcer.html:613) — the role
 * filter is what keeps a Judge+Announcer's judging shows off this board. */
export const ANNOUNCER_ROLE = 'Announcer';
