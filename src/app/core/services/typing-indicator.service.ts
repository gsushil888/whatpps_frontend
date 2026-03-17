import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';

export interface TypingStatus {
  userId: number;
  conversationId: number;
  action: 'start' | 'stop';
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class TypingIndicatorService {
  private typingUsersSubject = new BehaviorSubject<Map<number, Set<number>>>(new Map());
  typingUsers$ = this.typingUsersSubject.asObservable();

  private stompClient: Client | null = null;
  private currentUserId: number | null = null;
  private typingTimeout: any = null;

  initialize(stompClient: Client, currentUserId: number) {
    this.stompClient = stompClient;
    this.currentUserId = currentUserId;
  }

  subscribeToConversation(conversationId: number) {
    if (this.stompClient) {
      this.stompClient.subscribe(`/topic/conversation/${conversationId}/typing`, (message) => {
        const typing: TypingStatus = JSON.parse(message.body);
        if (typing.userId !== this.currentUserId) {
          this.handleTypingUpdate(typing);
        }
      });
    }
  }

  startTyping(conversationId: number) {
    this.sendTypingIndicator(conversationId, 'start');
    
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, 3000);
  }

  stopTyping(conversationId: number) {
    this.sendTypingIndicator(conversationId, 'stop');
    clearTimeout(this.typingTimeout);
  }

  private sendTypingIndicator(conversationId: number, action: 'start' | 'stop') {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify({ conversationId, action })
      });
    }
  }

  private handleTypingUpdate(typing: TypingStatus) {
    const currentMap = this.typingUsersSubject.value;
    
    if (!currentMap.has(typing.conversationId)) {
      currentMap.set(typing.conversationId, new Set());
    }
    
    const typingUsers = currentMap.get(typing.conversationId)!;
    
    if (typing.action === 'start') {
      typingUsers.add(typing.userId);
    } else {
      typingUsers.delete(typing.userId);
    }
    
    this.typingUsersSubject.next(new Map(currentMap));
  }

  getTypingUsers(conversationId: number): Set<number> {
    return this.typingUsersSubject.value.get(conversationId) || new Set();
  }

  isAnyoneTyping(conversationId: number): boolean {
    return this.getTypingUsers(conversationId).size > 0;
  }

  getTypingText(conversationId: number): string {
    const count = this.getTypingUsers(conversationId).size;
    if (count === 0) return '';
    if (count === 1) return 'typing...';
    return `${count} people typing...`;
  }

  destroy() {
    clearTimeout(this.typingTimeout);
    this.stompClient = null;
  }
}
