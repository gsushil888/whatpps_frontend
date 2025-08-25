import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private selectedStatusIdSubject = new BehaviorSubject<string | null>(null);
  selectedStatusId$ = this.selectedStatusIdSubject.asObservable();

  selectStatus(statusId: string) {
    this.selectedStatusIdSubject.next(statusId);
  }

  clearSelection() {
    this.selectedStatusIdSubject.next(null);
  }
}