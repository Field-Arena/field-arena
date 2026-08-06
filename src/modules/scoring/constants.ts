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

/** Retry interval for a write that failed to reach the server. */
export const WRITE_RETRY_MS = 3000;
