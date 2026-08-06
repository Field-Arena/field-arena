'use client';

/**
 * Serializes every scoring write through one FIFO queue, module-scoped so
 * it's shared across all of this file's mutation hooks within a page.
 *
 * Observed directly while verifying this feature: firing several Server
 * Action calls to the same action reference before the first one resolves
 * causes some of them to be silently dropped — not rejected, not retried,
 * just never reaching the mutation function at all (confirmed via a
 * server-side log line at the top of `writeMark` that simply never printed
 * for the calls that vanished). A judge filling out six movements and four
 * collectives in quick succession does exactly this by default, since each
 * field's write is independent and nothing was otherwise stopping them from
 * overlapping. Running them one at a time removes the overlap entirely.
 */
let queue: Promise<unknown> = Promise.resolve();

export function enqueueScoringWrite<T>(run: () => Promise<T>): Promise<T> {
  const result = queue.then(run, run);
  queue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}
