import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CallService } from '../services/call.service';

@Component({
  selector: 'app-call-list',
  templateUrl: './call-list.component.html'
})
export class CallListComponent implements OnInit, OnDestroy {
  calls = [
    { id: '1', name: 'John Doe', avatar: 'assets/google.svg', time: '12:45', type: 'Incoming' },
    { id: '2', name: 'Jane Smith', avatar: 'assets/google.svg', time: '11:20', type: 'Missed' },
  ];

  selectedCallId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private callService: CallService) { }

  ngOnInit(): void {
    this.callService.selectedCallId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(callId => {
      this.selectedCallId = callId;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectCall(callId: string) {
    this.callService.selectCall(callId);
  }
}
