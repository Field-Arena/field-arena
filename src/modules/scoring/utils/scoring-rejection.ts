import type { ScoringWriteFailure } from '@/modules/scoring/types';

/** A scoring write refused for a reason a retry can't fix. */
export class ScoringRejection extends Error {
  readonly reason: Exclude<ScoringWriteFailure, 'transient'>;

  constructor(reason: Exclude<ScoringWriteFailure, 'transient'>, message: string) {
    super(message);
    this.name = 'ScoringRejection';
    this.reason = reason;
  }
}
