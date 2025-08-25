import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SocketService {
    private socket$!: WebSocketSubject<any>;
    private out$ = new Subject<any>();
    constructor(private zone: NgZone) {
        this.connect();
    }

    private connect() {
        this.socket$ = webSocket({
            url: environment.wsUrl,
            deserializer: e => JSON.parse(e.data),
            serializer: v => JSON.stringify(v),
        });
        this.socket$.subscribe({
            next: (evt) => this.zone.run(() => this.out$.next(evt)),
            error: () => setTimeout(() => this.connect(), 1500),
            complete: () => setTimeout(() => this.connect(), 1500),
        });
    }

    events<T = any>(): Observable<T> { return this.out$.asObservable(); }
    send(message: any) { this.socket$.next(message); }
}
