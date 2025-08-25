import { Component } from '@angular/core';

@Component({
  selector: 'app-call-layout',
  template: `
    <div class="flex h-full">
      <div class="w-[320px] border-r">
        <app-call-list></app-call-list>
      </div>
      <div class="flex-1">
        <app-call-panel></app-call-panel>
      </div>
    </div>
  `
})
export class CallLayoutComponent { }