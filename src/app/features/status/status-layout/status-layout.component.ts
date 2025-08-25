import { Component } from '@angular/core';

@Component({
  selector: 'app-status-layout',
  template: `
    <div class="flex h-full">
      <div class="w-[320px] border-r">
        <app-status-list></app-status-list>
      </div>
      <div class="flex-1">
        <app-status-viewer></app-status-viewer>
      </div>
    </div>
  `
})
export class StatusLayoutComponent { }