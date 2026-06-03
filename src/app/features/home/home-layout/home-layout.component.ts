import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CallService } from '../../call/services/call.service';
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
  isCallsRoute = false;

  constructor(
    private router: Router,
    private chatService: ChatService,
    private webSocketService: WebSocketService,
    public callService: CallService
  ) { }

  ngOnInit(): void {
    console.log("Home layout constructing....")
    console.log("Connecting to Websocket...")

    this.webSocketService.connect();
    this.updateBottomNav();

    this.chatService.selectedChatId$
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => {
        console.log("Selected Conversation Id in Home layout => ", id)
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
    this.isCallsRoute = url.includes('/call');
    this.showBottomNav = !(inChat || inDetail);
  }

  @HostListener('window:beforeunload')
  onBeforeUnload() {
    this.webSocketService.disconnect();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.webSocketService.disconnect();
  }
}
