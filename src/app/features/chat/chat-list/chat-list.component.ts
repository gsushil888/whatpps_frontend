import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chat, ChatService } from '../services/chat.service';
import { Contact, ContactService } from '../services/contact.service';
import { ConversationService } from '../services/conversation.service';
import { PresenceService } from 'src/app/core/services/presence.service';
import { TokenService } from 'src/app/core/services/token.service';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html'
})
export class ChatListComponent implements OnInit, OnDestroy {
  chats: Chat[] = [];
  filteredChats: Chat[] = [];
  filteredContacts: Contact[] = [];
  listFilter = '';
  contacts: Contact[] = [];
  selectedChatId: string | null = null;
  currentUserId: number = 0;
  private destroy$ = new Subject<void>();
  filters = ['All', 'Favourite', 'Archived'];
  activeFilter = 'All';
  showContacts = false;
  showCreateGroup = false;
  selectedContacts: Contact[] = [];
  searchTerm = '';
  groupName = '';
  groupDescription = '';
  isCreatingGroup = false;
  createGroupStep: 'select' | 'details' = 'select';
  groupImageFile: File | null = null;
  groupImagePreview: string | null = null;
  selectedAvatarUrl: string | null = null;

  constructor(
    private chatService: ChatService,
    private contactService: ContactService,
    private conversationService: ConversationService,
    private presenceService: PresenceService,
    private tokenService: TokenService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentUserId = parseInt(this.tokenService.getUserId() || '0');

    this.chatService.chats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(chats => {
      this.chats = chats;
      this.applyFilter();
    });

    this.chatService.listFilter$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(term => {
      this.listFilter = term;
      this.applyFilter();
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

  applyFilter() {
    const q = this.listFilter.toLowerCase().trim();
    this.filteredChats = q
      ? this.chats.filter(c =>
          c.name.toLowerCase().includes(q) ||
          (c.lastMessage || '').toLowerCase().includes(q)
        )
      : this.chats;
    this.filteredContacts = q
      ? this.contacts.filter(c =>
          c.displayName.toLowerCase().includes(q) ||
          c.phoneNumber.includes(q)
        )
      : this.contacts;
  }

  selectChat(chatId: string) {
    this.chatService.selectChat(chatId);
  }

  openAvatarModal(avatarUrl: string, event: Event) {
    event.stopPropagation();
    this.selectedAvatarUrl = avatarUrl;
  }

  closeAvatarModal() {
    this.selectedAvatarUrl = null;
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
    this.showCreateGroup = false;
    this.activeFilter = '';
    this.loadContacts();
  }

  showCreateGroupView() {
    this.showCreateGroup = true;
    this.showContacts = false;
    this.activeFilter = '';
    this.createGroupStep = 'select';
    this.selectedContacts = [];
    this.searchTerm = '';
    this.groupName = '';
    this.groupDescription = '';
    this.loadContacts();
  }

  cancelCreateGroup() {
    this.showCreateGroup = false;
    this.selectedContacts = [];
    this.searchTerm = '';
    this.groupName = '';
    this.groupDescription = '';
    this.createGroupStep = 'select';
    this.groupImageFile = null;
    this.groupImagePreview = null;
  }

  loadContacts() {
    this.contactService.getContacts().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.contacts = response.data.contacts;
          this.applyFilter();
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
            this.chatService.addNewChat(this.chatService.mapConversation(response.data));
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
    if (chat.otherUserId) {
      const presence = this.presenceService.getUserPresence(chat.otherUserId);
      console.log('[ChatList] isUserOnline chat:', chat.id, 'otherUserId:', chat.otherUserId, 'presence:', presence);
      if (presence) return presence.status === 'ONLINE';
    }
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

  get filteredGroupContacts() {
    if (!this.searchTerm) return this.contacts;
    return this.contacts.filter(c =>
      c.displayName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      c.phoneNumber.includes(this.searchTerm)
    );
  }

  toggleContactSelection(contact: Contact) {
    const index = this.selectedContacts.findIndex(c => c.contactUserId === contact.contactUserId);
    if (index > -1) {
      this.selectedContacts.splice(index, 1);
    } else {
      this.selectedContacts.push(contact);
    }
  }

  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.contactUserId === contact.contactUserId);
  }

  removeSelectedContact(contact: Contact) {
    this.selectedContacts = this.selectedContacts.filter(c => c.contactUserId !== contact.contactUserId);
  }

  nextToGroupDetails() {
    if (this.selectedContacts.length > 0) {
      this.createGroupStep = 'details';
    }
  }

  backToSelectParticipants() {
    this.createGroupStep = 'select';
  }

  onGroupImageSelect(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.groupImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.groupImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  createGroup() {
    if (!this.groupName.trim() || this.selectedContacts.length === 0) return;

    this.isCreatingGroup = true;

    // If image selected, upload it first
    if (this.groupImageFile) {
      this.conversationService.uploadMedia(null, this.groupImageFile)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.createGroupWithImage(response.data.fileUrl);
            } else {
              this.isCreatingGroup = false;
              alert('Failed to upload group image');
            }
          },
          error: (err) => {
            console.error('Error uploading group image:', err);
            this.isCreatingGroup = false;
            alert('Failed to upload group image');
          }
        });
    } else {
      this.createGroupWithImage(undefined);
    }
  }

  private createGroupWithImage(imageUrl?: string) {
    const request = {
      type: 'GROUP' as const,
      participantIds: this.selectedContacts.map(c => c.contactUserId),
      title: this.groupName,
      description: this.groupDescription || undefined,
      groupPictureUrl: imageUrl
    };

    this.conversationService.createConversation(request).subscribe({
      next: (response) => {
        if (response.success) {
          const newChat = {
            id: response.data.id.toString(),
            name: response.data.title,
            avatar: response.data.profileImageUrl || 'assets/google.svg',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
            time: 'now',
            lastMessage: '',
            unreadCount: 0,
            type: 'GROUP'
          };
          this.chatService.addNewChat(newChat);
          this.chatService.selectChat(newChat.id);
          this.cancelCreateGroup();
        }
        this.isCreatingGroup = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to create group');
        this.isCreatingGroup = false;
      }
    });
  }
}
