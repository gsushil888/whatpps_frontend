import { Component, HostListener, OnInit } from '@angular/core';
import { CallService } from '../services/call.service';

@Component({
  selector: 'app-call-layout',
  templateUrl: './call-layout.component.html'
})
export class CallLayoutComponent implements OnInit {
  selectedCallId: string | null = null;
  isMobile = window.innerWidth < 790;

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth < 790; }

  constructor(private callService: CallService) { }

  ngOnInit() {
    this.callService.selectedCallId$.subscribe(id => { this.selectedCallId = id; });
  }

  clearSelection() { this.callService.clearSelection(); }
}
