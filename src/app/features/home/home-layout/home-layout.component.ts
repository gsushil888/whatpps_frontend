import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ChatService } from '../../chat/services/chat.service';
import { WebSocketService } from '../../chat/services/websocket.service';

@Component({
  selector: 'app-home-layout',
  templateUrl: './home-layout.component.html',
  styleUrls: ['./home-layout.component.css'],
})
export class HomeLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  showBottomNav = true;
  selectedChatId: string | null = null;

  constructor(
    private router: Router,
    private chatService: ChatService,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    this.webSocketService.connect();

    this.chatService.selectedChatId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        this.selectedChatId = id;
        this.updateBottomNav();
      });

    this.router.events.pipe(takeUntil(this.destroy$)).subscribe(e => {
      if (e instanceof NavigationEnd) this.updateBottomNav();
    });
  }

  private updateBottomNav() {
    const url = this.router.url;
    const inChat = url.includes('/chat') && !!this.selectedChatId;
    const inDetail = url.includes('/status') || url.includes('/call');
    this.showBottomNav = !(inChat || inDetail);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.webSocketService.disconnect();
  }
}
