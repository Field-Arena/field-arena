'use client';

import { createClient } from '@/shared/lib/supabase/client';
import { PeerManager } from './peer-manager';
import type { OfflineActionName } from '../registry';

// The application-level protocol carried over a PeerLink's data channel:
// "please make this write for me" / "here's what happened" — nothing else
// crosses a peer connection. See docs/offline-mode-plan.md and the
// webrtc-sync design notes for why the write still runs as the *sender's*
// own identity even though the receiving device is the one with a network
// path to actually reach Supabase (src/app/api/scoring/relay/route.ts).

interface RelayWriteMessage {
  kind: 'relay-write';
  requestId: string;
  action: OfflineActionName;
  payload: unknown;
  accessToken: string;
}
interface RelayAckMessage {
  kind: 'relay-ack';
  requestId: string;
  ok: boolean;
  error?: string;
}
type RelayMessage = RelayWriteMessage | RelayAckMessage;

const RELAY_TIMEOUT_MS = 8000;

interface PendingRelay {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  remaining: number;
  lastError?: string;
}

let manager: PeerManager | null = null;
const pending = new Map<string, PendingRelay>();

export function initPeerRelay(classId: string, onPeerCountChange: (count: number) => void): () => void {
  manager?.close();
  manager = new PeerManager(classId, { onPeerCountChange }, (peerId, raw) => {
    void handleIncoming(peerId, raw);
  });

  return () => {
    manager?.close();
    manager = null;
  };
}

export function hasConnectedPeers(): boolean {
  return (manager?.connectedCount() ?? 0) > 0;
}

async function handleIncoming(peerId: string, raw: string): Promise<void> {
  let message: RelayMessage;
  try {
    message = JSON.parse(raw) as RelayMessage;
  } catch {
    return;
  }

  if (message.kind === 'relay-write') {
    await relayOnBehalfOfPeer(peerId, message);
    return;
  }
  settleRelayAck(message);
}

/** I'm the device with a network path right now — forward the write to the
 * server using the *sender's* access token, never mine, then report back. */
async function relayOnBehalfOfPeer(peerId: string, message: RelayWriteMessage): Promise<void> {
  let ok = true;
  let error: string | undefined;
  try {
    const response = await fetch('/api/scoring/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: message.accessToken,
        action: message.action,
        payload: message.payload,
      }),
    });
    if (!response.ok) {
      ok = false;
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      error = body.error ?? `Relay failed (${String(response.status)})`;
    }
  } catch {
    ok = false;
    error = 'This device has no connection either right now';
  }

  const ack: RelayAckMessage = { kind: 'relay-ack', requestId: message.requestId, ok, error };
  manager?.sendTo(peerId, JSON.stringify(ack));
}

function settleRelayAck(message: RelayAckMessage): void {
  const waiter = pending.get(message.requestId);
  if (!waiter) return;

  if (message.ok) {
    clearTimeout(waiter.timer);
    pending.delete(message.requestId);
    waiter.resolve();
    return;
  }

  // Multiple peers may have received the same broadcast write — don't fail
  // the caller just because the first ack back happened to be a failure;
  // wait to hear from every peer we actually sent to before giving up.
  waiter.remaining -= 1;
  waiter.lastError = message.error;
  if (waiter.remaining <= 0) {
    clearTimeout(waiter.timer);
    pending.delete(message.requestId);
    waiter.reject(new Error(waiter.lastError ?? 'Relay write failed'));
  }
}

/**
 * Try to get one pending write to the server via any connected peer. Throws
 * the same way a direct network attempt would (so sync-manager's existing
 * retry/backoff logic applies unchanged) if no peer is connected, none of
 * them can reach the server either, or nobody acks in time.
 */
export async function relayWrite(action: OfflineActionName, payload: unknown): Promise<void> {
  if (!manager || manager.connectedCount() === 0) {
    throw new Error('No paired device available to relay through');
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) throw new Error('Not signed in');

  const requestId = crypto.randomUUID();
  const message: RelayWriteMessage = {
    kind: 'relay-write',
    requestId,
    action,
    payload,
    accessToken,
  };

  const sent = manager.broadcast(JSON.stringify(message));
  if (sent === 0) throw new Error('No paired device available to relay through');

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error('Relay timed out'));
    }, RELAY_TIMEOUT_MS);
    pending.set(requestId, { resolve, reject, timer, remaining: sent });
  });
}
