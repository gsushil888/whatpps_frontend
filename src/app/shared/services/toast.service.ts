import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private idCounter = 0;

  getToasts() {
    return this.toasts$.asObservable();
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }

  private show(message: string, type: 'success' | 'error' | 'info') {
    const toast: Toast = { id: this.idCounter++, message, type };
    const current = this.toasts$.value;
    this.toasts$.next([...current, toast]);
    setTimeout(() => this.remove(toast.id), 5000);
  }

  remove(id: number) {
    const current = this.toasts$.value.filter(t => t.id !== id);
    this.toasts$.next(current);
  }
}
