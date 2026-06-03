import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CallSession, IncomingCallEvent } from 'src/app/core/models/call.model';
import { CallService } from 'src/app/features/call/services/call.service';

@Component({
  selector: 'app-incoming-call',
  template: `
    <div *ngIf="incoming && !isCallsRoute"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 w-80">
        <img [src]="incoming.callerProfilePictureUrl || incoming.callerAvatar || 'assets/google.svg'"
             class="w-20 h-20 rounded-full object-cover ring-4 ring-green-400" alt="caller" />
        <div class="text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">Incoming {{ incoming.callType | lowercase }} call</p>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{{ incoming.callerName }}</h2>
        </div>
        <div class="flex gap-8 mt-2">
          <button (click)="decline()"
                  class="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors">
            <i class="fas fa-phone-slash text-xl"></i>
          </button>
          <button (click)="answer()"
                  class="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-colors">
            <i class="fas fa-phone text-xl"></i>
          </button>
        </div>
      </div>
    </div>
  `
})
export class IncomingCallComponent implements OnInit, OnDestroy {
  incoming: IncomingCallEvent | null = null;
  private subs: Subscription[] = [];

  get isCallsRoute(): boolean {
    return this.router.url.includes('/call');
  }

  constructor(private callService: CallService, private router: Router) {}

  ngOnInit() {
    this.subs.push(
      this.callService.incomingCall$.subscribe(event => {
        this.incoming = event;
      }),
      this.callService.callStatus$.subscribe(event => {
        if (event.event === 'CALL_DECLINED' || event.event === 'CALL_ENDED') {
          this.incoming = null;
        }
      })
    );
  }

  async answer() {
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

  decline() {
    if (!this.incoming) return;
    this.callService.declineCall(this.incoming.callId);
    this.incoming = null;
    this.callService.incomingCall$.next(null);
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
