import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/core/services/token.service';
import {
  CallHistoryRecord, CallSession, CallSignalEvent, CallStatusEvent, CallType,
  IncomingCallEvent, InitiateCallPayload, SendSignalPayload
} from 'src/app/core/models/call.model';

@Injectable({ providedIn: 'root' })
export class CallService implements OnDestroy {
  private readonly API = environment.apiBaseUrl + 'calls';

  // Observables consumed by components
  incomingCall$ = new BehaviorSubject<IncomingCallEvent | null>(null);
  callStatus$ = new Subject<CallStatusEvent>();
  callSignal$ = new Subject<CallSignalEvent>();

  activeCall$ = new BehaviorSubject<CallSession | null>(null);
  localStream$ = new BehaviorSubject<MediaStream | null>(null);
  remoteStream$ = new BehaviorSubject<MediaStream | null>(null);
  calledFromCallsSection = false;

  private pc: RTCPeerConnection | null = null;
  private stompClient: Client | null = null;
  private pendingCandidates: RTCIceCandidateInit[] = [];

  private get myUserId(): number {
    return parseInt(this.tokenService.getUserId() || '0');
  }

  getMyUserId(): string {
    return this.tokenService.getUserId() || '0';
  }

  constructor(private http: HttpClient, private tokenService: TokenService) {}

  // ── WebSocket setup ──────────────────────────────────────────────────────────

  initialize(stompClient: Client) {
    this.stompClient = stompClient;

    stompClient.subscribe('/user/queue/incoming-call', msg => {
      this.incomingCall$.next(JSON.parse(msg.body) as IncomingCallEvent);
    });

    stompClient.subscribe('/user/queue/call-status', msg => {
      const event = JSON.parse(msg.body) as CallStatusEvent;
      this.callStatus$.next(event);
      this.handleCallStatusEvent(event);
    });

    stompClient.subscribe('/user/queue/call-signal', msg => {
      const signal = JSON.parse(msg.body) as CallSignalEvent;
      this.callSignal$.next(signal);
      this.handleSignal(signal);
    });
  }

  // ── Step 1: Caller initiates ─────────────────────────────────────────────────

  async initiateCall(callType: CallType, conversationId: number, participantIds: number[]) {
    const payload: InitiateCallPayload = { callType, conversationId, participantIds };
    const res: any = await this.http.post(this.API, payload).toPromise();
    const session: CallSession = res.data;
    this.activeCall$.next(session);

    await this.setupLocalStream(callType);
    this.createPeerConnection();
    // Offer will be sent after callee answers (CALL_ANSWERED event)
    return session;
  }

  // ── Step 3a: Callee answers ──────────────────────────────────────────────────

  async answerCall(callId: number, callType: CallType, callSession: CallSession) {
    this.activeCall$.next(callSession);
    await this.setupLocalStream(callType);
    this.createPeerConnection();  // pc must exist BEFORE we POST /answer
    // so that if the offer arrives immediately after, handleSignal finds this.pc
    await this.http.post(`${this.API}/${callId}/answer`, { webrtcAnswer: null }).toPromise();
  }

  // ── Step 3b: Callee declines ─────────────────────────────────────────────────

  declineCall(callId: number) {
    return this.http.post(`${this.API}/${callId}/decline`, { reason: 'DECLINED' }).toPromise();
  }

  // ── Call history ─────────────────────────────────────────────────────────────

  getCallHistory(limit = 50, offset = 0): Observable<CallHistoryRecord[]> {
    return this.http.get<any>(`${this.API}/history?limit=${limit}&offset=${offset}`).pipe(
      map(res => (res.data?.calls ?? res.calls ?? []) as CallHistoryRecord[])
    );
  }

  // ── Step 6: End call ─────────────────────────────────────────────────────────

  async endCall() {
    const call = this.activeCall$.value;
    this.cleanup(); // dismiss UI immediately, don't wait for HTTP
    if (call) {
      this.http.post(`${this.API}/${call.id}/end`, {}).subscribe({ error: () => {} });
    }
  }

