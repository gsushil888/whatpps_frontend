import {
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
  MediaItem,
  Participant
} from '../services/conversation.service';

import {
  Contact,
  ContactService
} from '../services/contact.service';

import { TokenService } from 'src/app/core/services/token.service';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-chat-info',
  templateUrl: './chat-info.component.html',
  styleUrls: ['./chat-info.component.css']
})
export class ChatInfoComponent implements OnInit, OnChanges, OnDestroy {

  @Input() chatId: string = '';

  @Output() close = new EventEmitter<void>();

  chatDetail: ConversationDetail | null = null;

  currentUserId: number = 0;

  selectedMedia: MediaItem | null = null;

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
    private webSocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    this.currentUserId = parseInt(this.tokenService.getUserId() || '0');
    if (this.chatId) this.loadChatDetail();

    // Real-time participant updates
    this.webSocketService.conversationUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        if (!this.chatDetail || payload.conversationId !== this.chatDetail.id) return;

        if (payload.event === 'PARTICIPANT_ADDED') {
          const added: Participant[] = payload.addedParticipants || [];
          added.forEach(p => {
            const exists = this.chatDetail!.participants.find(x => x.userId === p.userId);
            if (exists) {
              // Re-added: clear removed state
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
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {

    if (
      changes['chatId'] &&
      !changes['chatId'].firstChange
    ) {

      this.chatDetail = null;

      if (this.chatId) {
        this.loadChatDetail();
      }
    }
  }

  loadChatDetail() {

    this.conversationService
      .getConversationDetail(this.chatId)
      .subscribe({
        next: (response: any) => {

          if (response.success) {
            this.chatDetail = response.data;
          }
        },
        error: (err) => {
          console.error(
            'Error loading chat detail:',
            err
          );
        }
      });
  }

  onClose() {
    this.close.emit();
  }

  // ========================================
  // SORT PARTICIPANTS
  // ========================================

  getSortedParticipants(): Participant[] {

    if (!this.chatDetail) {
      return [];
    }

    return [...this.chatDetail.participants]
      .sort((a, b) => {

        if (a.userId === this.currentUserId) {
          return -1;
        }

        if (b.userId === this.currentUserId) {
          return 1;
        }

        return 0;
      });
  }

  // ========================================
  // MEDIA
  // ========================================

  openMediaModal(media: MediaItem) {
    this.selectedMedia = media;
  }

  closeMediaModal() {
    this.selectedMedia = null;
  }

  openAllMedia() {
    this.showAllMedia = true;
  }

  closeAllMedia() {
    this.showAllMedia = false;
  }

  // ========================================
  // ADD PARTICIPANTS
  // ========================================

  openAddParticipantsModal() {

    if (this.chatDetail?.type !== 'GROUP') {
      return;
    }

    this.showAddParticipantsModal = true;

    this.loadAvailableContacts();
  }

  closeAddParticipantsModal() {

    this.showAddParticipantsModal = false;

    this.selectedParticipantIds = [];
  }

  loadAvailableContacts() {
    this.contactService.getContacts().subscribe({
      next: (response: any) => {
        // Only exclude active (non-removed) participants
        const activeParticipantIds = this.chatDetail?.participants
          .filter(p => !p.removedByName)
          .map(p => p.userId) || [];
        this.availableContacts = response.data.contacts.filter(
          (c: Contact) => !activeParticipantIds.includes(c.contactUserId)
        );
      },
      error: (err) => console.error('Error loading contacts:', err)
    });
  }

  toggleParticipant(contact: Contact) {

    const index =
      this.selectedParticipantIds.indexOf(
        contact.contactUserId
      );

    if (index > -1) {

      this.selectedParticipantIds.splice(
        index,
        1
      );

    } else {

      this.selectedParticipantIds.push(
        contact.contactUserId
      );
    }
  }

  addParticipants() {

    if (!this.chatDetail) {
      return;
    }

    this.addingParticipants = true;

    const payload = {
      userIds: this.selectedParticipantIds
    };

    this.conversationService
      .addParticipants(
        this.chatDetail.id,
        payload
      )
      .subscribe({
        next: (response: any) => {

          this.addingParticipants = false;

          if (response.success) {

            const newParticipants: Participant[] =
              response.data.addedParticipants || [];

            this.chatDetail?.participants.push(
              ...newParticipants
            );

            this.closeAddParticipantsModal();
          }
        },
        error: (err) => {

          this.addingParticipants = false;

          console.error(
            'Error adding participants:',
            err
          );
        }
      });
  }

  // ========================================
  // REMOVE PARTICIPANT
  // ========================================

  removeParticipant(participant: Participant) {
    if (!this.chatDetail) return;
    if (!confirm(`Remove ${participant.displayName} from group?`)) return;

    this.removingParticipantIds.push(participant.userId);

    this.conversationService.removeParticipant(this.chatDetail.id, participant.userId).subscribe({
      next: (response: any) => {
        this.removingParticipantIds = this.removingParticipantIds.filter(id => id !== participant.userId);
        if (response.success) {
          // Mark as removed in place — do NOT filter out
          const p = this.chatDetail!.participants.find(x => x.userId === participant.userId);
          if (p) {
            p.removedByName = 'You';
            p.removedAt = new Date().toISOString();
          }
        }
      },
      error: (err) => {
        this.removingParticipantIds = this.removingParticipantIds.filter(id => id !== participant.userId);
        console.error('Error removing participant:', err);
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

  canRemoveParticipant(participant: Participant): boolean {
    if (participant.userId === this.currentUserId) return false;
    if (this.isRemovedParticipant(participant)) return false;
    return this.currentUserRole === 'OWNER' || this.currentUserRole === 'ADMIN';
  }

}
