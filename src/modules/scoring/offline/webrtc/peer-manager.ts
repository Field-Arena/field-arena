'use client';

import { PeerLink } from './peer-connection';
import { openSignalingChannel, type SignalingChannel, type SignalMessage } from './signaling-channel';

export interface PeerManagerHandlers {
  onPeerCountChange: (count: number) => void;
}

/** One per scoring screen. Auto-pairs with any other device signaling on the
 * same class's channel (no user action needed), and stays paired using
 * whatever network path each RTCPeerConnection settled on — including one
 * that keeps working after the internet used to find it is gone. */
export class PeerManager {
  private readonly deviceId = crypto.randomUUID();
  private readonly peers = new Map<string, PeerLink>();
  private readonly signaling: SignalingChannel;
  private readonly handlers: PeerManagerHandlers;
  private readonly onRelayMessage: (peerId: string, data: string) => void;

  constructor(
    classId: string,
    handlers: PeerManagerHandlers,
    onRelayMessage: (peerId: string, data: string) => void,
  ) {
    this.handlers = handlers;
    this.onRelayMessage = onRelayMessage;
    this.signaling = openSignalingChannel(classId, (message) => {
      this.handleSignal(message);
    });
    this.signaling.send({ type: 'hello', from: this.deviceId });
  }

  private handleSignal(message: SignalMessage): void {
    if (message.from === this.deviceId) return;
    if ('to' in message && message.to !== this.deviceId) return;

    switch (message.type) {
      case 'hello':
        if (this.peers.has(message.from)) return;
        // Both devices see every "hello" including their own peer's — only
        // the lexicographically lower id offers, so exactly one side
        // initiates instead of both racing to open a channel at once.
        if (this.deviceId < message.from) {
          void this.initiateOffer(message.from);
        }
        return;
      case 'offer':
        void this.acceptOffer(message.from, message.sdp);
        return;
      case 'answer':
        void this.peers.get(message.from)?.applyAnswer(message.sdp);
        return;
      case 'ice':
        void this.peers.get(message.from)?.addIceCandidate(message.candidate);
        return;
    }
  }

  private linkHandlersFor(peerId: string) {
    return {
      onIceCandidate: (candidate: RTCIceCandidateInit) => {
        this.signaling.send({ type: 'ice', from: this.deviceId, to: peerId, candidate });
      },
      onMessage: (data: string) => {
        this.onRelayMessage(peerId, data);
      },
      onStateChange: (state: RTCPeerConnectionState) => {
        this.handleStateChange(peerId, state);
      },
    };
  }

  private async initiateOffer(peerId: string): Promise<void> {
    const link = new PeerLink(this.linkHandlersFor(peerId));
    this.peers.set(peerId, link);
    const offer = await link.createOffer();
    this.signaling.send({ type: 'offer', from: this.deviceId, to: peerId, sdp: offer });
  }

  private async acceptOffer(peerId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    const link = new PeerLink(this.linkHandlersFor(peerId));
    this.peers.set(peerId, link);
    const answer = await link.createAnswer(sdp);
    this.signaling.send({ type: 'answer', from: this.deviceId, to: peerId, sdp: answer });
  }

  private handleStateChange(peerId: string, state: RTCPeerConnectionState): void {
    if (state === 'failed' || state === 'closed' || state === 'disconnected') {
      this.peers.get(peerId)?.close();
      this.peers.delete(peerId);
    }
    this.handlers.onPeerCountChange(this.connectedCount());
  }

  connectedCount(): number {
    let count = 0;
    for (const link of this.peers.values()) {
      if (link.connectionState === 'connected') count += 1;
    }
    return count;
  }

  /** Sends to every connected peer; returns how many actually received it. */
  broadcast(data: string): number {
    let sent = 0;
    for (const link of this.peers.values()) {
      if (link.send(data)) sent += 1;
    }
    return sent;
  }

  sendTo(peerId: string, data: string): boolean {
    return this.peers.get(peerId)?.send(data) ?? false;
  }

  close(): void {
    for (const link of this.peers.values()) link.close();
    this.peers.clear();
    this.signaling.close();
  }
}
