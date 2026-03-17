import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { PresenceService } from 'src/app/core/services/presence.service';
import { TypingIndicatorService } from 'src/app/core/services/typing-indicator.service';
import { TokenService } from 'src/app/core/services/token.service';
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

  message$ = this.messageSubject.asObservable();

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
      this.presenceService.initialize(this.stompClient!);
      this.typingIndicatorService.initialize(this.stompClient!, parseInt(userId));
    };

    this.stompClient.activate();
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
      this.stompClient.subscribe(`/topic/conversation/${conversationId}`, (message: IMessage) => {
        this.messageSubject.next(JSON.parse(message.body));
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