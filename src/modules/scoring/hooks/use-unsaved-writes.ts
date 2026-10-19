'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { UNSAVED_RESEND_MS } from '@/modules/scoring/constants';

/* Mark writes the server hasn't confirmed yet, keyed by
 * entry|seat|field|key. The scoring screen paints every mark optimistically,
 * so without this a judge saw a complete sheet — and signed it — while some
 * of those marks had never been saved (stress test: 15 signed sheets missing
 * a mark). Tracked here so the sheet can flag them, Sign & Submit can wait
 * for them, and leaving the page can warn about them.
 *
 * Only the newest write for a key counts: entering a new value supersedes a
 * pending or failed older one, which is then never re-sent (it would
 * overwrite the newer mark). */

export type UnsavedState = 'saving' | 'failed';

interface TrackedWrite {
  token: number;
  state: UnsavedState;
  resend: () => void;
}

const writes = new Map<string, TrackedWrite>();
const listeners = new Set<() => void>();
const EMPTY: ReadonlyMap<string, UnsavedState> = new Map();
let snapshot: ReadonlyMap<string, UnsavedState> = EMPTY;
let nextToken = 1;

function publish() {
  snapshot = new Map([...writes].map(([key, write]) => [key, write.state]));
  for (const listener of listeners) listener();
}

/** Prefix shared by every write key of one scoresheet (ride + seat). */
export function scoringSheetKeyPrefix(entryId: string, seatId: string) {
  return `${entryId}|${seatId}|`;
}

export function scoringWriteKey(entryId: string, seatId: string, field: string, key: string) {
  return `${scoringSheetKeyPrefix(entryId, seatId)}${field}|${key}`;
}

/** Registers a write as in flight; returns the token that identifies it. */
export function beginWrite(key: string, resend: () => void): number {
  const token = nextToken++;
  writes.set(key, { token, state: 'saving', resend });
  publish();
  return token;
}

/** False once a newer write for the same key has started. */
export function isCurrentWrite(key: string, token: number): boolean {
  return writes.get(key)?.token === token;
}

/** The write landed, or was refused for good: either way stop tracking it. */
export function endWrite(key: string, token: number) {
  if (!isCurrentWrite(key, token)) return;
  writes.delete(key);
  publish();
}

/** Retries ran out; keep the mark flagged until a resend lands. */
export function failWrite(key: string, token: number) {
  const write = writes.get(key);
  if (write?.token !== token) return;
  writes.set(key, { ...write, state: 'failed' });
  publish();
}

export function resendFailedWrites() {
  for (const write of [...writes.values()]) {
    if (write.state === 'failed') write.resend();
  }
}

export function hasUnsavedWrites(): boolean {
  return writes.size > 0;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useUnsavedWrites(): ReadonlyMap<string, UnsavedState> {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
}

/**
 * Keeps failed writes moving while the scoring screen is open: re-sends them
 * when the browser reports it is back online and every UNSAVED_RESEND_MS,
 * and asks for confirmation before the page is closed or reloaded with
 * anything unsaved.
 */
export function useUnsavedWritesGuard(hasFailed: boolean) {
  useEffect(() => {
    if (!hasFailed) return;
    const id = setInterval(resendFailedWrites, UNSAVED_RESEND_MS);
    window.addEventListener('online', resendFailedWrites);
    return () => {
      clearInterval(id);
      window.removeEventListener('online', resendFailedWrites);
    };
  }, [hasFailed]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedWrites()) return;
      event.preventDefault();
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);
}
