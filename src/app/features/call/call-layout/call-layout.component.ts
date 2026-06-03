import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CallSession, CallType, IncomingCallEvent } from 'src/app/core/models/call.model';
import { CallListComponent } from '../call-list/call-list.component';
import { CallService } from '../services/call.service';

@Component({
  selector: 'app-call-layout',
  templateUrl: './call-layout.component.html'
})
export class CallLayoutComponent implements OnInit, OnDestroy {
  @ViewChild(CallListComponent) callList!: CallListComponent;

  activeCall: CallSession | null = null;
  incoming: IncomingCallEvent | null = null;
  isMobile = window.innerWidth < 790;
  private subs: Subscription[] = [];

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth < 790; }

  constructor(public callService: CallService, private router: Router) {}

  ngOnInit() {
    this.subs.push(
      this.callService.activeCall$.subscribe(call => this.activeCall = call),
      this.callService.incomingCall$.subscribe(e => this.incoming = e),
      this.callService.callStatus$.subscribe(e => {
        if (e.event === 'CALL_DECLINED' || e.event === 'CALL_ENDED') this.incoming = null;
      })
    );
  }

  async answerIncoming() {
    if (!this.incoming) return;
    const session: CallSession = {
      id: this.incoming.callId,
      callType: this.incoming.callType,
      callStatus: 'ANSWERED',
      callToken: this.incoming.callToken,
      conversationId: this.incoming.conversationId,
      participants: [{
        userId: this.incoming.callerUserId,
        displayName: this.incoming.callerName,
        avatarUrl: this.incoming.callerAvatar,
        profilePictureUrl: this.incoming.callerProfilePictureUrl || this.incoming.callerAvatar,
        participantStatus: 'ANSWERED'
      }]
    };
    this.incoming = null;
    this.callService.incomingCall$.next(null);
    await this.callService.answerCall(session.id, session.callType, session);
  }

  declineIncoming() {
    if (!this.incoming) return;
    this.callService.declineCall(this.incoming.callId);
    this.incoming = null;
    this.callService.incomingCall$.next(null);
  }

  goHome() { this.router.navigate(['/home/chat']); }

  refreshHistory() { this.callList?.loadHistory(); }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
