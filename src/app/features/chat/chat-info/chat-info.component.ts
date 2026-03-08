import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ConversationDetail, ConversationService, MediaItem } from '../services/conversation.service';

@Component({
  selector: 'app-chat-info',
  templateUrl: './chat-info.component.html',
  styleUrls: ['./chat-info.component.css']
})
export class ChatInfoComponent implements OnInit, OnChanges {
  @Input() chatId: string = '';
  @Output() close = new EventEmitter<void>();

  chatDetail: ConversationDetail | null = null;
  selectedMedia: MediaItem | null = null;
  showAllMedia: boolean = false;

  constructor(private conversationService: ConversationService) {}

  ngOnInit() {
    if (this.chatId) {
      this.loadChatDetail();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chatId'] && !changes['chatId'].firstChange) {
      this.chatDetail = null;
      if (this.chatId) {
        this.loadChatDetail();
      }
    }
  }

  loadChatDetail() {
    this.conversationService.getConversationDetail(this.chatId).subscribe({
      next: (response) => {
        if (response.success) {
          this.chatDetail = response.data;
        }
      },
      error: (err) => console.error('Error loading chat detail:', err)
    });
  }

  onClose() {
    this.close.emit();
  }

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
}
