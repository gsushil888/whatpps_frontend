import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  ConversationDetail,
  ConversationService,
  Participant
} from '../services/conversation.service';

import {
  ContactService
} from '../services/contact.service';

import { Contact } from '../../../core/models/contact.model';
import { TokenService } from '../../../core/services/token.service';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-chat-info',
  templateUrl: './chat-info.component.html',
  styleUrls: ['./chat-info.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatInfoComponent implements OnInit, OnChanges, OnDestroy {

  @Input() chatId: string = '';

  @Output() close = new EventEmitter<void>();

  chatDetail: ConversationDetail | null = null;

  isLoading = false;

  currentUserId: number = 0;

  selectedMedia: { url: string; thumbnailUrl?: string; type: string; fileName: string } | null = null;

  showAllMedia: boolean = false;

  // ADD PARTICIPANTS
  showAddParticipantsModal: boolean = false;

  availableContacts: Contact[] = [];

  selectedParticipantIds: number[] = [];

  addingParticipants: boolean = false;

  // REMOVE PARTICIPANTS
  removingParticipantIds: number[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private conversationService: ConversationService,
    private contactService: ContactService,
    private tokenService: TokenService,
    private webSocketService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentUserId = parseInt(this.tokenService.getUserId() || '0');
    if (this.chatId) this.loadChatDetail();

    this.webSocketService.conversationUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        if (!this.chatDetail || payload.conversationId !== this.chatDetail.id) return;

        if (payload.event === 'PARTICIPANT_ADDED') {
          const added: Participant[] = payload.addedParticipants || [];
          added.forEach(p => {
            const exists = this.chatDetail!.participants.find(x => x.userId === p.userId);
            if (exists) {
              exists.removedByName = null;
              exists.removedAt = null;
            } else {
              this.chatDetail!.participants.push(p);
            }
          });
        } else if (payload.event === 'PARTICIPANT_REMOVED') {
          const p = this.chatDetail.participants.find(x => x.userId === payload.removedUserId);
          if (p) {
            p.removedByName = payload.removedByName || 'Admin';
            p.removedAt = new Date().toISOString();
          }
        } else if (payload.event === 'PARTICIPANT_LEFT') {
          const p = this.chatDetail.participants.find(x => x.userId === payload.leftUserId);
          if (p) {
            p.removedByName = payload.leftUserName || 'Member';
            p.removedAt = payload.leftAt || new Date().toISOString();
          }
        }
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chatId'] && !changes['chatId'].firstChange) {
      this.chatDetail = null;
      if (this.chatId) this.loadChatDetail();
    }
  }

  loadChatDetail() {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.conversationService
      .getConversationDetail(this.chatId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.chatDetail = response.data;
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading chat detail:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  onClose() {
    this.close.emit();
  }

  getSortedParticipants(): Participant[] {
    if (!this.chatDetail) return [];
    return [...this.chatDetail.participants].sort((a, b) => {
      if (a.userId === this.currentUserId) return -1;
      if (b.userId === this.currentUserId) return 1;
      return 0;
    });
  }

  openMediaModal(media: { url: string; thumbnailUrl?: string; type: string; fileName: string; messageId: number }) {
    this.selectedMedia = media;
    this.cdr.markForCheck();
  }

  closeMediaModal() {
    this.selectedMedia = null;
    this.cdr.markForCheck();
  }

  openAllMedia() {
    this.showAllMedia = true;
    this.cdr.markForCheck();
  }

  closeAllMedia() {
    this.showAllMedia = false;
    this.cdr.markForCheck();
  }

  openAddParticipantsModal() {
    if (this.chatDetail?.type !== 'GROUP') return;
    this.showAddParticipantsModal = true;
    this.loadAvailableContacts();
    this.cdr.markForCheck();
  }

  closeAddParticipantsModal() {
    this.showAddParticipantsModal = false;
    this.selectedParticipantIds = [];
    this.cdr.markForCheck();
  }

  loadAvailableContacts() {
    this.contactService.getContacts().subscribe({
      next: (response: any) => {
        const activeParticipantIds = this.chatDetail?.participants
          .filter(p => !p.removedByName)
          .map(p => p.userId) || [];
        this.availableContacts = response.data.contacts.filter(
          (c: Contact) => !activeParticipantIds.includes(c.contactUserId)
        );
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error loading contacts:', err)
    });
  }

  toggleParticipant(contact: Contact) {
    const index = this.selectedParticipantIds.indexOf(contact.contactUserId);
    if (index > -1) {
      this.selectedParticipantIds.splice(index, 1);
    } else {
      this.selectedParticipantIds.push(contact.contactUserId);
    }
    this.cdr.markForCheck();
  }

  addParticipants() {
    if (!this.chatDetail) return;
    this.addingParticipants = true;
    this.cdr.markForCheck();

    this.conversationService
      .addParticipants(this.chatDetail.id, { userIds: this.selectedParticipantIds })
      .subscribe({
        next: (response: any) => {
          this.addingParticipants = false;
          if (response.success) {
            const newParticipants: Participant[] = response.data.addedParticipants || [];
            this.chatDetail?.participants.push(...newParticipants);
            this.closeAddParticipantsModal();
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.addingParticipants = false;
          console.error('Error adding participants:', err);
          this.cdr.markForCheck();
        }
      });
  }

  removeParticipant(participant: Participant) {
    if (!this.chatDetail) return;
    if (!confirm(`Remove ${participant.displayName} from group?`)) return;

    this.removingParticipantIds.push(participant.userId);
    this.cdr.markForCheck();

    this.conversationService.removeParticipant(this.chatDetail.id, participant.userId).subscribe({
      next: (response: any) => {
        this.removingParticipantIds = this.removingParticipantIds.filter(id => id !== participant.userId);
        if (response.success) {
          const p = this.chatDetail!.participants.find(x => x.userId === participant.userId);
          if (p) {
            p.removedByName = 'You';
            p.removedAt = new Date().toISOString();
          }
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.removingParticipantIds = this.removingParticipantIds.filter(id => id !== participant.userId);
        console.error('Error removing participant:', err);
        this.cdr.markForCheck();
      }
    });
  }

  isRemovingParticipant(userId: number): boolean {
    return this.removingParticipantIds.includes(userId);
  }

  isRemovedParticipant(participant: Participant): boolean {
    return !!participant.removedByName;
  }

  get currentUserParticipant(): Participant | undefined {
    return this.chatDetail?.participants.find(p => p.userId === this.currentUserId);
  }

  get isRemovedFromGroup(): boolean {
    return !!this.currentUserParticipant?.removedByName;
  }

  get currentUserRole(): string {
    return this.currentUserParticipant?.participantRole || 'MEMBER';
  }

  get flatMediaItems(): { url: string; thumbnailUrl?: string; type: string; fileName: string; messageId: number }[] {
    if (!this.chatDetail?.media) return [];
    const result: { url: string; thumbnailUrl?: string; type: string; fileName: string; messageId: number }[] = [];
    for (const msg of this.chatDetail.media) {
      if (msg.items && msg.items.length > 0) {
        for (const item of msg.items) {
          result.push({ url: item.url, thumbnailUrl: item.thumbnailUrl, type: item.type, fileName: item.fileName, messageId: msg.messageId });
        }
      } else {
        result.push({ url: msg.url, thumbnailUrl: msg.thumbnailUrl, type: msg.type, fileName: msg.fileName, messageId: msg.messageId });
      }
    }
    return result;
  }

  canRemoveParticipant(participant: Participant): boolean {
    if (participant.userId === this.currentUserId) return false;
    if (this.isRemovedParticipant(participant)) return false;
    return this.currentUserRole === 'OWNER' || this.currentUserRole === 'ADMIN';
  }

}
