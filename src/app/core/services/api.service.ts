import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Chat, Message, Attachment, UserSummary } from '../models/chat.model';
import { AuthTokens, AuthUser } from '../models/auth.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private base = environment.apiBaseUrl;
    constructor(private http: HttpClient) { }

    // auth
    login(username: string, password: string): Observable<AuthTokens> {
        return this.http.post<AuthTokens>(`${this.base}/auth/login`, { username, password });
    }
    me(): Observable<AuthUser> { return this.http.get<AuthUser>(`${this.base}/auth/me`); }

    // chats & messages
    listChats(): Observable<Chat[]> { return this.http.get<Chat[]>(`${this.base}/chats`); }
    getChat(chatId: string): Observable<Chat> { return this.http.get<Chat>(`${this.base}/chats/${chatId}`); }

    getMessages(chatId: string, before?: string, limit = 50): Observable<Message[]> {
        let params = new HttpParams().set('limit', limit);
        if (before) params = params.set('before', before);
        return this.http.get<Message[]>(`${this.base}/chats/${chatId}/messages`, { params });
    }

    persistMessage(msg: Message): Observable<Message> {
        return this.http.post<Message>(`${this.base}/messages`, msg);
    }

    markRead(chatId: string): Observable<void> {
        return this.http.post<void>(`${this.base}/chats/${chatId}/read`, {});
    }

    // presence
    getPresence(userIds: string[]): Observable<UserSummary[]> {
        return this.http.post<UserSummary[]>(`${this.base}/presence/batch`, { userIds });
    }

    // attachments
    upload(file: File): Observable<Attachment> {
        const fd = new FormData(); fd.append('file', file);
        return this.http.post<Attachment>(`${this.base}/attachments`, fd);
    }
}
