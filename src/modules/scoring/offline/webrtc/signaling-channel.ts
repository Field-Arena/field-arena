'use client';

import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { createClient } from '@/shared/lib/supabase/client';

// The handshake bus for pairing devices scoring the same class. Only ever
// carries WebRTC offer/answer/ICE messages — never score data — over a
// Supabase Realtime broadcast channel (no table, no persistence, just a
// pub/sub relay). Devices must be online to use this; once two devices have
// a live RTCPeerConnection, this channel is no longer needed for them to
// keep talking to each other.

export interface HelloSignal {
  type: 'hello';
  from: string;
}
export interface OfferSignal {
  type: 'offer';
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
}
export interface AnswerSignal {
  type: 'answer';
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
}
export interface IceSignal {
  type: 'ice';
  from: string;
  to: string;
  candidate: RTCIceCandidateInit;
}
export type SignalMessage = HelloSignal | OfferSignal | AnswerSignal | IceSignal;

export interface SignalingChannel {
  send: (message: SignalMessage) => void;
  close: () => void;
}

export function openSignalingChannel(
  classId: string,
  onMessage: (message: SignalMessage) => void,
): SignalingChannel {
  const supabase = createClient();
  const channel = supabase.channel(`class:${classId}:webrtc`, {
    config: { broadcast: { self: false } },
  });

  channel.on('broadcast', { event: 'signal' }, (event) => {
    onMessage(event.payload as SignalMessage);
  });

  // A message sent before the channel finishes joining is silently dropped
  // — queue anything sent early and flush it once Realtime confirms we're
  // actually subscribed, so the opening "hello" is never lost to a race.
  let subscribed = false;
  const queued: SignalMessage[] = [];
  channel.subscribe((status) => {
    if (status !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED || subscribed) return;
    subscribed = true;
    for (const message of queued.splice(0)) {
      void channel.send({ type: 'broadcast', event: 'signal', payload: message });
    }
  });

  return {
    send(message) {
      if (!subscribed) {
        queued.push(message);
        return;
      }
      void channel.send({ type: 'broadcast', event: 'signal', payload: message });
    },
    close() {
      void supabase.removeChannel(channel);
    },
  };
}
