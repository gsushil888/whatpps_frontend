import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  BasicResponse,
  MediaUploadResponse,
  MyStoriesResponse,
  PostStoryRequest,
  PostStoryResponse,
  StoryFeedResponse,
  StoryViewersResponse,
  UserStoriesResponse
} from '../../../core/models/story.model';

@Injectable({ providedIn: 'root' })
export class StoryApiService {
  private readonly API_URL = environment.apiBaseUrl + 'stories';
  private readonly MEDIA_URL = environment.apiBaseUrl + 'media/upload';

  constructor(private http: HttpClient) { console.log("Constructing StoryApi Service..."); }

  uploadMedia(file: File, type: 'IMAGE' | 'VIDEO'): Observable<MediaUploadResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    form.append('compress', type === 'IMAGE' ? 'true' : 'false');
    form.append('generate_thumbnail', 'true');
    return this.http.post<MediaUploadResponse>(this.MEDIA_URL, form);
  }

  getFeed(limit = 20, offset = 0): Observable<StoryFeedResponse> {
    return this.http.get<StoryFeedResponse>(`${this.API_URL}/feed?limit=${limit}&offset=${offset}`);
  }

  postStory(request: PostStoryRequest): Observable<PostStoryResponse> {
    return this.http.post<PostStoryResponse>(this.API_URL, request);
  }

  viewStory(storyId: number): Observable<BasicResponse> {
    return this.http.post<BasicResponse>(`${this.API_URL}/${storyId}/view`, {});
  }

  getViewers(storyId: number): Observable<StoryViewersResponse> {
    return this.http.get<StoryViewersResponse>(`${this.API_URL}/${storyId}/viewers`);
  }

  deleteStory(storyId: number): Observable<BasicResponse> {
    return this.http.delete<BasicResponse>(`${this.API_URL}/${storyId}`);
  }

  getMyStories(limit = 20, offset = 0): Observable<MyStoriesResponse> {
    return this.http.get<MyStoriesResponse>(`${this.API_URL}/my-stories?limit=${limit}&offset=${offset}`);
  }

  getUserStories(userId: number, limit = 20, offset = 0): Observable<UserStoriesResponse> {
    return this.http.get<UserStoriesResponse>(`${this.API_URL}/user/${userId}?limit=${limit}&offset=${offset}`);
  }
}
