'use client';

import { putPendingWrite, deletePendingWrite, bumpAttempts, type PendingWrite } from './db';
import { OFFLINE_ACTIONS, type OfflineActionName } from './registry';
import { MAX_WRITE_RETRIES, WRITE_RETRY_MS } from '@/modules/scoring/constants';

function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError && /fetch|network/i.test(error.message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A durable version of the in-memory write queue: every scoring write is
// saved to IndexedDB *before* it's attempted, and only cleared once the
// server confirms it. If the tab is closed, the device loses power, or the
// connection just doesn't come back for a while, the write is still sitting
// on the device — nothing is lost. See docs/offline-mode-plan.md (Phase 3).

let chain: Promise<unknown> = Promise.resolve();

function classIdOf(payload: unknown): string {
  const v = (payload as { classId?: unknown } | null)?.classId;
  return typeof v === 'string' ? v : 'unknown';
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${String(Date.now())}-${Math.random().toString(36).slice(2)}`;
}

async function runOne(action: OfflineActionName, payload: unknown): Promise<unknown> {
  const fn = OFFLINE_ACTIONS[action] as (input: unknown) => Promise<unknown>;
  return fn(payload);
}

/**
 * Enqueue one scoring write durably. Resolves/rejects the same way the plain
 * server action would (so existing react-query retry/toast logic is
 * unaffected) — the durability is a side channel: the write also lands in
 * IndexedDB immediately, and stays there until it's confirmed synced, so a
 * background sync (see sync-manager.ts) can replay it later even if this
 * call's own in-session retries give up.
 */
export function enqueueDurableWrite<Output>(
  action: OfflineActionName,
  payload: unknown,
): Promise<Output> {
  const write: PendingWrite = {
    id: newId(),
    actionName: action,
    payload,
    classId: classIdOf(payload),
    createdAt: Date.now(),
    attempts: 0,
  };
  const persisted = putPendingWrite(write).catch(() => {
    // Best-effort — if IndexedDB isn't available, the write still goes out
    // over the network immediately below; it just won't survive a reload.
  });

  const result = chain.then(
    () => persisted.then(() => attempt(write)),
    () => persisted.then(() => attempt(write)),
  );
  chain = result.then(
    () => undefined,
    () => undefined,
  );
  return result as Promise<Output>;
}

async function attempt(write: PendingWrite): Promise<unknown> {
  // A few quick, tight retries first (matches the old in-memory-only
  // behaviour for a brief blip). If those all fail, leave it in IndexedDB —
  // the background sync (sync-manager.ts) will pick it up once the
  // connection is actually back, however long that takes.
  let lastError: unknown;
  for (let i = 0; i <= MAX_WRITE_RETRIES; i++) {
    try {
      const result = await runOne(write.actionName as OfflineActionName, write.payload);
      await deletePendingWrite(write.id).catch(() => undefined);
      return result;
    } catch (error) {
      lastError = error;
      if (!isNetworkFailure(error) || i === MAX_WRITE_RETRIES) break;
      await sleep(WRITE_RETRY_MS);
    }
  }
  throw lastError;
}

/** Re-attempt one already-persisted write (used by the background sync). */
export async function replayPendingWrite(write: PendingWrite): Promise<void> {
  try {
    await runOne(write.actionName as OfflineActionName, write.payload);
    await deletePendingWrite(write.id).catch(() => undefined);
  } catch (error) {
    await bumpAttempts(write).catch(() => undefined);
    throw error;
  }
}
