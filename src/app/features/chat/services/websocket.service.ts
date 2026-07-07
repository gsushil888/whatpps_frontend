import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { CryptoService } from 'src/app/core/services/crypto.service';
import { PresenceService } from 'src/app/core/services/presence.service';
import { TokenService } from 'src/app/core/services/token.service';
import { TypingIndicatorService } from 'src/app/core/services/typing-indicator.service';
import { environment } from 'src/environments/environment';
import { CallService } from '../../call/services/call.service';

export interface ChatMessage {
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  mediaMetadata?: any;
  replyToMessageId?: number | null;
  attachments?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private messageSubject = new BehaviorSubject<any>(null);
  private messageStatusSubject = new Subject<{ conversationId: number; status: string; readByUserId?: number }>();
  private reactionSubject = new Subject<{ messageId: number; conversationId: number; emoji: string; action: string; reactorId: number; reactorName: string; attachmentId?: number | null }>();
  private unreadUpdateSubject = new Subject<{
    conversationId: number;
    action: string;
    lastMessage?: {
      id: number;
      content: string;
      messageType: string;
      senderId: number;
      senderName: string;
      timestamp: string;
    };
  }>();
  private newConversationSubject = new Subject<any>();
  private conversationUpdateSubject = new Subject<any>();
  private participantRemovedSubject = new Subject<{ conversationId: number; removedUserId: number; removedByUserId: number; removedByName: string; removedAt: string }>();
  private storyViewSubject = new Subject<{ storyId: number; viewCount: number; viewerId: number; viewerName: string; viewerAvatar: string; viewedAt: string }>();

  message$ = this.messageSubject.asObservable();
  messageStatus$ = this.messageStatusSubject.asObservable();
  reaction$ = this.reactionSubject.asObservable();
  unreadUpdate$ = this.unreadUpdateSubject.asObservable();
  newConversation$ = this.newConversationSubject.asObservable();
  conversationUpdate$ = this.conversationUpdateSubject.asObservable();
  participantRemoved$ = this.participantRemovedSubject.asObservable();
  storyView$ = this.storyViewSubject.asObservable();

  constructor(
    private tokenService: TokenService,
    private presenceService: PresenceService,
    private typingIndicatorService: TypingIndicatorService,
    private callService: CallService,
    private cryptoService: CryptoService
  ) { console.log("Constructing Websocket Service..."); }

  connect(): void {
    const token = this.tokenService.getAccessToken();
    const userId = this.tokenService.getUserId();

    if (!token || !userId) return;

    const initStomp = (wsToken: string) => {
      const socket = new SockJS(`${environment.wsUrl}/stomp?token=${encodeURIComponent(wsToken)}`);

      this.stompClient = new Client({
        webSocketFactory: () => socket as any,
        reconnectDelay: 5000
      });

      this.stompClient.onConnect = () => {
        this.stompClient?.subscribe(`/queue/messages/${userId}`, (message: IMessage) => {
          this.messageSubject.next(JSON.parse(message.body));
        });
        this.stompClient?.subscribe(`/user/queue/message-status`, (message: IMessage) => {
          this.messageStatusSubject.next(JSON.parse(message.body));
        });
        this.stompClient?.subscribe(`/user/queue/unread-update`, (message: IMessage) => {
          this.unreadUpdateSubject.next(JSON.parse(message.body));
        });
        this.stompClient?.subscribe(`/user/queue/new-conversation`, (message: IMessage) => {
          this.newConversationSubject.next(JSON.parse(message.body));
        });
        this.stompClient?.subscribe(`/user/queue/conversation-update`, (message: IMessage) => {
          const payload = JSON.parse(message.body);
          if (payload.event === 'PARTICIPANT_REMOVED') {
            this.participantRemovedSubject.next({
              conversationId: payload.conversationId,
              removedUserId: payload.removedUserId,
              removedByUserId: payload.removedByUserId,
              removedByName: payload.removedByName || 'Admin',
              removedAt: payload.removedAt || new Date().toISOString()
            });
          }
          this.conversationUpdateSubject.next(payload);
        });
        this.stompClient?.subscribe(`/user/queue/story-views`, (message: IMessage) => {
          this.storyViewSubject.next(JSON.parse(message.body));
        });
        this.presenceService.initialize(this.stompClient!);
        this.typingIndicatorService.initialize(this.stompClient!, parseInt(userId));
        this.callService.initialize(this.stompClient!);
      };

      this.stompClient.activate();
    };

    if (this.cryptoService.isEnabled()) {
      this.cryptoService.encrypt(token).then(encrypted => initStomp(encrypted));
    } else {
      initStomp(token);
    }
  }

  sendReaction(conversationId: number, messageId: number, emoji: string, action: 'add' | 'remove', attachmentId?: number | null): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.reaction',
        body: JSON.stringify({ messageId, conversationId, emoji, action, attachmentId: attachmentId ?? null })
      });
    }
  }

  markConversationAsRead(conversationId: number): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.read',
        body: JSON.stringify({ conversationId })
      });
    }
  }

  publishStatus(messageId: number, conversationId: number, status: 'DELIVERED' | 'READ'): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.status',
        body: JSON.stringify({ messageId, conversationId, status })
      });
    }
  }

  sendMessage(conversationId: number, message: ChatMessage): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.message',
        body: JSON.stringify(message),
        headers: { 'conversationId': conversationId.toString() }
      });
    }
  }

  private subscribedConversations = new Set<number>();

  subscribeToConversation(conversationId: number): void {
    if (!this.stompClient?.connected || this.subscribedConversations.has(conversationId)) return;
    this.subscribedConversations.add(conversationId);
    this.stompClient.subscribe(`/user/queue/conversation/${conversationId}`, (message: IMessage) => {
      const parsed = JSON.parse(message.body);
      parsed.conversationId = conversationId;
      this.messageSubject.next(parsed);
    });
    this.stompClient.subscribe(`/user/queue/reaction/${conversationId}`, (message: IMessage) => {
      this.reactionSubject.next(JSON.parse(message.body));
    });
  }

  disconnect(): void {
    if (this.stompClient?.connected) {
      this.presenceService.goOffline();
      this.subscribedConversations.clear();
      setTimeout(() => {
        this.presenceService.destroy();
        this.stompClient?.deactivate();
      }, 200);
    }
  }
}