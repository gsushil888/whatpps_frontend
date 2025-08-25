// src/app/shared/services/theme.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private _isDarkTheme = new BehaviorSubject<boolean>(false);
    isDarkTheme$ = this._isDarkTheme.asObservable();

    toggleTheme() {
        this._isDarkTheme.next(!this._isDarkTheme.value);
        document.body.classList.toggle('dark', this._isDarkTheme.value);
        document.body.classList.toggle('light', !this._isDarkTheme.value);
    }

    setTheme(isDark: boolean) {
        this._isDarkTheme.next(isDark);
        document.body.classList.toggle('dark', isDark);
        document.body.classList.toggle('light', !isDark);
    }
}
