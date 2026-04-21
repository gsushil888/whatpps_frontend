import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.css']
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  showNewChatView = false;
  selectedChatId: string | null = null;
  isMobile = window.innerWidth < 790;

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth < 790; }

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit() {
    this.chatService.initializeConversations();
    this.userService.loadCurrentUser().subscribe();
    this.webSocketService.connect();
    this.chatService.showNewChatView$.subscribe(show => { this.showNewChatView = show; });
    this.chatService.selectedChatId$.subscribe(id => { this.selectedChatId = id; });
  }

  clearSelection() { this.chatService.clearSelection(); }

  ngOnDestroy() { this.webSocketService.disconnect(); }
}