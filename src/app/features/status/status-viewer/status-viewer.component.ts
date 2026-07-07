import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { interval, Subject, Subscription } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { TokenService } from 'src/app/core/services/token.service';
import { StoryViewer } from '../../../core/models/story.model';
import { StatusService, StatusStory, StatusUpdate } from '../services/status.service';

@Component({
  selector: 'app-status-viewer',
  template: `
    <div *ngIf="currentStatus && currentStory; else noStatusSelected"
         class="flex flex-col h-full bg-black relative overflow-hidden">

      <!-- Progress Bars -->
      <div class="absolute top-2 left-2 right-2 z-20 flex gap-1">
        <div *ngFor="let story of currentStatus.stories; let i = index"
             class="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
          <div class="h-full bg-white rounded-full transition-all duration-100"
               [style.width]="getProgressWidth(i) + '%'"></div>
        </div>
      </div>

      <!-- Header -->
      <div class="absolute top-8 left-2 right-2 z-20 flex items-center justify-between text-white">
        <div class="flex items-center gap-3">
          <img [src]="currentStatus.avatar" class="w-8 h-8 rounded-full object-cover" alt="avatar" />
          <div>
            <h3 class="font-semibold text-sm">{{ currentStatus.name }}</h3>
            <p class="text-xs opacity-80">{{ getTimeAgo(currentStory.timestamp) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button *ngIf="isOwnStory" (click)="toggleViewers()" class="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-white/20 rounded-full transition-colors">
            <i class="fas fa-eye text-sm"></i>
            <span class="text-xs font-semibold">{{ viewCount }}</span>
          </button>
          <button (click)="pauseStory()" class="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <i [class]="isPlaying ? 'fas fa-pause' : 'fas fa-play'" class="text-sm"></i>
          </button>
          <button (click)="closeViewer()" class="p-1.5 hover:bg-white/20 rounded-full transition-colors">
            <i class="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>

      <!-- Story Content (fills space between header area and bottom bar) -->
      <div class="flex-1 flex items-center justify-center relative"
           (click)="nextStory()"
           (touchstart)="onTouchStart($event)"
           (touchend)="onTouchEnd()">

        <div class="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
             (click)="previousStory(); $event.stopPropagation()"></div>
        <div class="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer"></div>

        <!-- Image -->
        <div *ngIf="currentStory.type === 'image'" class="w-full h-full flex items-center justify-center">
          <img [src]="currentStory.content" class="max-w-full max-h-full object-contain" alt="status" />
        </div>

        <!-- Text -->
        <div *ngIf="currentStory.type === 'text'"
             class="w-full h-full flex items-center justify-center p-8"
             [style.backgroundColor]="currentStory.backgroundColor || '#1f2937'">
          <p class="text-2xl leading-relaxed break-words text-center"
             [class.font-bold]="currentStory.textStyle === 'BOLD'"
             [class.italic]="currentStory.textStyle === 'ITALIC'"
             [class.font-serif]="currentStory.textStyle === 'HANDWRITING'"
             [style.color]="currentStory.textColor || '#ffffff'">{{ currentStory.content }}</p>
        </div>

        <!-- Video -->
        <div *ngIf="currentStory.type === 'video'" class="w-full h-full flex items-center justify-center">
          <video [src]="currentStory.mediaUrl || currentStory.content"
                 [poster]="currentStory.thumbnailUrl || ''"
                 class="max-w-full max-h-full object-contain"
                 autoplay muted
                 (ended)="nextStory()"
                 (loadedmetadata)="onVideoLoaded($event)"></video>
        </div>

        <!-- Link -->
        <div *ngIf="currentStory.type === 'link'"
             class="w-full h-full flex items-center justify-center p-8 bg-gray-900">
          <a [href]="currentStory.linkUrl" target="_blank" rel="noopener"
             class="w-full max-w-sm rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl"
             (click)="$event.stopPropagation()">
            <img *ngIf="currentStory.linkPreviewImage" [src]="currentStory.linkPreviewImage" class="w-full h-36 object-cover" alt="preview" />
            <div class="p-3">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{{ currentStory.linkTitle }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{{ currentStory.linkDescription }}</p>
              <p class="text-xs text-blue-500 mt-1 truncate">{{ currentStory.linkUrl }}</p>
            </div>
          </a>
        </div>

        <!-- Navigation Arrows (Desktop) -->
        <div class="absolute left-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
          <button (click)="previousStory(); $event.stopPropagation()"
                  class="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  [disabled]="currentStoryIndex === 0">
            <i class="fas fa-chevron-left"></i>
          </button>
        </div>
        <div class="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden md:block">
          <button (click)="nextStory(); $event.stopPropagation()"
                  class="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  [disabled]="isLastStory()">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Viewers Modal (own stories only) — centered overlay -->
      <div *ngIf="showViewers && isOwnStory"
           class="absolute inset-0 z-40 flex items-end justify-center pb-16"
           (click)="toggleViewers()">
        <div class="bg-gray-900 rounded-2xl w-full max-w-sm mx-4 flex flex-col shadow-2xl"
             style="max-height: 50%"
             (click)="$event.stopPropagation()">
          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 shrink-0">
            <div class="w-10 h-1 bg-white/30 rounded-full"></div>
          </div>
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
            <div class="flex items-center gap-2 text-white">
              <i class="fas fa-eye text-sm opacity-70"></i>
              <span class="text-sm font-semibold">{{ viewCount }} view(s)</span>
            </div>
            <button (click)="toggleViewers()" class="text-white/50 hover:text-white p-1">
              <i class="fas fa-times text-sm"></i>
            </button>
          </div>
          <!-- List -->
          <div class="overflow-y-auto px-4 py-2">
            <div *ngIf="viewersLoading" class="flex justify-center py-6">
              <i class="fas fa-spinner fa-spin text-white/60 text-xl"></i>
            </div>
            <div *ngIf="!viewersLoading && viewers.length === 0" class="text-center text-white/40 text-sm py-6">
              No viewers yet
            </div>
            <div *ngFor="let v of viewers" class="flex items-center gap-3 py-2">
              <img [src]="v.viewerAvatar || 'assets/google.svg'" class="w-9 h-9 rounded-full object-cover shrink-0" alt="viewer" />
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm font-medium truncate">{{ v.viewerName }}</p>
                <p class="text-white/50 text-xs">{{ getTimeAgo(toDate(v.viewedAt)) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Reply Bar — always anchored at the very bottom in normal flow -->
      <div class="shrink-0 flex items-center gap-2 px-3 py-3 bg-black z-20">
        <div class="flex-1 flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
          <input type="text"
                 [placeholder]="'Reply to ' + currentStatus.name + '...'"
                 class="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
                 [(ngModel)]="replyText"
                 (keyup.enter)="sendReply()" />
        </div>
        <button (click)="sendReply()"
                class="p-2.5 bg-green-500 hover:bg-green-600 rounded-full text-white transition-colors shrink-0">
          <i class="fas fa-paper-plane text-sm"></i>
        </button>
      </div>
    </div>

    <ng-template #noStatusSelected>
      <div class="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        <div class="text-center">
          <i class="fas fa-circle-notch text-6xl mb-6 text-gray-300 dark:text-gray-600"></i>
          <h2 class="text-2xl font-light mb-2 text-gray-600 dark:text-gray-300">Status Updates</h2>
          <p class="text-sm max-w-md mx-auto leading-relaxed">Click on a contact to view their status updates.</p>
        </div>
      </div>
    </ng-template>
  `
})
export class StatusViewerComponent implements OnInit, OnDestroy {
  currentStatus: StatusUpdate | null = null;
  currentStory: StatusStory | null = null;
  currentStoryIndex = 0;
  liveViewCount: number | null = null;
  isOwnStory = false;

