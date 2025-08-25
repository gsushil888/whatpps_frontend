import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { HomeLayoutComponent } from './home-layout/home-layout.component';
import { HomeRoutingModule } from './home-routing.module';
import { SidebarComponent } from './sidebar/sidebar.component';

@NgModule({
  declarations: [
    HomeLayoutComponent,
    SidebarComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    HomeRoutingModule
  ],
  exports: [
    HomeLayoutComponent,
    SidebarComponent
  ]
})
export class HomeModule { }
