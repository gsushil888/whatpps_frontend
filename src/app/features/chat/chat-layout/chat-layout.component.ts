import { Component, OnInit } from '@angular/core';
import { ChatService } from '../services/chat.service';
import { UserService } from '../services/user.service';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-chat-layout',
  templateUrl: './chat-layout.component.html',
  styleUrls: ['./chat-layout.component.css']
})
export class ChatLayoutComponent implements OnInit {
  showNewChatView = false;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit() {
    this.chatService.initializeConversations();
    this.userService.loadCurrentUser().subscribe();
    this.webSocketService.connect();

    this.chatService.showNewChatView$.subscribe(show => {
      this.showNewChatView = show;
    });
  }

  ngOnDestroy() {
    this.webSocketService.disconnect();
  }
}