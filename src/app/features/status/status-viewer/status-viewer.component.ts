import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatusService } from '../services/status.service';

@Component({
  selector: 'app-status-viewer',
  template: `
    <div *ngIf="statusId; else noStatusSelected" class="flex flex-col h-full bg-white dark:bg-gray-800">
      <div class="h-16 px-4 flex items-center justify-between border-b bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
        <div class="flex items-center gap-3">
          <img src="assets/google.svg" class="w-10 h-10 rounded-full object-cover" alt="status" />
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">Status {{ statusId }}</h3>
            <p class="text-xs text-gray-600 dark:text-gray-400">2 hours ago</p>
          </div>
        </div>
        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <button class="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
            <i class="fas fa-share text-lg"></i>
          </button>
          <button class="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
            <i class="fas fa-ellipsis-v text-lg"></i>
          </button>
        </div>
      </div>
      
      <div class="flex-1 flex items-center justify-center bg-black dark:bg-gray-900">
        <div class="text-white text-center">
          <div class="w-64 h-64 bg-gray-800 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
            <i class="fas fa-image text-4xl text-gray-400 dark:text-gray-500"></i>
          </div>
          <p class="text-lg">Status content for {{ statusId }}</p>
          <p class="text-sm text-gray-400 mt-2">Tap to view next</p>
        </div>
      </div>
    </div>

    <ng-template #noStatusSelected>
      <div class="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        <div class="text-center">
          <i class="fas fa-circle-notch text-6xl mb-6 text-gray-300 dark:text-gray-600"></i>
          <h2 class="text-2xl font-light mb-2 text-gray-600 dark:text-gray-300">Status Updates</h2>
          <p class="text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Click on a contact to view their status updates.
          </p>
        </div>
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