import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface SearchContact {
  id: number; type: string; displayName: string; matchedField: string;
  contactUser: { id: number; displayName: string; profilePictureUrl: string; isOnline: boolean };
}
export interface SearchConversation {
  id: number; type: string; name: string; profileImageUrl: string;
  conversationType: string; matchedField: string;
  lastMessage?: { content: string; timestamp: string };
}
export interface SearchMessage {
  id: number; type: string; content: string; timestamp: string; matchedField: string;
  conversation: { id: number; name: string; type: string };
  sender: { id: number; displayName: string };
}
export interface SearchUser {
  id: number; type: string; username: string; displayName: string;
  profilePictureUrl: string; isOnline: boolean; accountType: string; matchedField: string;
}
export interface SearchResult {
  contacts: SearchContact[];
  conversations: SearchConversation[];
  messages: SearchMessage[];
  users: SearchUser[];
  summary: { totalContacts: number; totalConversations: number; totalMessages: number; totalUsers: number; hasMore: boolean };
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private base = environment.apiBaseUrl + 'search';

  constructor(private http: HttpClient) {}

  search(q: string, type = 'all', limit = 20, offset = 0): Observable<{ success: boolean; data: SearchResult }> {
    const params = new HttpParams().set('q', q).set('type', type).set('limit', limit).set('offset', offset);
    return this.http.get<{ success: boolean; data: SearchResult }>(this.base, { params });
  }
}
