import { Injectable } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { SocketService } from './socket.service';

interface PresenceMap { [userId: string]: { online: boolean; lastSeen?: string }; }

@Injectable({ providedIn: 'root' })
export class PresenceService {
    private presence$ = new BehaviorSubject<PresenceMap>({});

    constructor(private ws: SocketService) {
        this.ws.events<any>()
            .pipe(filter(e => e.type === 'presence'))
            .subscribe((e) => {
                const p = { ...this.presence$.value };
                p[e.payload.userId] = { online: e.payload.online, lastSeen: e.payload.lastSeen };
                this.presence$.next(p);
            });
    }

    getPresence() { return this.presence$.asObservable(); }
}
