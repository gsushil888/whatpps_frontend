import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CallLayoutComponent } from './call-layout/call-layout.component';
import { CallListComponent } from './call-list/call-list.component';
import { CallPanelComponent } from './call-panel/call-panel.component';
import { CallRoutingModule } from './call-routing.module';

@NgModule({
  declarations: [
    CallLayoutComponent,
    CallListComponent,
    CallPanelComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    CallRoutingModule
  ],
})
export class CallModule { }
