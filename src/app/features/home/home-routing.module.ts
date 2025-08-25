import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeLayoutComponent } from './home-layout/home-layout.component';

const routes: Routes = [
    {
        path: '',
        component: HomeLayoutComponent,
        children: [
            {
                path: 'chat',
                loadChildren: () => import('../chat/chat.module').then(m => m.ChatModule)
            },
            {
                path: 'call',
                loadChildren: () => import('../call/call.module').then(m => m.CallModule)
            },
            {
                path: 'status',
                loadChildren: () => import('../status/status.module').then(m => m.StatusModule)
            },
            {
                path: 'settings',
                loadChildren: () => import('../settings/settings.module').then(m => m.SettingsModule)
            },
            { path: '', redirectTo: 'chat', pathMatch: 'full' }
        ]
    }
];




@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class HomeRoutingModule { }
