import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PrivacySetting, Story, TextStyle } from '../../../core/models/story.model';
import { StatusService, StatusUpdate } from '../services/status.service';

const BG_COLORS = ['#075E54', '#1A1A2E', '#FF6B6B', '#4A90D9', '#7B2D8B', '#E67E22', '#2ECC71', '#1ABC9C'];

@Component({
  selector: 'app-status-list',
  template: `
    <div class="flex flex-col h-full bg-white dark:bg-gray-800">

      <!-- My Status Bubble Row -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">My status</h4>

        <div class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
             (click)="myStories.length > 0 ? viewMyStories() : openPostStory()">
          <!-- Avatar with ring like feed -->
          <div class="relative flex-shrink-0">
            <div class="w-14 h-14 rounded-full p-0.5"
                 [ngClass]="myStories.length > 0 ? 'bg-gradient-to-br from-green-400 to-teal-500' : 'bg-gray-300 dark:bg-gray-600'">
              <img src="assets/google.svg"
                   class="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-800"
                   alt="my-status" />
            </div>
            <!-- Story count badge -->
            <div *ngIf="myStories.length > 1"
                 class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {{ myStories.length }}
            </div>
            <!-- Plus button when no stories -->
            <div *ngIf="myStories.length === 0"
                 class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <i class="fas fa-plus text-white" style="font-size:9px"></i>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">My status</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
              <ng-container *ngIf="myStories.length > 0; else noStory">
                {{ getTimeAgo(myStories[0].createdAt) }}
                <span class="ml-2 inline-flex items-center gap-1 text-xs text-gray-400">
                  <i class="fas fa-eye text-xs"></i> {{ totalMyViews }}
                </span>
              </ng-container>
              <ng-template #noStory>Tap to add status update</ng-template>
            </p>
          </div>

          <button (click)="openPostStory(); $event.stopPropagation()"
                  class="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors flex-shrink-0">
            <i class="fas fa-plus text-green-500 text-sm"></i>
          </button>
        </div>

        <!-- Expanded my stories list -->
        <div *ngIf="showMyStories && myStories.length > 0" class="mt-2 space-y-1 ml-2">
          <div *ngFor="let story of myStories"
               class="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div class="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img *ngIf="story.storyType === 'IMAGE' || story.storyType === 'VIDEO'"
                   [src]="story.thumbnailUrl || story.mediaUrl || 'assets/google.svg'"
                   class="w-full h-full object-cover" alt="" />
              <div *ngIf="story.storyType === 'TEXT'"
                   class="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                   [style.background]="story.backgroundColor || '#075E54'">T</div>
              <div *ngIf="story.storyType === 'LINK'"
                   class="w-full h-full flex items-center justify-center bg-blue-500">
                <i class="fas fa-link text-white text-xs"></i>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ storyPreview(story) }}</p>
              <p class="text-xs text-gray-400">
                {{ getTimeAgo(story.createdAt) }}
                <span class="ml-2 inline-flex items-center gap-1">
                  <i class="fas fa-eye"></i> {{ story.viewCount }}
                </span>
              </p>
            </div>
            <button (click)="onDeleteStory(story.id, $event)"
                    class="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors flex-shrink-0">
              <i class="fas fa-trash text-red-400 text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Post Story Form -->
      <div *ngIf="showPostForm" class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">New Status</h4>
          <div class="flex gap-1">
            <button *ngFor="let t of storyTypes" (click)="selectType(t)"
                    [class]="activeType === t
                      ? 'px-2 py-1 text-xs rounded-md bg-green-500 text-white'
                      : 'px-2 py-1 text-xs rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'">
              {{ t }}
            </button>
          </div>
        </div>

        <!-- TEXT -->
        <ng-container *ngIf="activeType === 'TEXT'">
          <textarea [(ngModel)]="postContent" placeholder="What's on your mind?" rows="3"
                    class="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none outline-none focus:ring-2 focus:ring-green-500"></textarea>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">BG:</span>
            <button *ngFor="let c of bgColors" (click)="postBgColor = c"
                    [style.background]="c"
                    [class]="postBgColor === c ? 'w-5 h-5 rounded-full ring-2 ring-offset-1 ring-green-500' : 'w-5 h-5 rounded-full'"></button>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">Style:</span>
            <button *ngFor="let s of textStyles" (click)="postTextStyle = s"
                    [class]="postTextStyle === s
                      ? 'px-2 py-0.5 text-xs rounded border border-green-500 text-green-600 dark:text-green-400'
                      : 'px-2 py-0.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'">
              {{ s }}
            </button>
          </div>
        </ng-container>

        <!-- IMAGE -->
        <ng-container *ngIf="activeType === 'IMAGE'">
          <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
               (click)="fileInput.click()">
            <ng-container *ngIf="!selectedFile">
              <i class="fas fa-image text-2xl text-gray-400 mb-1"></i>
              <p class="text-xs text-gray-400">Click to select image (jpg, png, gif — max 10MB)</p>
            </ng-container>
            <ng-container *ngIf="selectedFile">
              <i class="fas fa-check-circle text-xl text-green-500 mb-1"></i>
              <p class="text-xs text-green-600 dark:text-green-400 truncate">{{ selectedFile.name }}</p>
            </ng-container>
          </div>
          <input #fileInput type="file" accept="image/jpeg,image/png,image/gif" class="hidden" (change)="onFileSelected($event)" />
          <input [(ngModel)]="postContent" placeholder="Caption (optional)" type="text"
                 class="mt-2 w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500" />
        </ng-container>

        <!-- VIDEO -->
        <ng-container *ngIf="activeType === 'VIDEO'">
          <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
               (click)="videoInput.click()">
            <ng-container *ngIf="!selectedFile">
              <i class="fas fa-video text-2xl text-gray-400 mb-1"></i>
              <p class="text-xs text-gray-400">Click to select video (mp4, mov — max 100MB)</p>
            </ng-container>
            <ng-container *ngIf="selectedFile">
              <i class="fas fa-check-circle text-xl text-green-500 mb-1"></i>
              <p class="text-xs text-green-600 dark:text-green-400 truncate">{{ selectedFile.name }}</p>
            </ng-container>
          </div>
          <input #videoInput type="file" accept="video/mp4,video/quicktime" class="hidden" (change)="onFileSelected($event)" />
          <input [(ngModel)]="postContent" placeholder="Caption (optional)" type="text"
                 class="mt-2 w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500" />
        </ng-container>

        <!-- LINK -->
        <ng-container *ngIf="activeType === 'LINK'">
          <div class="flex gap-2">
            <input [(ngModel)]="linkUrl" placeholder="https://example.com/article" type="url"
                   class="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-green-500" />
            <button (click)="fetchOg()" [disabled]="!linkUrl.trim() || ogFetching"
                    class="px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors">
              {{ ogFetching ? '...' : 'Fetch' }}
            </button>
          </div>
          <div *ngIf="ogPreview" class="mt-2 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            <img *ngIf="ogPreview.image" [src]="ogPreview.image" class="w-full h-24 object-cover" alt="preview" />
            <div class="p-2">
              <p class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{{ ogPreview.title }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{{ ogPreview.description }}</p>
            </div>
          </div>
        </ng-container>

        <div *ngIf="uploading" class="mt-2 flex items-center gap-2 text-xs text-blue-500">
          <i class="fas fa-spinner fa-spin"></i> Uploading media...
        </div>

        <div class="flex items-center justify-between mt-3">
          <select [(ngModel)]="postPrivacy"
                  class="text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none">
            <option value="PUBLIC">Public</option>
            <option value="CONTACTS">All contacts</option>
            <option value="CLOSE_FRIENDS">Close friends</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <div class="flex gap-2">
            <button (click)="cancelPost()"
                    class="px-3 py-1.5 text-xs rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button (click)="submitStory()" [disabled]="!canSubmit() || posting || uploading"
                    class="px-3 py-1.5 text-xs rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 transition-colors">
              {{ posting ? 'Posting...' : 'Post' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Updates -->
      <div class="flex-1 overflow-y-auto">
        <div *ngIf="loading" class="flex items-center justify-center py-8">
          <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
        </div>

        <div *ngIf="!loading && statuses.length > 0" class="p-4">
          <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Recent updates</h4>
          <div *ngFor="let status of statuses"
               class="flex items-center gap-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 transition-colors"
               (click)="selectStatus(status.id)"
               [ngClass]="{'bg-green-50 dark:bg-green-900/20': status.id === selectedStatusId}">
            <div class="relative flex-shrink-0">
              <div class="w-14 h-14 rounded-full p-0.5"
                   [ngClass]="status.isViewed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'">
                <img [src]="status.avatar"
                     class="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-800"
                     alt="avatar" />
              </div>
              <div *ngIf="status.stories.length > 1"
                   class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {{ status.stories.length }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ status.name }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 truncate">{{ getTimeAgo(status.lastUpdated.toISOString()) }}</p>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && statuses.length === 0"
             class="flex flex-col items-center justify-center py-12 px-4 text-gray-500 dark:text-gray-400">
          <i class="fas fa-circle-notch text-6xl mb-4 text-gray-300 dark:text-gray-600"></i>
          <p class="text-lg font-medium mb-2">No recent updates</p>
          <p class="text-sm text-center leading-relaxed">When your contacts share status updates, you'll see them here</p>
        </div>
      </div>
    </div>
  `
})
export class StatusListComponent implements OnInit, OnDestroy {
  statuses: StatusUpdate[] = [];
  myStories: Story[] = [];
  selectedStatusId: string | null = null;
  loading = false;
  showMyStories = false;
  showPostForm = false;
  posting = false;
  uploading = false;

