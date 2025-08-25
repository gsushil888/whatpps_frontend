import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class ViewportService {
    private mobileView$ = new BehaviorSubject<boolean>(this.checkMobileView());

    constructor() {
        fromEvent(window, 'resize')
            .pipe(debounceTime(200), startWith(null))
            .subscribe(() => {
                this.mobileView$.next(this.checkMobileView());
            });
    }

    private checkMobileView(): boolean {
        return window.innerWidth <= 768;
    }

    /** Observable to subscribe */
    get isMobileView$() {
        return this.mobileView$.asObservable();
    }

    /** Current snapshot */
    get isMobileView(): boolean {
        return this.mobileView$.value;
    }
}
