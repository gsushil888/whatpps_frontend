import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Subject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { PresenceService } from 'src/app/core/services/presence.service';
import { TokenService } from 'src/app/core/services/token.service';
import { TypingIndicatorService } from 'src/app/core/services/typing-indicator.service';
import { environment } from 'src/environments/environment';

export interface ChatMessage {
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  mediaMetadata?: any;
  replyToMessageId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private messageSubject = new BehaviorSubject<any>(null);
  private messageStatusSubject = new Subject<{ messageId: number; conversationId: number; status: string }>();
  private reactionSubject = new Subject<{ messageId: number; conversationId: number; emoji: string; action: string; reactorId: number; reactorName: string }>();
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

  message$ = this.messageSubject.asObservable();
  messageStatus$ = this.messageStatusSubject.asObservable();
  reaction$ = this.reactionSubject.asObservable();
  unreadUpdate$ = this.unreadUpdateSubject.asObservable();
  newConversation$ = this.newConversationSubject.asObservable();
  conversationUpdate$ = this.conversationUpdateSubject.asObservable();

  constructor(
    private tokenService: TokenService,
    private presenceService: PresenceService,
    private typingIndicatorService: TypingIndicatorService
  ) { }

  connect(): void {
    const token = this.tokenService.getAccessToken();
    const userId = this.tokenService.getUserId();

    if (!token || !userId) return;

    const socket = new SockJS(`${environment.wsUrl}/stomp?token=${token}`);

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
        this.conversationUpdateSubject.next(JSON.parse(message.body));
      });
      this.presenceService.initialize(this.stompClient!);
      this.typingIndicatorService.initialize(this.stompClient!, parseInt(userId));
    };

    this.stompClient.activate();
  }

  sendReaction(conversationId: number, messageId: number, emoji: string, action: 'add' | 'remove'): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.reaction',
        body: JSON.stringify({ messageId, conversationId, emoji, action })
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

  subscribeToConversation(conversationId: number): void {
    if (this.stompClient?.connected) {
      this.stompClient.subscribe(`/user/queue/conversation/${conversationId}`, (message: IMessage) => {
        const parsed = JSON.parse(message.body);
        parsed.conversationId = conversationId;
        this.messageSubject.next(parsed);
      });
      this.stompClient.subscribe(`/user/queue/reaction/${conversationId}`, (message: IMessage) => {
        this.reactionSubject.next(JSON.parse(message.body));
      });
    }
  }

  disconnect(): void {
    if (this.stompClient?.connected) {
      this.presenceService.destroy();
      // Give time for presence update before disconnecting
      setTimeout(() => {
        this.stompClient?.deactivate();
      }, 200);
    }
  }
}