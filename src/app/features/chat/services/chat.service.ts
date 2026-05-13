import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TokenService } from 'src/app/core/services/token.service';
import { Conversation, ConversationService } from './conversation.service';

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  date: string;
  time: string;
  lastMessage: string;
  lastMessageType?: string;
  lastMessageSenderId?: number;
  lastMessageSenderName?: string;
  unreadCount: number;
  type?: string;
  isOnline?: boolean | null;
  lastActiveAt?: string | null;
  otherUserId?: number;
  lastMessageAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private selectedChatIdSubject = new BehaviorSubject<string | null>(null);
  selectedChatId$ = this.selectedChatIdSubject.asObservable();

  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  chats$ = this.chatsSubject.asObservable();

  private activeFilterSubject = new BehaviorSubject<string>('all');
  activeFilter$ = this.activeFilterSubject.asObservable();

  private showNewChatViewSubject = new BehaviorSubject<boolean>(false);
  showNewChatView$ = this.showNewChatViewSubject.asObservable();

  constructor(private conversationService: ConversationService, private tokenService: TokenService) { }

  initializeConversations() {
    this.loadConversations();
  }

  clearConversations() {
    this.chatsSubject.next([]);
    this.selectedChatIdSubject.next(null);
  }

  private sortByLatest(chats: Chat[]): Chat[] {
    return [...chats].sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });
  }

  private loadConversations(filter?: string) {
    this.conversationService.getConversations(20, 0, filter).subscribe({
      next: (response) => {
        console.log('Conversations loaded:', response);
        if (response.success) {
          const chats = response.data.conversations.map(conv => this.mapConversationToChat(conv));
          this.chatsSubject.next(this.sortByLatest(chats));
        }
      },
      error: (err) => console.error('Error loading conversations:', err)
    });
  }

  loadConversationsByFilter(filter: string) {
    this.activeFilterSubject.next(filter);
    this.selectedChatIdSubject.next(null); // Clear selection when filter changes
    this.loadConversations(filter);
  }

  private mapConversationToChat(conversation: Conversation): Chat {
    const timestamp = conversation.lastMessage?.timestamp || conversation.lastMessageAt;
    const currentUserId = parseInt(this.tokenService.getUserId() || '0');

    // For individual chats, get the other user's ID
    let otherUserId: number | undefined;
    if (conversation.type === 'INDIVIDUAL') {
      // Try participants array first
      if (conversation.participants && conversation.participants.length > 0) {
        otherUserId = conversation.participants.find(p => p.userId !== currentUserId)?.userId;
      }
      // Fallback: if last message sender is not current user, use that
      if (!otherUserId && conversation.lastMessage?.sender?.id && conversation.lastMessage.sender.id !== currentUserId) {
        otherUserId = conversation.lastMessage.sender.id;
      }
      // Fallback: if current user sent last message, try to extract from mobileNumber or title
      if (!otherUserId && conversation.mobileNumber) {
        // Backend should provide otherUserId, but as fallback we mark it for lazy loading
        otherUserId = undefined;
      }
    }

    return {
      id: conversation.id.toString(),
      name: conversation.title,
      avatar: conversation.profileImageUrl || 'assets/google.svg',
      date: timestamp ? this.formatDate(timestamp) : '',
      time: timestamp ? this.formatTime(timestamp) : '',
      lastMessage: conversation.lastMessage?.content || '',
      lastMessageType: conversation.lastMessage?.type || 'TEXT',
      lastMessageSenderId: conversation.lastMessage?.sender?.id,
      lastMessageSenderName: conversation.lastMessage?.sender?.displayName,
      unreadCount: conversation.unreadCount || 0,
      type: conversation.type,
      isOnline: conversation.isOnline,
      lastActiveAt: conversation.lastActiveAt,
      otherUserId: otherUserId,
      lastMessageAt: conversation.lastMessage?.timestamp || conversation.lastMessageAt || null
    };
  }

  private formatDate(timestamp: string): string {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  selectChat(chatId: string) {
    this.selectedChatIdSubject.next(chatId);
  }

  clearSelection() {
    this.selectedChatIdSubject.next(null);
  }

  addNewChat(chat: Chat) {
    const currentChats = this.chatsSubject.value;
    const existingChat = currentChats.find(c => c.id === chat.id);
    if (!existingChat) {
      this.chatsSubject.next(this.sortByLatest([chat, ...currentChats]));
    }
  }

  getCurrentChatId(): string | null {
    return this.selectedChatIdSubject.value;
  }

  toggleNewChatView(show: boolean) {
    this.showNewChatViewSubject.next(show);
  }

  findChatByUserId(userId: number): Chat | undefined {
    // Check all chats to find one with matching participant
    // Since we don't store participant IDs in Chat interface, we need to check by conversation ID
    // For now, just return undefined to always create/fetch from backend
    return undefined;
  }

  findChatById(conversationId: number): Chat | undefined {
    return this.chatsSubject.value.find(chat => chat.id === conversationId.toString());
  }

  updateChatLastMessage(chatId: string, lastMessage: string, lastMessageType: string, timestamp: string, senderId?: number, senderName?: string) {
    const chats = this.chatsSubject.value.map(c =>
      c.id === chatId
        ? { ...c, lastMessage, lastMessageType, lastMessageSenderId: senderId, lastMessageSenderName: senderName, lastMessageAt: timestamp, date: this.formatDate(timestamp), time: this.formatTime(timestamp) }
        : c
    );
    this.chatsSubject.next(this.sortByLatest(chats));
  }

  updateChatFromUnreadEvent(
    conversationId: number,
    lastMessage: { content: string; messageType: string; timestamp: string; senderId?: number; senderName?: string },
    incrementUnread: boolean
  ) {
    const id = conversationId.toString();
    const chats = this.chatsSubject.value.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        lastMessage: lastMessage.content,
        lastMessageType: lastMessage.messageType,
        lastMessageSenderId: lastMessage.senderId,
        lastMessageSenderName: lastMessage.senderName,
        lastMessageAt: lastMessage.timestamp,
        date: this.formatDate(lastMessage.timestamp),
        time: this.formatTime(lastMessage.timestamp),
        unreadCount: incrementUnread ? (c.unreadCount || 0) + 1 : c.unreadCount
      };
    });
    this.chatsSubject.next(this.sortByLatest(chats));
  }

  incrementUnreadCount(conversationId: number) {
    const chats = this.chatsSubject.value.map(c =>
      c.id === conversationId.toString()
        ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
        : c
    );
    this.chatsSubject.next(chats);
  }

  clearUnreadCount(conversationId: number) {
    const chats = this.chatsSubject.value.map(c =>
      c.id === conversationId.toString() ? { ...c, unreadCount: 0 } : c
    );
    this.chatsSubject.next(chats);
  }

  removeChat(chatId: string) {
    const currentChats = this.chatsSubject.value;
    const updatedChats = currentChats.filter(chat => chat.id !== chatId);
    this.chatsSubject.next(updatedChats);
  }

}