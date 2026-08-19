/** How many riders to show in the "Up Next" queue per ring, matching announcer.html's board depth. */
export const UP_NEXT_DEPTH = 3;

/**
 * The roles ported from announcer.html's `contacts` array (Judge, Scribe,
 * "Show Secretary") — 'Show Admin' is this schema's equivalent of a show
 * secretary. ShowStaff/Vendor aren't people an announcer needs to reach
 * mid-ring the way a judge, scribe, or show admin are.
 */
export const CONTACT_ROLES = ['Judge', 'Scribe', 'Show Admin'] as const;

/** Route to the announcer's live-results page, linked from "Up Next". */
export const ANNOUNCING_RESULTS_PATH = '/dashboard/announcing/results';
