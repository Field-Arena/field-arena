'use client';

let queue: Promise<unknown> = Promise.resolve();

export function enqueueScoringWrite<T>(run: () => Promise<T>): Promise<T> {
  const result = queue.then(run, run);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
