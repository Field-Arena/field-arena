import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createTokenClient } from '@/shared/lib/supabase/token-client';
import { OFFLINE_ACTIONS, type OfflineActionName } from '@/modules/scoring/offline/registry';

// A device with no internet at all can still get its offline queue to the
// server if a paired peer device (same class, connected over WebRTC — see
// src/modules/scoring/offline/webrtc/) has a connection. The peer calls this
// route using *its own* internet, but the write must still run as the
// original device's identity, never the peer's — see createTokenClient's
// doc comment. RLS and the seat-ownership trigger are the real gate here,
// same as any other write in this app; this route does no extra
// authorization of its own on top of that, by design.

const relayRequestSchema = z.object({
  accessToken: z.string().min(1),
  action: z.enum(Object.keys(OFFLINE_ACTIONS) as [OfflineActionName, ...OfflineActionName[]]),
  payload: z.unknown(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = relayRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid relay request' }, { status: 400 });
  }

  const { accessToken, action, payload } = parsed.data;

  try {
    const client = createTokenClient(accessToken);
    const fn = OFFLINE_ACTIONS[action] as (
      input: unknown,
      scoped: { client: typeof client; accessToken: string },
    ) => Promise<unknown>;
    await fn(payload, { client, accessToken });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Relay write failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
