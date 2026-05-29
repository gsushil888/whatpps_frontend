import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
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
  private reload$ = new Subject<void>();

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

    // Debounce all reload triggers so rapid events only cause one API call
    this.reload$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.chatService.reloadConversations());

    this.webSocketService.unreadUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        if (update.action === 'increment' && update.lastMessage) {
          const isConversationOpen = this.selectedChatId === update.conversationId.toString();
          this.chatService.updateChatFromUnreadEvent(
            update.conversationId,
            update.lastMessage,
            !isConversationOpen
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

    // New conversation pushed from backend (first message to unknown user, re-surface, or new group)
    this.webSocketService.newConversation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        const conversationId = payload.conversationId ?? payload.id;
        const lm = payload.lastMessage;
        const exists = this.chatService.findChatById(conversationId);

        if (exists) {
          // Already in list (re-surfaced or duplicate event) — update unread + last message
          const isOpen = this.selectedChatId === conversationId.toString();
          this.chatService.updateChatFromUnreadEvent(
            conversationId,
            { content: lm?.content, messageType: lm?.messageType, timestamp: lm?.timestamp, senderId: lm?.senderId, senderName: lm?.senderName },
            !isOpen
          );
        } else {
          // Brand new — backend now sends full payload, build conversation directly
          const normalized = {
            id: conversationId,
            type: payload.type || 'INDIVIDUAL',
            title: payload.title || lm?.senderName || '',
            profileImageUrl: payload.profileImageUrl || null,
            mobileNumber: payload.mobileNumber || null,
            otherUserId: payload.otherUserId || lm?.senderId,
            isOnline: payload.isOnline ?? null,
            lastActiveAt: payload.lastActiveAt || null,
            unreadCount: payload.unreadCount || 1,
            lastMessageAt: lm?.timestamp || null,
            createdAt: payload.createdAt || lm?.timestamp || null,
            isPinned: false, isMuted: false, isArchived: false, isFavorite: false,
            lastMessage: lm ? {
              id: lm.id, content: lm.content, type: lm.messageType,
              timestamp: lm.timestamp,
              sender: { id: lm.senderId, displayName: lm.senderName },
              status: 'SENT'
            } : null
          };
          this.chatService.upsertChat(normalized as any);
        }
      });

    // Conversation-update events: PARTICIPANT_ADDED, PARTICIPANT_REMOVED, PARTICIPANT_LEFT, PARTICIPANT_READDED
    this.webSocketService.conversationUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        const event = payload.event;
        const conversationId = payload.conversationId;

        if (event === 'PARTICIPANT_REMOVED') {
          // If current user was removed — remove conversation from list
          const currentUserId = this.chatService.getCurrentUserId();
          if (payload.removedUserId === currentUserId) {
            this.chatService.removeChat(conversationId.toString());
            this.chatService.clearSelection();
          } else {
            // Another member removed — reload participant list
            this.reload$.next();
          }
        } else if (event === 'PARTICIPANT_LEFT') {
          // Someone left — reload to update participant list
          this.reload$.next();
        } else if (event === 'PARTICIPANT_ADDED') {
          // New members added — reload to get updated participant list
          this.reload$.next();
        } else if (event === 'PARTICIPANT_READDED') {
          // Current user was re-added to a group
          this.chatService.fetchAndAddConversation(conversationId);
        }
      });
  }

  clearSelection() { this.chatService.clearSelection(); }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.reload$.complete();
  }
}