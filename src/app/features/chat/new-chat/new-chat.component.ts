import { Component, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { ContactService, Contact } from '../services/contact.service';
import { ConversationService } from '../services/conversation.service';

@Component({
  selector: 'app-new-chat',
  templateUrl: './new-chat.component.html'
})
export class NewChatComponent implements OnInit {
  searchTerm: string = '';
  contacts: Contact[] = [];
  showAddContactForm: boolean = false;
  newContactPhone: string = '';
  newContactName: string = '';
  isAddingContact: boolean = false;

  constructor(
    private chatService: ChatService,
    private contactService: ContactService,
    private conversationService: ConversationService
  ) {}

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

  closeNewChatView() {
    this.chatService.toggleNewChatView(false);
    this.searchTerm = '';
  }

  openNewGroup() {
    alert('New group feature coming soon!');
  }

  openNewContact() {
    this.showAddContactForm = true;
  }

  closeAddContactForm() {
    this.showAddContactForm = false;
    this.newContactPhone = '';
    this.newContactName = '';
  }

  addContact() {
    if (!this.newContactPhone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    this.isAddingContact = true;
    const request = {
      phoneNumber: this.newContactPhone,
      displayName: this.newContactName || undefined
    };

    this.contactService.addContact(request).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Contact added successfully!');
          this.loadContacts();
          this.closeAddContactForm();
        }
        this.isAddingContact = false;
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add contact');
        this.isAddingContact = false;
      }
    });
  }

  startChatWithContact(contact: Contact) {
    // Always call API - backend will return existing or create new
    const request = {
      type: 'INDIVIDUAL' as const,
      participantId: contact.contactUserId
    };

    this.conversationService.createConversation(request).subscribe({
      next: (response) => {
        if (response.success) {
          const conversationId = response.data.id.toString();
          
          // Check if already in chat list
          const existingChat = this.chatService.findChatById(response.data.id);
          
          if (!existingChat) {
            // Add to chat list
            const newChat = {
              id: conversationId,
              name: response.data.title,
              avatar: response.data.profileImageUrl || 'assets/google.svg',
              date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }),
              time: 'now',
              lastMessage: response.data.lastMessage?.content || '',
              unreadCount: response.data.unreadCount || 0,
              type: response.data.type
            };
            this.chatService.addNewChat(newChat);
          }
          
          // Select and open chat
          this.chatService.selectChat(conversationId);
          this.closeNewChatView();
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to open conversation');
      }
    });
  }
}
