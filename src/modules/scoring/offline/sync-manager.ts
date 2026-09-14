'use client';

import { listPendingWrites, type PendingWrite } from './db';
import { replayPendingWrite } from './queue';

// Background flush: replays whatever is still sitting in IndexedDB once the
// connection is back. Runs on mount, on the browser's `online` event, and on
// a slow interval fallback (the `online` event is not fully reliable — a
// captive portal or flaky WiFi can report "online" before requests actually
// succeed). See docs/offline-mode-plan.md (Phase 3).

const FALLBACK_INTERVAL_MS = 15_000;
const MAX_ATTEMPTS = 20; // ~ a few minutes of periodic retries before giving up silently

function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError || /fetch|network|offline/i.test(String(error));
}

let flushing = false;

export type SyncListener = (pending: PendingWrite[]) => void;
const listeners = new Set<SyncListener>();

export function onSyncStateChange(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function notify(): Promise<void> {
  const pending = await listPendingWrites();
  for (const l of listeners) l(pending);
}

export async function flushPendingWrites(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const pending = await listPendingWrites();
    for (const write of pending) {
      if (write.attempts >= MAX_ATTEMPTS) continue; // stuck on a real error — stop hammering it
      try {
        await replayPendingWrite(write);
      } catch (error) {
        if (isNetworkFailure(error)) {
          // Still offline (or the request itself failed to reach the
          // server) — stop here, the next trigger will pick up where this
          // left off. Keep write order intact.
          break;
        }
        // A real server-side error (validation, permission, stale seat…) —
        // skip it so one bad write doesn't block everything behind it.
      }
    }
  } finally {
    flushing = false;
    await notify();
  }
}

let started = false;

/** Call once (e.g. from the scoring screen) to start the background sync. */
export function startOfflineSync(): () => void {
  void flushPendingWrites();
  void notify();

  if (started) return () => undefined;
  started = true;

  const onOnline = () => {
    void flushPendingWrites();
  };
  window.addEventListener('online', onOnline);
  const interval = setInterval(() => {
    void flushPendingWrites();
  }, FALLBACK_INTERVAL_MS);

  return () => {
    window.removeEventListener('online', onOnline);
    clearInterval(interval);
    started = false;
  };
}
