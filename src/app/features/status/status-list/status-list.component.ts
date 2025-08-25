import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatusService } from '../services/status.service';

@Component({
  selector: 'app-status-list',
  template: `
    <div class="bg-white dark:bg-gray-800">
      <div *ngFor="let status of statuses" 
           class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
           (click)="selectStatus(status.id)"
           [class.bg-green-50]="status.id === selectedStatusId"
           [class.dark:bg-green-900]="status.id === selectedStatusId"
           [class.border-l-4]="status.id === selectedStatusId"
           [class.border-l-green-500]="status.id === selectedStatusId">
        
        <div class="relative">
          <img [src]="status.avatar" class="w-12 h-12 rounded-full object-cover" alt="avatar" />
          <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>
        
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ status.name }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 truncate">{{ status.time }}</p>
        </div>
      </div>
      
      <div *ngIf="statuses.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <i class="fas fa-circle-notch text-4xl mb-4 text-gray-300 dark:text-gray-600"></i>
        <p class="text-lg font-medium">No status updates</p>
        <p class="text-sm">Status updates will appear here</p>
      </div>
    </div>
  `
})
export class StatusListComponent implements OnInit, OnDestroy {
  statuses = [
    { id: '1', name: 'John Doe', avatar: 'assets/google.svg', time: '2 hours ago' },
    { id: '2', name: 'Jane Smith', avatar: 'assets/google.svg', time: '5 hours ago' }
  ];

  selectedStatusId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private statusService: StatusService) { }

  ngOnInit(): void {
    this.statusService.selectedStatusId$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(statusId => {
      this.selectedStatusId = statusId;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectStatus(statusId: string) {
    this.statusService.selectStatus(statusId);
  }
}