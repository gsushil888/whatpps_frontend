import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, map, Observable } from 'rxjs';
import { Chat, Message } from '../models/chat.model';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';

type WireEvent =
    | { type: 'message'; payload: Message }
    | { type: 'receipt'; payload: { messageId: string; status: 'delivered' | 'read' } }
    | { type: 'presence'; payload: { userId: string; online: boolean; lastSeen?: string } }
    | { type: 'typing'; payload: { chatId: string; userId: string } };

@Injectable({ providedIn: 'root' })
export class ChatService {
    private chats$ = new BehaviorSubject<Chat[]>([]);
    constructor(private api: ApiService, private ws: SocketService) { }

    loadChats() { this.api.listChats().subscribe(cs => this.chats$.next(cs)); }
    chats(): Observable<Chat[]> { return this.chats$.asObservable(); }

    history(chatId: string) { return this.api.getMessages(chatId); }

    incoming(chatId: string): Observable<Message> {
        return this.ws.events<WireEvent>().pipe(
            filter(e => e.type === 'message' && e.payload.chatId === chatId),
            map(e => (e as any).payload as Message)
        );
    }

    send(msg: Message) {
        // optimistic UI persistence + fanout
        this.ws.send({ type: 'message', payload: msg });
        this.api.persistMessage(msg).subscribe();
    }

    markRead(chatId: string) {
        this.api.markRead(chatId).subscribe();
        this.ws.send({ type: 'receipt', payload: { chatId, status: 'read' } });
    }

    typing(chatId: string, userId: string) {
        this.ws.send({ type: 'typing', payload: { chatId, userId } });
    }
}
