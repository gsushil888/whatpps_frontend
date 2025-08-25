// src/app/shared/services/loader.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LoaderService {
    private progressLoaderSubject = new BehaviorSubject<boolean>(false);
    private spinnerLoaderSubject = new BehaviorSubject<boolean>(false);

    progressLoader$ = this.progressLoaderSubject.asObservable();
    spinnerLoader$ = this.spinnerLoaderSubject.asObservable();

    showProgress() {
        this.progressLoaderSubject.next(true);
    }
    hideProgress() {
        this.progressLoaderSubject.next(false);
    }

    showSpinner() {
        this.spinnerLoaderSubject.next(true);
    }
    hideSpinner() {
        this.spinnerLoaderSubject.next(false);
    }
}
