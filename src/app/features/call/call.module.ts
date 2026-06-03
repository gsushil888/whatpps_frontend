import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CallLayoutComponent } from './call-layout/call-layout.component';
import { CallListComponent } from './call-list/call-list.component';
import { CallPanelComponent } from './call-panel/call-panel.component';
import { CallRoutingModule } from './call-routing.module';
import { IncomingCallComponent } from './incoming-call/incoming-call.component';

@NgModule({
  declarations: [
    CallLayoutComponent,
    CallListComponent,
    CallPanelComponent,
    IncomingCallComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CallRoutingModule
  ],
  exports: [IncomingCallComponent, CallPanelComponent]
})
export class CallModule { }
