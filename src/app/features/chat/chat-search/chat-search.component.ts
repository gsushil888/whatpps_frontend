import { Component } from '@angular/core';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chat-search',
  templateUrl: './chat-search.component.html',
})
export class ChatSearchComponent {
  searchTerm: string = '';
  showContacts: boolean = false;

  contacts = [
    { id: 'c1', name: 'Alice Johnson', phone: '+1 234 567 8901', avatar: 'assets/google.svg' },
    { id: 'c2', name: 'Bob Wilson', phone: '+1 234 567 8902', avatar: 'assets/google.svg' },
    { id: 'c3', name: 'Carol Brown', phone: '+1 234 567 8903', avatar: 'assets/google.svg' },
    { id: 'c4', name: 'David Miller', phone: '+1 234 567 8904', avatar: 'assets/google.svg' }
  ];

  constructor(private chatService: ChatService) { }

  get filteredContacts() {
    if (!this.searchTerm) return this.contacts;
    return this.contacts.filter(contact =>
      contact.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      contact.phone.includes(this.searchTerm)
    );
  }

  onSearch() {
    this.showContacts = this.searchTerm.length > 0;
  }

  hideContacts() {
    setTimeout(() => this.showContacts = false, 200);
  }

  startChatWithContact(contact: any) {
    const newChat = {
      id: `chat_${contact.id}`,
      name: contact.name,
      avatar: contact.avatar,
      time: 'now',
      lastMessage: 'Say hello!'
    };

    this.chatService.addNewChat(newChat);
    this.chatService.selectChat(newChat.id);
    this.searchTerm = '';
    this.showContacts = false;
  }
}
