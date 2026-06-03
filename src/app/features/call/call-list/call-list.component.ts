import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CallHistoryRecord, CallType } from 'src/app/core/models/call.model';
import { TokenService } from 'src/app/core/services/token.service';
import { Chat, ChatService } from '../../chat/services/chat.service';
import { ConversationService } from '../../chat/services/conversation.service';
import { CallService } from '../services/call.service';

@Component({
  selector: 'app-call-list',
  templateUrl: './call-list.component.html',
  styleUrls: ['./call-list.component.css']
})
export class CallListComponent implements OnInit, OnDestroy {
  activeTab: 'contacts' | 'recent' = 'recent';

  // Contacts tab
  chats: Chat[] = [];
  contactsLoading = true;
  callingId: number | null = null;

  // Recent tab
  history: CallHistoryRecord[] = [];
  historyLoading = false;
  historyError = false;

  private subs: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private conversationService: ConversationService,
    private tokenService: TokenService,
    public callService: CallService
  ) {}

  ngOnInit() {
    this.subs.push(
      this.chatService.chats$.subscribe(chats => {
        this.chats = chats.filter(c => c.type === 'INDIVIDUAL');
        this.contactsLoading = false;
      }),
      this.callService.activeCall$.subscribe(call => {
        if (!call) this.callingId = null;
      })
    );
    this.loadHistory();
  }

  switchTab(tab: 'contacts' | 'recent') {
    this.activeTab = tab;
    if (tab === 'recent' && this.history.length === 0 && !this.historyLoading) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.historyLoading = true;
    this.historyError = false;
    this.callService.getCallHistory().subscribe({
      next: records => { this.history = records; this.historyLoading = false; },
      error: () => { this.historyError = true; this.historyLoading = false; }
    });
  }

  async startCall(chat: Chat, callType: CallType) {
    if (this.callingId) return;
    // Use cached otherUserId if available
    if (chat.otherUserId) {
      this.callingId = parseInt(chat.id);
      this.callService.calledFromCallsSection = true;
      try {
        await this.callService.initiateCall(callType, parseInt(chat.id), [chat.otherUserId]);
      } catch {
        this.callService.calledFromCallsSection = false;
        this.callingId = null;
      }
      return;
    }
    // otherUserId not resolved — fetch conversation detail
    this.conversationService.getConversationDetail(chat.id).subscribe(res => {
      if (!res.success) return;
      const myUserId = parseInt(this.tokenService.getUserId() || '0');
      const other = res.data.participants.find(p => p.userId !== myUserId);
      if (!other) return;
      this.chatService.patchOtherUserId(chat.id, other.userId);
      this.callingId = parseInt(chat.id);
      this.callService.calledFromCallsSection = true;
      this.callService.initiateCall(callType, parseInt(chat.id), [other.userId])
        .catch(() => {
          this.callService.calledFromCallsSection = false;
          this.callingId = null;
        });
    });
  }

  async callBack(record: CallHistoryRecord, callType: CallType) {
    if (this.callingId) return;
    const myUserId = parseInt(this.callService.getMyUserId());
    const participantIds = record.participants
      .filter(p => p.userId !== myUserId)
      .map(p => p.userId);
    if (!participantIds.length) return;
    this.callingId = record.conversationId;
    this.callService.calledFromCallsSection = true;
    try {
      await this.callService.initiateCall(callType, record.conversationId, participantIds);
    } catch {
      this.callService.calledFromCallsSection = false;
      this.callingId = null;
    }
  }

  getHistoryAvatar(record: CallHistoryRecord): string {
    // Group call — use group image
    if (record.groupImageUrl) return record.groupImageUrl;
    // Incoming individual — show caller's picture
    if (record.callDirection === 'INCOMING') return record.callerProfilePictureUrl || 'assets/google.svg';
    // Outgoing individual — show callee's picture
    return record.participants[0]?.profilePictureUrl || 'assets/google.svg';
  }

  getStatusIcon(record: CallHistoryRecord): string {
    if (record.callStatus === 'MISSED') return 'fas fa-phone-missed text-red-500';
    if (record.callStatus === 'DECLINED') return 'fas fa-phone-slash text-red-400';
    if (record.callDirection === 'OUTGOING') return 'fas fa-phone-arrow-up-right text-green-500';
    return 'fas fa-phone-arrow-down-left text-blue-500';
  }

  getStatusLabel(record: CallHistoryRecord): string {
    if (record.callStatus === 'MISSED') return 'Missed';
    if (record.callStatus === 'DECLINED') return 'Declined';
    if (record.callStatus === 'ENDED') return record.callDirection === 'OUTGOING' ? 'Outgoing' : 'Incoming';
    return record.callStatus.toLowerCase();
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  formatCallTime(dateStr?: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  isMissedOrDeclined(record: CallHistoryRecord): boolean {
    return record.callStatus === 'MISSED' || record.callStatus === 'DECLINED';
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
