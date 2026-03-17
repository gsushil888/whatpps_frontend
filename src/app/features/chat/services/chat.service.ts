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
  unreadCount: number;
  type?: string;
  isOnline?: boolean | null;
  lastActiveAt?: string | null;
  otherUserId?: number;
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

  private loadConversations(filter?: string) {
    this.conversationService.getConversations(20, 0, filter).subscribe({
      next: (response) => {
        console.log('Conversations loaded:', response);
        if (response.success) {
          const chats = response.data.conversations.map(conv => this.mapConversationToChat(conv));
          this.chatsSubject.next(chats);

          // Lazy load otherUserId for chats that don't have it
          chats.forEach(chat => {
            if (chat.type === 'INDIVIDUAL' && !chat.otherUserId) {
              this.loadOtherUserId(chat.id);
            }
          });
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
      unreadCount: conversation.unreadCount || 0,
      type: conversation.type,
      isOnline: conversation.isOnline,
      lastActiveAt: conversation.lastActiveAt,
      otherUserId: otherUserId
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
      this.chatsSubject.next([chat, ...currentChats]);
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

  removeChat(chatId: string) {
    const currentChats = this.chatsSubject.value;
    const updatedChats = currentChats.filter(chat => chat.id !== chatId);
    this.chatsSubject.next(updatedChats);
  }

  private loadOtherUserId(conversationId: string) {
    this.conversationService.getConversationDetail(conversationId).subscribe({
      next: (response) => {
        if (response.success) {
          const currentUserId = parseInt(this.tokenService.getUserId() || '0');
          const otherUser = response.data.participants.find(p => p.userId !== currentUserId);

          if (otherUser) {
            const currentChats = this.chatsSubject.value;
            const updatedChats = currentChats.map(chat =>
              chat.id === conversationId ? { ...chat, otherUserId: otherUser.userId } : chat
            );
            this.chatsSubject.next(updatedChats);
          }
        }
      },
      error: (err) => console.error(`Error loading otherUserId for conversation ${conversationId}:`, err)
    });
  }
}