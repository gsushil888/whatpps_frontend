import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatusService } from '../services/status.service';

@Component({
  selector: 'app-status-list',
  template: `
    <ul>
      <li *ngFor="let status of statuses">
        <a
          class="flex items-center gap-3 px-4 py-3 border-b cursor-pointer hover:bg-gray-50"
          (click)="selectStatus(status.id)"
          [class.bg-green-100]="status.id === selectedStatusId"
        >
          <img [src]="status.avatar" class="w-12 h-12 rounded-full border" alt="avatar" />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ status.name }}</p>
            <p class="text-sm text-gray-500 truncate">{{ status.time }}</p>
          </div>
        </a>
      </li>
    </ul>
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