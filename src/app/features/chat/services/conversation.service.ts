import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/core/services/token.service';

export interface ConversationResponse {
  success: boolean;
  data: {
    conversations: Conversation[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface Conversation {
  id: number;
  type: string;
  title: string;
  profileImageUrl: string | null;
  lastMessage: {
    id: number;
    content: string;
    type: string;
    timestamp: string;
    sender: {
      id: number;
      displayName: string;
    };
    status: string;
  };
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  mobileNumber?: string;
  isOnline?: boolean | null;
  lastActiveAt?: string | null;
  participants?: Participant[];
}

export interface MessageResponse {
  success: boolean;
  data: {
    messages: ConversationMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasNext: boolean;
    };
  };
}

export interface ConversationMessage {
  id?: number;
  senderId: number;
  senderName: string;
  senderMobileNumber?: string;
  senderAvatar: string;
  content: string;
  messageType: string;
  replyToMessageId?: number;
  isEdited: boolean;
  deliveryStatus: {
    read: number;
    delivered: number;
    sent: number;
  };
  reactions: MessageReaction[];
  mediaMetadata?: {
    size: number;
    mimeType: string;
    fileName: string;
    thumbnail: string;
  };
  mediaUrl?: string;
  isUploading?: boolean;
  imageLoaded?: boolean;
  createdAt: string;
}

export interface MessageReaction {
  emoji: string;
  userId: number;
  displayName: string;
  createdAt: string;
}

export interface ConversationDetail {
  id: number;
  title: string;
  type: string;
  description?: string;
  groupPictureUrl?: string;
  participants: Participant[];
  settings: {
    isMuted: boolean;
    isPinned: boolean;
    isArchived: boolean;
    isFavorite: boolean;
  };
  createdAt: string;
  createdBy?: {
    id: number;
    displayName: string;
    profilePictureUrl: string;
  };
  media: MediaItem[];
}

export interface Participant {
  userId: number;
  displayName: string;
  mobileNumber: string;
  profilePictureUrl: string;
  participantRole: string;
  isOnline: boolean;
  lastActiveAt: string;
  joinedAt: string;
}

export interface MediaItem {
  messageId: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  timestamp: string;
  sender: {
    id: number;
    displayName: string;
  };
}

export interface ConversationDetailResponse {
  success: boolean;
  data: ConversationDetail;
}

export interface CreateConversationRequest {
  type: 'INDIVIDUAL' | 'GROUP';
  participantId?: number;
  participantIds?: number[];
  title?: string;
  description?: string;
  groupPictureUrl?: string;
}

export interface CreateConversationResponse {
  success: boolean;
  message: string;
  data: Conversation;
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private readonly API_URL = environment.apiBaseUrl + 'conversations';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  getConversations(limit: number = 20, offset: number = 0, filter?: string): Observable<ConversationResponse> {
    let url = `${this.API_URL}?limit=${limit}&offset=${offset}`;
    if (filter && filter !== 'all') {
      url += `&filter=${filter}`;
    }
    return this.http.get<ConversationResponse>(url, { headers: this.tokenService.getAuthHeaders() });
  }

  getConversationMessages(conversationId: string, limit: number = 50, beforeMessageId?: number): Observable<MessageResponse> {
    let url = `${this.API_URL}/${conversationId}/messages?limit=${limit}`;
    if (beforeMessageId) {
      url += `&beforeMessageId=${beforeMessageId}`;
    }
    return this.http.get<MessageResponse>(url, { headers: this.tokenService.getAuthHeaders() });
  }

  getConversationDetail(conversationId: string): Observable<ConversationDetailResponse> {
    const url = `${this.API_URL}/${conversationId}`;
    return this.http.get<ConversationDetailResponse>(url, { headers: this.tokenService.getAuthHeaders() });
  }

  uploadMedia(conversationId: string | null, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (conversationId) {
      formData.append('conversationId', conversationId);
    }
    const url = `${environment.apiBaseUrl}media/upload`;
    return this.http.post(url, formData, { headers: this.tokenService.getAuthHeaders() });
  }

  createConversation(request: CreateConversationRequest): Observable<CreateConversationResponse> {
    return this.http.post<CreateConversationResponse>(this.API_URL, request, { headers: this.tokenService.getAuthHeaders() });
  }

  deleteConversation(conversationId: string): Observable<any> {
    const url = `${this.API_URL}/${conversationId}`;
    return this.http.delete(url, { headers: this.tokenService.getAuthHeaders() });
  }

  clearConversation(conversationId: string): Observable<any> {
    const url = `${this.API_URL}/${conversationId}/clear`;
    return this.http.post(url, {}, { headers: this.tokenService.getAuthHeaders() });
  }

  addReaction(messageId: number, emoji: string): Observable<any> {
    const url = `${environment.apiBaseUrl}messages/${messageId}/reactions`;
    return this.http.post(url, { emoji }, { headers: this.tokenService.getAuthHeaders() });
  }

  removeReaction(messageId: number, emoji: string): Observable<any> {
    const url = `${environment.apiBaseUrl}messages/${messageId}/reactions/${encodeURIComponent(emoji)}`;
    return this.http.delete(url, { headers: this.tokenService.getAuthHeaders() });
  }
}