  storyTypes: Array<'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK'> = ['TEXT', 'IMAGE', 'VIDEO', 'LINK'];
  activeType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK' = 'TEXT';
  postContent = '';
  postPrivacy: PrivacySetting = 'CONTACTS';
  postBgColor = BG_COLORS[0];
  postTextStyle: TextStyle = 'NORMAL';
  bgColors = BG_COLORS;
  textStyles: TextStyle[] = ['NORMAL', 'BOLD', 'ITALIC', 'HANDWRITING'];

  selectedFile: File | null = null;
  uploadedMediaUrl: string | null = null;
  uploadedThumbnailUrl: string | null = null;

  linkUrl = '';
  ogFetching = false;
  ogPreview: { title: string; description: string; image: string } | null = null;

  private destroy$ = new Subject<void>();

  constructor(private statusService: StatusService) { }

  ngOnInit(): void {
    console.log("Constructed StatusList Component...");
    this.statusService.loading$.pipe(takeUntil(this.destroy$)).subscribe(l => this.loading = l);
    this.statusService.statusUpdates$.pipe(takeUntil(this.destroy$)).subscribe(s => this.statuses = s);
    this.statusService.myStories$.pipe(takeUntil(this.destroy$)).subscribe(s => this.myStories = s);
    this.statusService.selectedStatusId$.pipe(takeUntil(this.destroy$)).subscribe(id => this.selectedStatusId = id);

    // Live view count updates on own stories
    this.statusService.storyViewEvent$.pipe(takeUntil(this.destroy$)).subscribe(event => {
      this.myStories = this.myStories.map(s =>
        s.id === event.storyId ? { ...s, viewCount: event.viewCount } : s
      );
    });

    this.statusService.loadFeed();
    this.statusService.loadMyStories();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get totalMyViews(): number {
    return this.myStories.reduce((sum, s) => sum + s.viewCount, 0);
  }

  selectStatus(id: string) { this.statusService.selectStatus(id); }

  viewMyStories() {
    this.showMyStories = !this.showMyStories;
  }

  openPostStory() {
    this.showPostForm = true;
    this.resetForm();
  }

  selectType(type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'LINK') {
    this.activeType = type;
    this.resetFormFields();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      this.uploadedMediaUrl = null;
      this.uploadedThumbnailUrl = null;
    }
  }

