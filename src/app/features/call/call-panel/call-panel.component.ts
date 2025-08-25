import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CallService } from '../services/call.service';

@Component({
  selector: 'app-call-panel',
  templateUrl: './call-panel.component.html'
})
export class CallPanelComponent implements OnInit, OnDestroy {
  callId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private callService: CallService) { }

  ngOnInit(): void {
    this.callService.selectedCallId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(callId => {
      this.callId = callId;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  endCall() {
    this.callService.clearSelection();
  }
}