  isPlaying = true;
  progress = 0;
  private timerSubscription: Subscription | null = null;
  private storyStartTime = 0;
  private pausedTime = 0;
  private longPressTimer: any;

  replyText = '';
  showViewers = false;
  viewersLoading = false;
  viewers: StoryViewer[] = [];

  private lastViewedApiId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(private statusService: StatusService, private tokenService: TokenService) { }

  ngOnInit(): void {
    console.log("Constructed StatusViewer Component...");
    this.statusService.selectedStatusId$.pipe(
      takeUntil(this.destroy$),
      switchMap(statusId => {
        this.showViewers = false;
        this.lastViewedApiId = null;
        if (statusId) {
          this.currentStatus = this.statusService.getStatusById(statusId) || null;
          if (this.currentStatus) {
            this.statusService.markStatusAsViewed(statusId);
            this.isOwnStory = this.currentStatus.userId === this.tokenService.getUserId();
          }
        } else {
          this.currentStatus = null;
          this.isOwnStory = false;
        }
        return this.statusService.currentStoryIndex$;
      })
    ).subscribe(storyIndex => {
      if (this.currentStatus && this.currentStatus.stories.length > storyIndex) {
        this.currentStoryIndex = storyIndex;
        this.currentStory = this.currentStatus.stories[storyIndex];
        this.liveViewCount = null;
        this.startTimer();
        if (this.currentStory.apiId && this.currentStory.apiId !== this.lastViewedApiId) {
          this.lastViewedApiId = this.currentStory.apiId;
          this.statusService.viewStory(this.currentStory.apiId).subscribe();
        }
      }
    });

    // Live view-count updates via WebSocket (only relevant for own stories)
    this.statusService.storyViewEvent$.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (this.currentStory?.apiId === event.storyId) {
        this.liveViewCount = event.viewCount;
        if (this.showViewers && !this.viewers.some(v => v.viewerId === event.viewerId)) {
          this.viewers = [
            { viewerId: event.viewerId, viewerName: event.viewerName, viewerAvatar: event.viewerAvatar, viewedAt: event.viewedAt },
            ...this.viewers
          ];
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (!this.currentStatus) return;
    switch (event.key) {
      case 'ArrowLeft': this.previousStory(); break;
      case 'ArrowRight':
      case ' ': event.preventDefault(); this.nextStory(); break;
      case 'Escape': this.closeViewer(); break;
    }
  }

  startTimer() {
    this.stopTimer();
    this.progress = 0;
    this.isPlaying = true;
    this.storyStartTime = Date.now();
    this.pausedTime = 0;

    if (this.currentStory) {
      const duration = (this.currentStory.duration || 5) * 1000;
      this.timerSubscription = interval(50).subscribe(() => {
        if (this.isPlaying) {
          const elapsed = Date.now() - this.storyStartTime - this.pausedTime;
          this.progress = Math.min((elapsed / duration) * 100, 100);
          if (this.progress >= 100) this.nextStory();
        }
      });
    }
  }

  stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  pauseStory() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.pausedTime = Date.now() - this.storyStartTime - this.pausedTime;
    } else {
      this.isPlaying = true;
      this.storyStartTime = Date.now() - this.pausedTime;
    }
  }

