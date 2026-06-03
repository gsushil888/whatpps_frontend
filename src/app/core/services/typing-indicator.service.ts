import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';

export interface TypingStatus {
  userId: number;
  displayName: string;
  mobileNumber: string;
  isContact: boolean;
  conversationId: number;
  action: 'start' | 'stop';
  timestamp: number;
}

export interface TypingUser {
  displayName: string;
  mobileNumber: string;
  isContact: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TypingIndicatorService {
  // conversationId -> Map<userId, TypingUser>
  private typingUsersSubject = new BehaviorSubject<Map<number, Map<number, TypingUser>>>(new Map());
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
      this.stompClient.subscribe(`/user/queue/conversation/${conversationId}/typing`, (message) => {
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
      currentMap.set(typing.conversationId, new Map());
    }

    const typingUsers = currentMap.get(typing.conversationId)!;

    if (typing.action === 'start') {
      typingUsers.set(typing.userId, { displayName: typing.displayName, mobileNumber: typing.mobileNumber, isContact: typing.isContact });
    } else {
      typingUsers.delete(typing.userId);
    }

    this.typingUsersSubject.next(new Map(currentMap));
  }

  getTypingUsers(conversationId: number): Map<number, TypingUser> {
    return this.typingUsersSubject.value.get(conversationId) || new Map();
  }

  isAnyoneTyping(conversationId: number): boolean {
    return this.getTypingUsers(conversationId).size > 0;
  }

  private getLabel(user: TypingUser): string {
    return user.isContact ? user.displayName : user.mobileNumber;
  }

  getTypingText(conversationId: number): string {
    const users = this.getTypingUsers(conversationId);
    const list = Array.from(users.values());
    if (list.length === 0) return '';
    if (list.length === 1) return `${this.getLabel(list[0])} is typing...`;
    if (list.length === 2) return `${this.getLabel(list[0])} and ${this.getLabel(list[1])} are typing...`;
    return `${this.getLabel(list[0])} and ${list.length - 1} others are typing...`;
  }

  getTypingList(conversationId: number): TypingUser[] {
    return Array.from(this.getTypingUsers(conversationId).values());
  }

  destroy() {
    clearTimeout(this.typingTimeout);
    this.stompClient = null;
  }
}
