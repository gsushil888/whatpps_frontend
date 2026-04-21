import { Component, HostListener, OnInit } from '@angular/core';
import { StatusService } from '../services/status.service';

@Component({
  selector: 'app-status-layout',
  templateUrl: './status-layout.component.html'
})
export class StatusLayoutComponent implements OnInit {
  selectedStatusId: string | null = null;
  isMobile = window.innerWidth < 790;

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth < 790; }

  constructor(private statusService: StatusService) { }

  ngOnInit() {
    this.statusService.selectedStatusId$.subscribe(id => { this.selectedStatusId = id; });
  }

  clearSelection() { this.statusService.clearSelection(); }
}
