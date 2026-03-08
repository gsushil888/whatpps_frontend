import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chat, ChatService } from '../services/chat.service';
import { Contact, ContactService } from '../services/contact.service';
import { ConversationService } from '../services/conversation.service';
import { PresenceService } from 'src/app/core/services/presence.service';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html'
})
export class ChatListComponent implements OnInit, OnDestroy {
  chats: Chat[] = [];
  contacts: Contact[] = [];
  selectedChatId: string | null = null;
  private destroy$ = new Subject<void>();
  filters = ['All', 'Favourite', 'Archived'];
  activeFilter = 'All';
  showContacts = false;

  constructor(
    private chatService: ChatService,
    private contactService: ContactService,
    private conversationService: ConversationService,
    private presenceService: PresenceService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.chatService.chats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(chats => {
      this.chats = chats;
      console.log('Chats loaded:', this.chats);
    });

    this.chatService.selectedChatId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(chatId => {
      this.selectedChatId = chatId;
    });

    // Subscribe to presence updates for real-time status
    this.presenceService.presence$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(presenceMap => {
      console.log('Presence update:', presenceMap);
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectChat(chatId: string) {
    this.chatService.selectChat(chatId);
  }

  selectFilter(filter: string) {
    this.activeFilter = filter;
    this.showContacts = false;
    const filterMap: { [key: string]: string } = {
      'All': 'all',
      'Favourite': 'favorite',
      'Archived': 'archived'
    };
    this.chatService.loadConversationsByFilter(filterMap[filter]);
  }

  showContactsList() {
    this.showContacts = true;
    this.activeFilter = '';
    this.loadContacts();
  }

  loadContacts() {
    this.contactService.getContacts().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.contacts = response.data.contacts;
        }
      },
      error: (err) => console.error('Error loading contacts:', err)
    });
  }

  selectContact(contact: Contact) {
    const request = {
      type: 'INDIVIDUAL' as const,
      participantId: contact.contactUserId
    };

    this.conversationService.createConversation(request).subscribe({
      next: (response) => {
        if (response.success) {
          const conversationId = response.data.id.toString();
          
          const existingChat = this.chatService.findChatById(response.data.id);
          
          if (!existingChat) {
            const newChat = {
              id: conversationId,
              name: response.data.title,
              avatar: response.data.profileImageUrl || 'assets/google.svg',
              date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
              time: 'now',
              lastMessage: response.data.lastMessage?.content || '',
              lastMessageType: response.data.lastMessage?.type || 'TEXT',
              unreadCount: response.data.unreadCount || 0,
              type: response.data.type
            };
            this.chatService.addNewChat(newChat);
          }
          
          this.chatService.selectChat(conversationId);
          this.showContacts = false;
          this.activeFilter = 'All';
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to open conversation');
      }
    });
  }

  getMediaTypeLabel(messageType: string): string {
    switch (messageType) {
      case 'IMAGE': return '📷 Photo';
      case 'VIDEO': return '🎥 Video';
      case 'AUDIO': return '🎵 Audio';
      case 'DOCUMENT': return '📄 Document';
      default: return '';
    }
  }

  isUserOnline(chat: Chat): boolean {
    if (chat.type === 'GROUP') return false;
    
    // Check WebSocket presence first, fallback to API data
    if (chat.otherUserId) {
      const presence = this.presenceService.getUserPresence(chat.otherUserId);
      if (presence) {
        return presence.status === 'ONLINE';
      }
    }
    
    // Fallback to static API data
    return chat.isOnline === true;
  }

  getLastSeenText(chat: Chat): string {
    if (chat.type === 'GROUP') return '';
    
    // Check WebSocket presence first, fallback to API data
    if (chat.otherUserId) {
      const presence = this.presenceService.getUserPresence(chat.otherUserId);
      if (presence) {
        if (presence.status === 'ONLINE') return 'online';
        return this.presenceService.getLastSeen(chat.otherUserId);
      }
    }
    
    // Fallback to static API data
    if (chat.isOnline) return 'online';
    if (!chat.lastActiveAt) return '';
    
    const lastActive = new Date(chat.lastActiveAt);
    if (isNaN(lastActive.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'last seen just now';
    if (diffMins < 60) return `last seen ${diffMins} minutes ago`;
    if (diffMins < 1440) return `last seen ${Math.floor(diffMins / 60)} hours ago`;
    return `last seen ${Math.floor(diffMins / 1440)} days ago`;
  }
}