  nextStory() {
    if (!this.currentStatus) return;
    if (this.currentStoryIndex < this.currentStatus.stories.length - 1) {
      this.statusService.setCurrentStoryIndex(this.currentStoryIndex + 1);
    } else {
      this.closeViewer();
    }
  }

  previousStory() {
    if (this.currentStoryIndex > 0) {
      this.statusService.setCurrentStoryIndex(this.currentStoryIndex - 1);
    }
  }

  closeViewer() { this.statusService.clearSelection(); }

  isLastStory(): boolean {
    return this.currentStatus ? this.currentStoryIndex >= this.currentStatus.stories.length - 1 : true;
  }

  getProgressWidth(index: number): number {
    if (index < this.currentStoryIndex) return 100;
    if (index === this.currentStoryIndex) return this.progress;
    return 0;
  }

  get viewCount(): number {
    return this.liveViewCount ?? this.currentStory?.viewCount ?? 0;
  }

  toggleViewers() {
    this.showViewers = !this.showViewers;
    if (this.showViewers && this.currentStory?.apiId) {
      this.viewersLoading = true;
      this.pauseStory();
      this.statusService.getViewers(this.currentStory.apiId).subscribe({
        next: (res) => { this.viewers = res.data.viewers; this.viewersLoading = false; },
        error: () => { this.viewersLoading = false; }
      });
    } else if (!this.showViewers) {
      if (!this.isPlaying) this.pauseStory(); // resume
    }
  }

  toDate(iso: string): Date { return new Date(iso); }

  getTimeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}d`;
  }

  onTouchStart(event: TouchEvent) {
    this.longPressTimer = setTimeout(() => this.pauseStory(), 200);
  }

  onTouchEnd() {
    if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
    if (!this.isPlaying) this.pauseStory();
  }

  onVideoLoaded(event: any) {
    if (this.currentStory?.type === 'video') {
      this.currentStory.duration = event.target.duration || 5;
      this.startTimer();
    }
  }

  sendReply() {
    if (this.replyText.trim() && this.currentStatus) {
      console.log(`Reply to ${this.currentStatus.name}: ${this.replyText}`);
      this.replyText = '';
    }
  }
}