  fetchOg() {
    if (!this.linkUrl.trim()) return;
    this.ogFetching = true;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(this.linkUrl.trim())}`;
    fetch(proxyUrl)
      .then(r => r.json())
      .then(data => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        const meta = (name: string) =>
          doc.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ||
          doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
        this.ogPreview = {
          title: meta('og:title') || doc.title || '',
          description: meta('og:description') || meta('description') || '',
          image: meta('og:image') || ''
        };
        this.ogFetching = false;
      })
      .catch(() => { this.ogFetching = false; });
  }

  canSubmit(): boolean {
    switch (this.activeType) {
      case 'TEXT': return this.postContent.trim().length > 0;
      case 'IMAGE':
      case 'VIDEO': return !!this.selectedFile;
      case 'LINK': return this.linkUrl.trim().length > 0;
    }
  }

  submitStory() {
    if (!this.canSubmit() || this.posting || this.uploading) return;

    if ((this.activeType === 'IMAGE' || this.activeType === 'VIDEO') && this.selectedFile && !this.uploadedMediaUrl) {
      this.uploading = true;
      this.statusService.uploadMedia(this.selectedFile, this.activeType).subscribe({
        next: (res) => {
          this.uploading = false;
          this.uploadedMediaUrl = res.data.fileUrl;
          this.uploadedThumbnailUrl = res.data.fileUrl;
          this.postStoryRequest();
        },
        error: () => { this.uploading = false; }
      });
    } else {
      this.postStoryRequest();
    }
  }

  private postStoryRequest() {
    this.posting = true;
    const base = { storyType: this.activeType, privacySetting: this.postPrivacy };
    let request: any;
    switch (this.activeType) {
      case 'TEXT':
        request = { ...base, content: this.postContent.trim(), backgroundColor: this.postBgColor, textStyle: this.postTextStyle };
        break;
      case 'IMAGE':
      case 'VIDEO':
        request = { ...base, mediaUrl: this.uploadedMediaUrl, thumbnailUrl: this.uploadedThumbnailUrl, content: this.postContent.trim() || undefined };
        break;
      case 'LINK':
        request = { ...base, linkUrl: this.linkUrl.trim(), linkTitle: this.ogPreview?.title, linkDescription: this.ogPreview?.description, linkPreviewImage: this.ogPreview?.image };
        break;
    }
    this.statusService.postStory(request).subscribe({
      next: () => { this.cancelPost(); this.posting = false; },
      error: () => { this.posting = false; }
    });
  }

  cancelPost() {
    this.showPostForm = false;
    this.resetForm();
  }

  onDeleteStory(storyId: number, event: Event) {
    event.stopPropagation();
    this.statusService.deleteStory(storyId).subscribe();
  }

  storyPreview(story: Story): string {
    switch (story.storyType) {
      case 'TEXT': return story.content || '';
      case 'IMAGE': return story.content || 'Image';
      case 'VIDEO': return story.content || 'Video';
      case 'LINK': return story.linkTitle || story.linkUrl || 'Link';
    }
  }

  getTimeAgo(isoDate: string): string {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
  }

  private resetFormFields() {
    this.postContent = '';
    this.selectedFile = null;
    this.uploadedMediaUrl = null;
    this.uploadedThumbnailUrl = null;
    this.linkUrl = '';
    this.ogPreview = null;
    this.ogFetching = false;
  }

  private resetForm() {
    this.activeType = 'TEXT';
    this.postPrivacy = 'CONTACTS';
    this.postBgColor = BG_COLORS[0];
    this.postTextStyle = 'NORMAL';
    this.resetFormFields();
  }
}
