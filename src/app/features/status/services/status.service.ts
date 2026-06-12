import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { BasicResponse, MediaUploadResponse, PostStoryRequest, PostStoryResponse, Story, StoryViewersResponse, StoryViewEvent, UserStoriesResponse } from '../../../core/models/story.model';
import { WebSocketService } from '../../chat/services/websocket.service';
import { StoryApiService } from './story-api.service';

export interface StatusStory {
  id: string;
  type: 'image' | 'video' | 'text' | 'link';
  content: string;
  timestamp: Date;
  duration?: number;
  backgroundColor?: string;
  textColor?: string;
  textStyle?: string;
  thumbnailUrl?: string | null;
  apiId?: number;
  mediaUrl?: string | null;
  linkUrl?: string | null;
  linkTitle?: string | null;
  linkDescription?: string | null;
  linkPreviewImage?: string | null;
  viewCount?: number;
}

export interface StatusUpdate {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  stories: StatusStory[];
  lastUpdated: Date;
  isViewed: boolean;
}

@Injectable({ providedIn: 'root' })
export class StatusService implements OnDestroy {
  private selectedStatusIdSubject = new BehaviorSubject<string | null>(null);
  selectedStatusId$ = this.selectedStatusIdSubject.asObservable();

  private currentStoryIndexSubject = new BehaviorSubject<number>(0);
  currentStoryIndex$ = this.currentStoryIndexSubject.asObservable();

  private statusUpdatesSubject = new BehaviorSubject<StatusUpdate[]>([]);
  statusUpdates$ = this.statusUpdatesSubject.asObservable();

  private myStoriesSubject = new BehaviorSubject<Story[]>([]);
  myStories$ = this.myStoriesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private storyViewEventSubject = new Subject<StoryViewEvent>();
  storyViewEvent$ = this.storyViewEventSubject.asObservable();

  private destroy$ = new Subject<void>();

  constructor(private storyApi: StoryApiService, private wsService: WebSocketService) {
    console.log("Constructing Status Service...");
    this.wsService.storyView$.pipe(takeUntil(this.destroy$)).subscribe(event => {
      this.storyViewEventSubject.next(event);
      // Update viewCount in myStories live
      const updated = this.myStoriesSubject.value.map(s =>
        s.id === event.storyId ? { ...s, viewCount: event.viewCount } : s
      );
      this.myStoriesSubject.next(updated);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFeed(limit = 20, offset = 0): void {
    this.loadingSubject.next(true);
    this.storyApi.getFeed(limit, offset).subscribe({
      next: (res) => {
        if (res.success) {
          this.statusUpdatesSubject.next(this.groupStoriesToStatusUpdates(res.data.stories));
        }
        this.loadingSubject.next(false);
      },
      error: () => this.loadingSubject.next(false)
    });
  }

  loadMyStories(limit = 20, offset = 0): void {
    this.storyApi.getMyStories(limit, offset).subscribe({
      next: (res) => {
        if (res.success) this.myStoriesSubject.next(res.data.stories);
      }
    });
  }

  postStory(request: PostStoryRequest): Observable<PostStoryResponse> {
    return this.storyApi.postStory(request).pipe(
      tap((res) => {
        if (res.success) {
          // Optimistically prepend so UI updates instantly, then sync from server
          const current = this.myStoriesSubject.value;
          this.myStoriesSubject.next([res.data, ...current]);
          this.loadMyStories();
          this.loadFeed();
        }
      })
    );
  }

  viewStory(storyId: number): Observable<BasicResponse> {
    return this.storyApi.viewStory(storyId);
  }

  getViewers(storyId: number): Observable<StoryViewersResponse> {
    return this.storyApi.getViewers(storyId);
  }

  deleteStory(storyId: number): Observable<BasicResponse> {
    // Remove immediately from local state, then confirm via server
    const before = this.myStoriesSubject.value;
    this.myStoriesSubject.next(before.filter(s => s.id !== storyId));
    return this.storyApi.deleteStory(storyId).pipe(
      tap((res) => {
        if (res.success) { this.loadMyStories(); this.loadFeed(); }
        else this.myStoriesSubject.next(before); // rollback on failure
      })
    );
  }

  getUserStories(userId: number, limit = 20, offset = 0): Observable<UserStoriesResponse> {
    return this.storyApi.getUserStories(userId, limit, offset);
  }

  uploadMedia(file: File, type: 'IMAGE' | 'VIDEO'): Observable<MediaUploadResponse> {
    return this.storyApi.uploadMedia(file, type);
  }

  // ── Local state helpers ──────────────────────────────────────────────────

  getStatusUpdates(): StatusUpdate[] {
    return this.statusUpdatesSubject.value;
  }

  getStatusById(id: string): StatusUpdate | undefined {
    return this.statusUpdatesSubject.value.find(s => s.id === id);
  }

  selectStatus(statusId: string, storyIndex = 0) {
    this.selectedStatusIdSubject.next(statusId);
    this.currentStoryIndexSubject.next(storyIndex);
  }

  clearSelection() {
    this.selectedStatusIdSubject.next(null);
    this.currentStoryIndexSubject.next(0);
  }

  setCurrentStoryIndex(index: number) {
    this.currentStoryIndexSubject.next(index);
  }

  markStatusAsViewed(statusId: string) {
    const updated = this.statusUpdatesSubject.value.map(s =>
      s.id === statusId ? { ...s, isViewed: true } : s
    );
    this.statusUpdatesSubject.next(updated);
  }

  // ── Private mapping ──────────────────────────────────────────────────────

  private groupStoriesToStatusUpdates(stories: Story[]): StatusUpdate[] {
    const map = new Map<number, StatusUpdate>();

    for (const story of stories) {
      if (!map.has(story.userId)) {
        map.set(story.userId, {
          id: story.userId.toString(),
          userId: story.userId.toString(),
          name: story.userName,
          avatar: story.userAvatar || 'assets/google.svg',
          stories: [],
          lastUpdated: new Date(story.createdAt),
          isViewed: !story.hasUnviewedStories
        });
      }

      const entry = map.get(story.userId)!;
      entry.stories.push(this.mapStory(story));

      const storyDate = new Date(story.createdAt);
      if (storyDate > entry.lastUpdated) entry.lastUpdated = storyDate;
      if (!story.isViewed) entry.isViewed = false;
    }

    const result = Array.from(map.values());
    return result.sort((a, b) => (a.name === 'You' ? -1 : b.name === 'You' ? 1 : 0));
  }

  private mapStory(story: Story): StatusStory {
    return {
      id: story.id.toString(),
      apiId: story.id,
      type: story.storyType === 'VIDEO' ? 'video' : story.storyType === 'IMAGE' ? 'image' : story.storyType === 'LINK' ? 'link' : 'text',
      content: story.storyType === 'TEXT' ? (story.content || '') : story.storyType === 'LINK' ? (story.linkTitle || '') : (story.mediaUrl || ''),
      mediaUrl: story.mediaUrl,
      thumbnailUrl: story.thumbnailUrl,
      backgroundColor: story.backgroundColor || undefined,
      textStyle: story.textStyle || undefined,
      linkUrl: story.linkUrl,
      linkTitle: story.linkTitle,
      linkDescription: story.linkDescription,
      linkPreviewImage: story.linkPreviewImage,
      timestamp: new Date(story.createdAt),
      duration: 5,
      viewCount: story.viewCount
    };
  }
}
