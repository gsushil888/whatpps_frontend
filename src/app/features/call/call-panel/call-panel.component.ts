import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { CallService } from '../services/call.service';

@Component({
  selector: 'app-call-panel',
  templateUrl: './call-panel.component.html'
})
export class CallPanelComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;

  isMuted = false;
  isVideoOff = false;
  durationSeconds = 0;
  private timerInterval: any;
  private subs: Subscription[] = [];

  constructor(public callService: CallService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.subs.push(
      this.callService.activeCall$.subscribe(call => {
        if (call?.callStatus === 'ANSWERED') this.startTimer();
        else this.stopTimer();
        this.cdr.detectChanges();
      }),
      this.callService.localStream$.subscribe(() => this.attachStreams()),
      this.callService.remoteStream$.subscribe(() => this.attachStreams())
    );
  }

  ngAfterViewChecked() {
    this.attachStreams();
  }

  private attachStreams() {
    const local = this.callService.localStream$.value;
    const remote = this.callService.remoteStream$.value;
    if (local && this.localVideoRef?.nativeElement &&
        this.localVideoRef.nativeElement.srcObject !== local) {
      this.localVideoRef.nativeElement.srcObject = local;
    }
    if (remote && this.remoteVideoRef?.nativeElement &&
        this.remoteVideoRef.nativeElement.srcObject !== remote) {
      this.remoteVideoRef.nativeElement.srcObject = remote;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.callService.toggleMute(this.isMuted);
  }

  toggleVideo() {
    this.isVideoOff = !this.isVideoOff;
    this.callService.toggleVideo(!this.isVideoOff);
  }

  endCall() {
    this.callService.endCall();
  }

  get activeCall() {
    return this.callService.activeCall$.value;
  }

  get remoteParticipant() {
    return this.activeCall?.participants[0];
  }

  get isGroupCall(): boolean {
    return (this.activeCall?.participants?.length ?? 0) > 1;
  }

  get remoteDisplayName(): string {
    if (!this.activeCall) return '';
    if (this.isGroupCall) return this.activeCall.displayName || 'Group Call';
    return this.remoteParticipant?.displayName || this.activeCall.displayName || '';
  }

  get remoteAvatar(): string {
    if (!this.activeCall) return 'assets/google.svg';
    // Group call — show group image
    if (this.isGroupCall) return this.activeCall.groupImageUrl || 'assets/google.svg';
    // Individual — callee's picture from participants[0]
    const p = this.remoteParticipant;
    return p?.profilePictureUrl || p?.avatarUrl || 'assets/google.svg';
  }

  get formattedDuration(): string {
    const m = Math.floor(this.durationSeconds / 60).toString().padStart(2, '0');
    const s = (this.durationSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private startTimer() {
    if (this.timerInterval) return; // already running
    this.durationSeconds = 0;
    this.timerInterval = setInterval(() => { this.durationSeconds++; this.cdr.detectChanges(); }, 1000);
  }

  private stopTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.durationSeconds = 0;
  }

  ngOnDestroy() {
    this.stopTimer();
    this.subs.forEach(s => s.unsubscribe());
  }
}
