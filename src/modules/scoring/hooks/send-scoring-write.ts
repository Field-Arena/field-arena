'use client';

import { enqueueScoringWrite } from '@/modules/scoring/hooks/use-mutation-queue';
import {
  beginWrite,
  endWrite,
  failWrite,
  isCurrentWrite,
} from '@/modules/scoring/hooks/use-unsaved-writes';
import { MAX_WRITE_RETRIES, WRITE_RETRY_MAX_MS, WRITE_RETRY_MS } from '@/modules/scoring/constants';
import type { ScoringWriteFailure, ScoringWriteResult } from '@/modules/scoring/types';

/** A mark write that didn't save; `reason` says whether retrying can help. */
export class ScoringWriteError extends Error {
  readonly reason: ScoringWriteFailure;

  constructor(reason: ScoringWriteFailure, message: string) {
    super(message);
    this.name = 'ScoringWriteError';
    this.reason = reason;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sends one mark write, tracked in the unsaved-writes store until it lands.
 *
 * Transient failures — the server says so, or the request never got an answer
 * (fetch TypeError, or a thrown server error whose message production builds
 * strip) — retry with backoff, then stay flagged as not saved and are re-sent
 * by useUnsavedWritesGuard. A refusal (no seat, sheet signed, results
 * published, bad value) stops immediately with the server's own message.
 * A newer value for the same mark supersedes this one: it is then dropped
 * rather than sent late over the newer mark.
 */
export async function sendScoringWrite(
  key: string,
  run: () => Promise<ScoringWriteResult>,
): Promise<void> {
  const token = beginWrite(key, () => {
    void sendScoringWrite(key, run).catch(() => undefined);
  });

  for (let attempt = 0; ; attempt++) {
    if (!isCurrentWrite(key, token)) return;
    let result: ScoringWriteResult;
    try {
      result = await enqueueScoringWrite(() =>
        isCurrentWrite(key, token) ? run() : Promise.resolve<ScoringWriteResult>({ ok: true }),
      );
    } catch {
      result = {
        ok: false,
        reason: 'transient',
        message: "Couldn't reach the server — the mark will be saved when it reconnects.",
      };
    }

    if (result.ok) {
      endWrite(key, token);
      return;
    }
    if (result.reason !== 'transient') {
      endWrite(key, token);
      throw new ScoringWriteError(result.reason, result.message);
    }
    if (attempt + 1 >= MAX_WRITE_RETRIES) {
      failWrite(key, token);
      throw new ScoringWriteError(result.reason, result.message);
    }
    await sleep(Math.min(WRITE_RETRY_MS * 2 ** attempt, WRITE_RETRY_MAX_MS));
  }
}
