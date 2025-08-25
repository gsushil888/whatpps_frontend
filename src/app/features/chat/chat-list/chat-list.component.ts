import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chat, ChatService } from '../services/chat.service';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.component.html'
})
export class ChatListComponent implements OnInit, OnDestroy {
  chats: Chat[] = [];
  selectedChatId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private chatService: ChatService) { }

  ngOnInit(): void {
    this.chatService.chats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(chats => {
      this.chats = chats;
    });

    this.chatService.selectedChatId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(chatId => {
      this.selectedChatId = chatId;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectChat(chatId: string) {
    this.chatService.selectChat(chatId);
  }
}
