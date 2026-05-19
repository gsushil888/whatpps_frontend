import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.css']
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  showNewChatView = false;
  selectedChatId: string | null = null;
  isMobile = window.innerWidth < 790;
  private destroy$ = new Subject<void>();

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth < 790; }

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit() {
    this.chatService.initializeConversations();
    this.userService.loadCurrentUser().subscribe();
    this.chatService.showNewChatView$.subscribe(show => { this.showNewChatView = show; });
    this.chatService.selectedChatId$.subscribe(id => { this.selectedChatId = id; });

    this.webSocketService.unreadUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        if (update.action === 'increment' && update.lastMessage) {
          const isConversationOpen = this.selectedChatId === update.conversationId.toString();
          this.chatService.updateChatFromUnreadEvent(
            update.conversationId,
            update.lastMessage,
            !isConversationOpen  // only increment badge if conversation is not open
          );
        }
      });

    // Update last message for currently open conversation (from /topic/conversation/{id})
    this.webSocketService.message$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message && message.id && message.createdAt && !message.action && message.conversationId) {
          this.chatService.updateChatLastMessage(
            message.conversationId.toString(),
            message.content || '',
            message.messageType || 'TEXT',
            message.createdAt
          );
        }
      });

    // New conversation pushed from backend (user was added to a new chat/group)
    this.webSocketService.newConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        if (payload.conversationId && !payload.id) {
          // INDIVIDUAL first-message push — partial payload, reload to get full conversation
          this.chatService.reloadConversations();
        } else {
          // GROUP creation push — full ConversationResponse shape
          this.chatService.addNewChat(this.chatService.mapConversation(payload));
        }
      });

    // Existing group had participants added — reload to reflect updated participant list
    this.webSocketService.conversationUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.chatService.reloadConversations();
      });
  }

  clearSelection() { this.chatService.clearSelection(); }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}