  // ── During-call controls ─────────────────────────────────────────────────────

  toggleMute(isMuted: boolean) {
    const call = this.activeCall$.value;
    if (!call) return;
    this.localStream$.value?.getAudioTracks().forEach(t => t.enabled = !isMuted);
    this.http.post(`${this.API}/${call.id}/mute`, { isMuted }).subscribe();
  }

  toggleVideo(isVideoEnabled: boolean) {
    const call = this.activeCall$.value;
    if (!call) return;
    this.localStream$.value?.getVideoTracks().forEach(t => t.enabled = isVideoEnabled);
    this.http.post(`${this.API}/${call.id}/video`, { isVideoEnabled }).subscribe();
  }

  // ── WebRTC internals ─────────────────────────────────────────────────────────

  private async setupLocalStream(callType: CallType) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === 'VIDEO'
    });
    this.localStream$.next(stream);
    return stream;
  }

  private createPeerConnection() {
    this.pc = new RTCPeerConnection({ iceServers: environment.rtc.iceServers });

    this.localStream$.value?.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream$.value!));

    const remoteStream = new MediaStream();
    this.remoteStream$.next(remoteStream);
    this.pc.ontrack = e => e.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));

    this.pc.onicecandidate = e => {
      if (e.candidate) this.sendSignal('ice-candidate', e.candidate);
    };
  }

  private async handleCallStatusEvent(event: CallStatusEvent) {
    if (event.event === 'CALL_ANSWERED') {
      // Update activeCall status so the panel switches from ringing to answered UI
      const call = this.activeCall$.value;
      if (call) this.activeCall$.next({ ...call, callStatus: 'ANSWERED' });
      // Only the caller sends the offer
      if (this.pc && call && event.answeredByUserId !== this.myUserId) {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.sendSignal('offer', offer);
      }
    } else if (event.event === 'CALL_ENDED' || event.event === 'CALL_DECLINED') {
      this.cleanup();
    }
  }

  private async handleSignal(signal: CallSignalEvent) {
    if (!this.pc) return;

    if (signal.type === 'offer') {
      await this.pc.setRemoteDescription(new RTCSessionDescription(signal.data));
      // flush any ICE candidates that arrived before the offer
      for (const c of this.pendingCandidates) await this.pc.addIceCandidate(new RTCIceCandidate(c));
      this.pendingCandidates = [];
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.sendSignal('answer', answer);
    } else if (signal.type === 'answer') {
      await this.pc.setRemoteDescription(new RTCSessionDescription(signal.data));
      for (const c of this.pendingCandidates) await this.pc.addIceCandidate(new RTCIceCandidate(c));
      this.pendingCandidates = [];
    } else if (signal.type === 'ice-candidate') {
      if (this.pc.remoteDescription) {
        await this.pc.addIceCandidate(new RTCIceCandidate(signal.data));
      } else {
        this.pendingCandidates.push(signal.data);
      }
    }
  }

  private sendSignal(type: 'offer' | 'answer' | 'ice-candidate', data: any) {
    const call = this.activeCall$.value;
    if (!call) return;
    const targetId = call.participants.find(p => p.userId !== this.myUserId)?.userId;
    if (!targetId) return;
    const payload: SendSignalPayload = { type, data, targetParticipantId: targetId };
    this.http.post(`${this.API}/${call.id}/signal`, payload).subscribe();
  }

  private cleanup() {
    this.pc?.close();
    this.pc = null;
    this.pendingCandidates = [];
    this.localStream$.value?.getTracks().forEach(t => t.stop());
    this.localStream$.next(null);
    this.remoteStream$.next(null);
    this.activeCall$.next(null);
    this.incomingCall$.next(null);
    this.calledFromCallsSection = false;
  }

  ngOnDestroy() { this.cleanup(); }
}
