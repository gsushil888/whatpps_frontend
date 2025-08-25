import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CallService {
  private selectedCallIdSubject = new BehaviorSubject<string | null>(null);
  selectedCallId$ = this.selectedCallIdSubject.asObservable();

  selectCall(callId: string) {
    this.selectedCallIdSubject.next(callId);
  }

  clearSelection() {
    this.selectedCallIdSubject.next(null);
  }
}