import { Injectable } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CallKind, CallState } from '../models/call.model';
import { SocketService } from './socket.service';

@Injectable({ providedIn: 'root' })
export class CallService {
    private pc?: RTCPeerConnection;
    private localStream?: MediaStream;
    private remoteStream$ = new BehaviorSubject<MediaStream | null>(null);
    private state$ = new BehaviorSubject<CallState>('idle');
    private currentPeer?: string;

    constructor(private ws: SocketService) {
        this.ws.events<any>().pipe(filter(e => ['rtc-offer', 'rtc-answer', 'rtc-ice', 'rtc-end'].includes(e.type)))
            .subscribe(async e => {
                if (e.type === 'rtc-offer') { await this.onOffer(e.payload.fromUserId, e.payload.sdp); }
                if (e.type === 'rtc-answer') { await this.onAnswer(e.payload.sdp); }
                if (e.type === 'rtc-ice') { this.pc?.addIceCandidate(e.payload.candidate); }
                if (e.type === 'rtc-end') { this.end(); }
            });
    }

    state() { return this.state$.asObservable(); }
    remoteStream() { return this.remoteStream$.asObservable(); }

    async startCall(peerUserId: string, kind: CallKind) {
        this.currentPeer = peerUserId;
        this.state$.next('connecting');

        this.localStream = await navigator.mediaDevices.getUserMedia({
            video: kind === 'video', audio: true
        });

        this.pc = new RTCPeerConnection({ iceServers: environment.rtc.iceServers });
        this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));
        this.pc.ontrack = (ev) => this.remoteStream$.next(ev.streams[0]);
        this.pc.onicecandidate = (ev) => ev.candidate && this.ws.send({ type: 'rtc-ice', payload: { toUserId: peerUserId, candidate: ev.candidate } });

        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        this.ws.send({ type: 'rtc-offer', payload: { toUserId: peerUserId, sdp: offer } });
        this.state$.next('ringing');
    }

    private async onOffer(fromUserId: string, sdp: RTCSessionDescriptionInit) {
        this.currentPeer = fromUserId;
        this.state$.next('connecting');
        this.localStream = await navigator.mediaDevices.getUserMedia({ video: sdp.sdp?.includes('m=video') ?? false, audio: true });

        this.pc = new RTCPeerConnection({ iceServers: environment.rtc.iceServers });
        this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));
        this.pc.ontrack = (ev) => this.remoteStream$.next(ev.streams[0]);
        this.pc.onicecandidate = (ev) => ev.candidate && this.ws.send({ type: 'rtc-ice', payload: { toUserId: fromUserId, candidate: ev.candidate } });

        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        this.ws.send({ type: 'rtc-answer', payload: { toUserId: fromUserId, sdp: answer } });
        this.state$.next('in-call');
    }

    private async onAnswer(sdp: RTCSessionDescriptionInit) {
        await this.pc?.setRemoteDescription(new RTCSessionDescription(sdp));
        this.state$.next('in-call');
    }

    end() {
        this.state$.next('ended');
        this.pc?.close(); this.pc = undefined;
        this.localStream?.getTracks().forEach(t => t.stop());
        this.localStream = undefined;
        this.remoteStream$.next(null);
        if (this.currentPeer) this.ws.send({ type: 'rtc-end', payload: { toUserId: this.currentPeer } });
        this.currentPeer = undefined;
        setTimeout(() => this.state$.next('idle'), 0);
    }
}
