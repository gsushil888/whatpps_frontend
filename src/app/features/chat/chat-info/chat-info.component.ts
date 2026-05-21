import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';

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

@Component({
  selector: 'app-chat-info',
  templateUrl: './chat-info.component.html',
  styleUrls: ['./chat-info.component.css']
})
export class ChatInfoComponent
  implements OnInit, OnChanges {

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

  constructor(
    private conversationService: ConversationService,
    private contactService: ContactService,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {

    this.currentUserId =
      parseInt(
        this.tokenService.getUserId() || '0'
      );

    if (this.chatId) {
      this.loadChatDetail();
    }
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

        const existingParticipantIds =
          this.chatDetail?.participants.map(
            (participant: Participant) =>
              participant.userId
          ) || [];

        this.availableContacts =
          response.data.contacts.filter(
            (contact: Contact) =>
              !existingParticipantIds.includes(
                contact.contactUserId
              )
          );
      },
      error: (err) => {
        console.error(
          'Error loading contacts:',
          err
        );
      }
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

  removeParticipant(
    participant: Participant
  ) {

    if (!this.chatDetail) {
      return;
    }

    const confirmed = confirm(
      `Remove ${participant.displayName} from group?`
    );

    if (!confirmed) {
      return;
    }

    this.removingParticipantIds.push(
      participant.userId
    );

    this.conversationService
      .removeParticipant(
        this.chatDetail.id,
        participant.userId
      )
      .subscribe({
        next: (response: any) => {

          this.removingParticipantIds =
            this.removingParticipantIds.filter(
              id => id !== participant.userId
            );

          if (response.success) {

            this.chatDetail!.participants =
              this.chatDetail!.participants.filter(
                p =>
                  p.userId !==
                  participant.userId
              );
          }
        },
        error: (err) => {

          this.removingParticipantIds =
            this.removingParticipantIds.filter(
              id => id !== participant.userId
            );

          console.error(
            'Error removing participant:',
            err
          );
        }
      });
  }

  isRemovingParticipant(
    userId: number
  ): boolean {

    return this.removingParticipantIds.includes(
      userId
    );
  }
}