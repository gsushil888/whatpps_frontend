import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StatusLayoutComponent } from './status-layout/status-layout.component';
import { StatusListComponent } from './status-list/status-list.component';
import { StatusRoutingModule } from './status-routing.module';
import { StatusViewerComponent } from './status-viewer/status-viewer.component';

@NgModule({
  declarations: [
    StatusLayoutComponent,
    StatusListComponent,
    StatusViewerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    StatusRoutingModule
  ],
})
export class StatusModule { }