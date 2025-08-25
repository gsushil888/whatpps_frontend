import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StatusLayoutComponent } from './status-layout/status-layout.component';

const routes: Routes = [
    {
        path: '',
        component: StatusLayoutComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class StatusRoutingModule { }