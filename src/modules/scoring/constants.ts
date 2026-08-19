/**
 * Live-scoring tuning values, ported from showrunner-scoring.html's own
 * constants of the same shape.
 */

/** A blank mark starts here the first time it's touched, not at 0. */
export const MARK_DEFAULT = 6;

/** Marks move in half points, 0–10 — see scoring-engine.ts's clampMark. */
export const MARK_STEP = 0.5;
export const MARK_MIN = 0;
export const MARK_MAX = 10;

/** Grace period before an all-submitted ride auto-advances to the next. */
export const AUTO_ADVANCE_GRACE_MS = 5000;

/** Window during which the last scratch/disqualify/skip can be undone. */
export const UNDO_WINDOW_MS = 20000;

/** How often the live-scoring screen re-fetches class state. */
export const POLL_INTERVAL_MS = 4000;

/** Per-field write debounce, so a scroll/tap burst isn't one request each. */
export const MARK_DEBOUNCE_MS = 400;

/** Remarks/final remarks debounce on its own, slower timer — legacy's separate `_remarkDebounce`. */
export const REMARK_DEBOUNCE_MS = 500;

/** Retry interval for a write that failed to reach the server. */
export const WRITE_RETRY_MS = 3000;

/** Bounded retry count for a write that failed to reach the server — legacy's own 3 tries. */
export const MAX_WRITE_RETRIES = 3;

/** Static routes this module revalidates after a mutation. Dynamic `/dashboard/scoring/{classId}`
 *  routes stay inline as template literals — the established convention across this codebase
 *  (see e.g. `shows/data/mutations.ts`) is to only extract parameter-free paths. */
export const JUDGING_PATH = '/dashboard/judging';
export const JUDGING_HISTORY_PATH = '/dashboard/judging/history';

/**
 * Flat ride spacing assumption for the live vs-schedule clock, ported from
 * legacy's RIDE_MINUTES — "no differentiation by level" (its own comment).
 * Same on-time thresholds as legacy's scheduleStatus: ahead = green,
 * on-time or ≤1 min behind = yellow, 1–10 min behind = pink, >10 = red.
 */
export const RIDE_MINUTES = 9;
