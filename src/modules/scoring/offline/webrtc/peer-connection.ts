'use client';

// Thin wrapper around one RTCPeerConnection + its data channel. Public STUN
// is only needed to discover a device's own reachable address while it's
// online — once two devices are paired, the data channel keeps working on
// whatever path ICE settled on, local network or not (see
// docs/offline-mode-plan.md and the webrtc-sync design notes).
const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

export interface PeerLinkHandlers {
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onMessage: (data: string) => void;
  onStateChange: (state: RTCPeerConnectionState) => void;
}

export class PeerLink {
  private readonly pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;
  private readonly handlers: PeerLinkHandlers;

  constructor(handlers: PeerLinkHandlers) {
    this.handlers = handlers;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.pc.onicecandidate = (event) => {
      if (event.candidate) this.handlers.onIceCandidate(event.candidate.toJSON());
    };
    this.pc.onconnectionstatechange = () => {
      this.handlers.onStateChange(this.pc.connectionState);
    };
    this.pc.ondatachannel = (event) => {
      this.bindChannel(event.channel);
    };
  }

  private bindChannel(channel: RTCDataChannel): void {
    this.channel = channel;
    channel.onmessage = (event) => {
      this.handlers.onMessage(String(event.data));
    };
  }

  /** Offering side: opens the data channel and returns the local offer to
   * send to the peer over signaling. */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    this.bindChannel(this.pc.createDataChannel('fa-relay'));
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /** Answering side: applies the peer's offer and returns the answer to send
   * back over signaling. The data channel arrives later via `ondatachannel`. */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  async applyAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.pc.setRemoteDescription(answer);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.pc.addIceCandidate(candidate);
    } catch {
      // Benign — the candidate arrived after the connection closed, or a
      // duplicate got resent; nothing to recover.
    }
  }

  /** Returns false without throwing if the channel isn't open yet/anymore —
   * callers treat "couldn't send" the same as "no peer available." */
  send(data: string): boolean {
    if (this.channel?.readyState !== 'open') return false;
    this.channel.send(data);
    return true;
  }

  get connectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }

  close(): void {
    this.channel?.close();
    this.pc.close();
  }
}
