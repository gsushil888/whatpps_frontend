import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { RouterModule } from '@angular/router';
import { LoaderComponent } from './components/loader/loader.component';
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';
import { ProblemPageComponent } from './components/problem-page/problem-page.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { ToastComponent } from './components/toast/toast.component';

@NgModule({
    declarations: [
        SkeletonLoaderComponent,
        LoaderComponent,
        ProblemPageComponent,
        ThemeToggleComponent,
        ToastComponent,
    ],
    imports: [
        CommonModule,
        RouterModule
    ],
    exports: [
        SkeletonLoaderComponent,
        LoaderComponent,
        ThemeToggleComponent,
        ToastComponent
    ]
})
export class SharedModule { }
