import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatusService } from '../services/status.service';

@Component({
  selector: 'app-status-viewer',
  template: `
    <div *ngIf="statusId; else noStatusSelected" class="flex flex-col h-full">
      <div class="h-14 px-4 flex items-center justify-between border-b bg-gray-50">
        <div class="flex items-center gap-2">
          <img src="assets/google.svg" class="w-8 h-8 rounded-full" alt="status" />
          <span class="font-medium">Status {{ statusId }}</span>
        </div>
      </div>
      
      <div class="flex-1 flex items-center justify-center bg-black">
        <div class="text-white text-center">
          <div class="w-64 h-64 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
            <i class="fas fa-image text-4xl text-gray-400"></i>
          </div>
          <p>Status content for {{ statusId }}</p>
        </div>
      </div>
    </div>

    <ng-template #noStatusSelected>
      <div class="flex flex-col items-center justify-center h-full text-gray-500">
        <i class="fas fa-circle-notch text-5xl mb-4"></i>
        <p class="text-lg font-medium">Select a status to view</p>
      </div>
    </ng-template>
  `
})
export class StatusViewerComponent implements OnInit, OnDestroy {
  statusId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private statusService: StatusService) { }

  ngOnInit(): void {
    this.statusService.selectedStatusId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(statusId => {
      this.statusId = statusId;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}