import { Component, OnInit } from '@angular/core';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div *ngFor="let toast of toasts" 
           [ngClass]="{
             'bg-green-500': toast.type === 'success',
             'bg-red-500': toast.type === 'error',
             'bg-blue-500': toast.type === 'info'
           }"
           class="text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm w-max animate-slide-in">
        <span>{{ toast.message }}</span>
        <button (click)="toastService.remove(toast.id)" class="ml-auto text-white hover:text-gray-200">✕</button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(public toastService: ToastService) { }

  ngOnInit(): void {
    console.log("Constructed Toast Component...");
    this.toastService.getToasts().subscribe(toasts => this.toasts = toasts);
  }
}
