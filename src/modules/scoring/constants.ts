export const MARK_DEFAULT = 6;

export const MARK_STEP = 0.5;
export const MARK_MIN = 0;
export const MARK_MAX = 10;

export const AUTO_ADVANCE_GRACE_MS = 5000;

export const UNDO_WINDOW_MS = 20000;

export const POLL_INTERVAL_MS = 4000;

/** Ceiling the poll backs off to while nothing on the class is changing. */
export const POLL_MAX_INTERVAL_MS = 15000;

export const POLL_BACKOFF_FACTOR = 1.5;

export const MARK_DEBOUNCE_MS = 400;

export const REMARK_DEBOUNCE_MS = 500;

// A mark write that hits a transient failure is retried in place with
// exponential backoff (1s, 2s, 4s, ... capped), then parked as "not saved"
// and re-sent every UNSAVED_RESEND_MS and whenever the browser comes back
// online, until it lands or the judge enters a newer value for that mark.
export const WRITE_RETRY_MS = 1000;

export const WRITE_RETRY_MAX_MS = 8000;

export const MAX_WRITE_RETRIES = 5;

export const UNSAVED_RESEND_MS = 15000;

export const JUDGING_PATH = '/dashboard/judging';
export const JUDGING_HISTORY_PATH = '/dashboard/judging/history';

/** Longest back number the holding-queue form accepts. */
export const BACK_NUMBER_MAX_LENGTH = 10;

/** Longest reason a reopen / disqualify can carry. */
export const REASON_MAX_LENGTH = 500;

/* Paper score sheets typed in by the show office (offline backup). */
export const PAPER_MAX_ERRORS = 9;

/** error_at keys written for paper sheets, which record a count of errors of
 * course rather than the movement each happened at. scores.errors is derived
 * from error_at by the database (scores_a_sync_error_count). */
export const PAPER_ERROR_KEY_PREFIX = 'paper-';
