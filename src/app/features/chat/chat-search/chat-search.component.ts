import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { AddContactRequest, Contact } from 'src/app/core/models/contact.model';
import { TokenService } from 'src/app/core/services/token.service';
import { ChatService } from '../services/chat.service';
import { ContactService } from '../services/contact.service';
import { ConversationService } from '../services/conversation.service';
import { SearchContact, SearchResult, SearchService } from '../services/search.service';

@Component({
  selector: 'app-chat-search',
  templateUrl: './chat-search.component.html',
})
export class ChatSearchComponent implements OnInit, OnDestroy {
  searchTerm: string = '';
  showContacts: boolean = false;
  showMenu: boolean = false;
  showNewChatView: boolean = false;
  showAddContactModal: boolean = false;
  contacts: Contact[] = [];
  newContactPhone: string = '';
  newContactName: string = '';
  isAddingContact: boolean = false;

  // Global search
  showGlobalSearch = false;
  globalQuery = '';
  isSearching = false;
  searchResults: SearchResult | null = null;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  @ViewChild('globalSearchInput') globalSearchInput!: ElementRef<HTMLInputElement>;

  get hasResults(): boolean {
    if (!this.searchResults) return false;
    return (
      (this.searchResults.contacts?.length || 0) +
      (this.searchResults.conversations?.length || 0) +
      (this.searchResults.messages?.length || 0) +
      (this.searchResults.users?.length || 0)
    ) > 0;
  }

  constructor(
    private chatService: ChatService,
    private contactService: ContactService,
    private conversationService: ConversationService,
    private searchService: SearchService,
    private router: Router,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    console.log("ChatSearch constructed...");

    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q.trim()) { this.searchResults = null; this.isSearching = false; return []; }
        this.isSearching = true;
        return this.searchService.search(q);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => { this.searchResults = res?.data || null; this.isSearching = false; },
      error: () => { this.isSearching = false; }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContacts(): void {
    this.contactService.getContacts().subscribe({
      next: (response) => {
        if (response.success) {
          this.contacts = response.data.contacts.sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
          );
        }
      },
      error: (err) => console.error('Error loading contacts:', err)
    });
  }

  get filteredContacts() {
    if (!this.searchTerm) return this.contacts;
    return this.contacts.filter(contact =>
      contact.displayName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      contact.phoneNumber.includes(this.searchTerm)
    );
  }

  get groupedContacts() {
    const grouped: { [key: string]: Contact[] } = {};
    this.filteredContacts.forEach(contact => {
      const firstLetter = contact.displayName[0].toUpperCase();
      if (!grouped[firstLetter]) grouped[firstLetter] = [];
      grouped[firstLetter].push(contact);
    });
    return Object.keys(grouped).sort().map(letter => ({ letter, contacts: grouped[letter] }));
  }

  onSearch() {
    this.chatService.setListFilter(this.searchTerm);
  }

  clearSearch() {
    this.searchTerm = '';
    this.chatService.setListFilter('');
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  openNewChat() {
    this.showMenu = false;
    this.chatService.toggleNewChatView(true);
  }

  openNewGroup() {
    this.showMenu = false;
    alert('New group feature coming soon!');
  }

  openNewContact() {
    this.showMenu = false;
    this.showAddContactModal = true;
  }

  closeAddContactModal() {
    this.showAddContactModal = false;
    this.newContactPhone = '';
    this.newContactName = '';
  }

  addContact() {
    if (!this.newContactPhone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    this.isAddingContact = true;
    const request: AddContactRequest = {
      phoneNumber: this.newContactPhone,
      displayName: this.newContactName || undefined
    };

    this.contactService.addContact(request).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Contact added successfully!');
          this.loadContacts();
          this.closeAddContactModal();
        }
        this.isAddingContact = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add contact');
        this.isAddingContact = false;
      }
    });
  }

  openStarredMessages() {
    this.showMenu = false;
    alert('Starred messages feature coming soon!');
  }

  logout() {
    this.showMenu = false;
    this.tokenService.clearTokens();
    this.router.navigate(['/auth/login']);
  }

  openGlobalSearch() {
    this.showMenu = false;
    this.showGlobalSearch = true;
    this.globalQuery = '';
    this.searchResults = null;
    setTimeout(() => this.globalSearchInput?.nativeElement.focus(), 100);
  }

  closeGlobalSearch() {
    this.showGlobalSearch = false;
    this.globalQuery = '';
    this.searchResults = null;
  }

  clearGlobalSearch() {
    this.globalQuery = '';
    this.searchResults = null;
    this.globalSearchInput?.nativeElement.focus();
  }

  onGlobalSearch() {
    this.searchSubject.next(this.globalQuery);
  }

  openConversation(conversationId: number) {
    this.chatService.selectChat(conversationId.toString());
    this.closeGlobalSearch();
  }

  openConversationFromContact(contact: SearchContact) {
    this.conversationService.createConversation({ type: 'INDIVIDUAL', participantId: contact.contactUser.id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            const id = res.data.id.toString();
            if (!this.chatService.findChatById(res.data.id)) {
              this.chatService.addNewChat(this.chatService.mapConversation(res.data));
            }
            this.chatService.selectChat(id);
            this.closeGlobalSearch();
          }
        },
        error: (err) => alert(err.error?.message || 'Failed to open conversation')
      });
  }

  startChatWithContact(contact: Contact) {
    const newChat = {
      id: `chat_${contact.contactUserId}`,
      name: contact.displayName,
      avatar: contact.profilePictureUrl || 'assets/google.svg',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      time: 'now',
      lastMessage: 'Say hello!',
      unreadCount: 0
    };

    this.chatService.addNewChat(newChat);
    this.chatService.selectChat(newChat.id);
    this.searchTerm = '';
    this.showContacts = false;
    this.showNewChatView = false;
  }
}
