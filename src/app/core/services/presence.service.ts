import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import { TokenService } from './token.service';

export interface UserPresence {
  userId: number;
  status: 'ONLINE' | 'OFFLINE' | 'AWAY';
  lastSeen: string;
}

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private presenceSubject = new BehaviorSubject<Map<number, UserPresence>>(new Map());
  presence$ = this.presenceSubject.asObservable();

  private stompClient: Client | null = null;

  constructor(private tokenService: TokenService) { }

  initialize(stompClient: Client) {
    this.stompClient = stompClient;
    this.subscribeToPresenceUpdates();
    this.setupVisibilityHandler();
  }

  private subscribeToPresenceUpdates() {
    if (this.stompClient) {
      this.stompClient.subscribe('/topic/presence', (message) => {
        const update: UserPresence = JSON.parse(message.body);
        console.log('Presence update received:', update);
        this.updateUserPresence(update);
      });
    }
  }

  private updateUserPresence(presence: UserPresence) {
    const currentPresence = this.presenceSubject.value;
    currentPresence.set(presence.userId, presence);
    this.presenceSubject.next(new Map(currentPresence));
  }

  private updateStatus(status: 'AWAY' | 'ONLINE') {
    if (this.stompClient?.connected) {
      console.log('Sending presence update:', status);
      this.stompClient.publish({
        destination: '/app/presence.update',
        body: JSON.stringify({ status })
      });
    }
  }

  private setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.updateStatus('AWAY');
      } else {
        this.updateStatus('ONLINE');
      }
    });
  }

  getUserPresence(userId: number): UserPresence | undefined {
    return this.presenceSubject.value.get(userId);
  }

  isUserOnline(userId: number): boolean {
    const presence = this.getUserPresence(userId);
    return presence?.status === 'ONLINE';
  }

  getLastSeen(userId: number): string {
    const presence = this.getUserPresence(userId);
    if (!presence) return '';

    if (presence.status === 'ONLINE') return 'online';

    const lastSeen = new Date(presence.lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'last seen just now';
    if (diffMins < 60) return `last seen ${diffMins} minutes ago`;
    if (diffMins < 1440) return `last seen ${Math.floor(diffMins / 60)} hours ago`;
    return `last seen ${Math.floor(diffMins / 1440)} days ago`;
  }

  destroy() {
    this.stompClient = null;
  }
}