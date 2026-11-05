import { UserFacingError } from '@/shared/lib/action-result';
import { ScoringRejection } from '@/modules/scoring/utils/scoring-rejection';
import type { ScoringWriteResult } from '@/modules/scoring/types';

const TRANSIENT_MESSAGE = "Couldn't reach the server — the mark will be saved when it reconnects.";

interface PostgrestLikeError {
  code?: unknown;
  message?: unknown;
}

/**
 * Turns whatever a mark write threw into a result the judge's screen can act
 * on. Anything not positively recognised as a refusal counts as transient:
 * retrying a write that can't succeed costs a few seconds, while reporting a
 * dropped connection as "no permission" is how marks were being lost.
 */
export function classifyScoringWriteError(error: unknown): ScoringWriteResult {
  if (error instanceof ScoringRejection) {
    return { ok: false, reason: error.reason, message: error.message };
  }
  if (error instanceof UserFacingError) {
    return { ok: false, reason: 'invalid', message: error.message };
  }

  const pg = (error ?? {}) as PostgrestLikeError;
  const code = typeof pg.code === 'string' ? pg.code : '';
  const message = typeof pg.message === 'string' && pg.message ? pg.message : null;

  // Raised by our own triggers with a message meant for the judge.
  if (code === 'FA020') {
    return { ok: false, reason: 'locked', message: message ?? 'Results are published.' };
  }
  if (code === '42501') {
    return {
      ok: false,
      reason: message?.includes('signed') ? 'locked' : 'denied',
      message: message ?? "You don't have permission to do that.",
    };
  }
  // Data exceptions, constraint violations, and plain RAISE EXCEPTION from a
  // trigger: the same write would fail the same way again.
  if (code.startsWith('22') || code.startsWith('23') || code === 'P0001' || code === 'FA021') {
    return { ok: false, reason: 'invalid', message: message ?? "That mark couldn't be saved." };
  }

  // Connection errors (08), resource limits (53), timeouts/cancels (57),
  // serialization/deadlock (40), PostgREST connection errors (PGRST00x),
  // fetch failures with no code, and anything unexpected.
  return { ok: false, reason: 'transient', message: TRANSIENT_MESSAGE };
}
