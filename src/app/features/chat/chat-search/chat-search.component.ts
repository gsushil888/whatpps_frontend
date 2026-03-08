import { Component, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { ContactService, Contact, AddContactRequest } from '../services/contact.service';
import { Router } from '@angular/router';
import { TokenService } from 'src/app/core/services/token.service';

@Component({
  selector: 'app-chat-search',
  templateUrl: './chat-search.component.html',
})
export class ChatSearchComponent implements OnInit {
  searchTerm: string = '';
  showContacts: boolean = false;
  showMenu: boolean = false;
  showNewChatView: boolean = false;
  showAddContactModal: boolean = false;
  contacts: Contact[] = [];
  newContactPhone: string = '';
  newContactName: string = '';
  isAddingContact: boolean = false;

  constructor(
    private chatService: ChatService,
    private contactService: ContactService,
    private router: Router,
    private tokenService: TokenService
  ) { }

  ngOnInit(): void {
    this.loadContacts();
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
    this.showContacts = this.searchTerm.length > 0;
  }

  onSearchFocus() {
    this.showMenu = false;
    this.showContacts = true;
  }

  hideContacts() {
    setTimeout(() => this.showContacts = false, 200);
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
