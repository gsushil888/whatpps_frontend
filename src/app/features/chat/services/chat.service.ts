import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  time: string;
  lastMessage: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private selectedChatIdSubject = new BehaviorSubject<string | null>(null);
  selectedChatId$ = this.selectedChatIdSubject.asObservable();

  private chatsSubject = new BehaviorSubject<Chat[]>([
    { id: '1', name: 'John Doe', avatar: 'assets/google.svg', time: '12:45', lastMessage: 'Hey, how are you?' },
    { id: '2', name: 'Jane Smith', avatar: 'assets/google.svg', time: '11:20', lastMessage: 'See you soon!' }
  ]);
  chats$ = this.chatsSubject.asObservable();

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
}