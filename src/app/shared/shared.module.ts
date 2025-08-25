import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { RouterModule } from '@angular/router';
import { LoaderComponent } from './components/loader/loader.component';
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';
import { ProblemPageComponent } from './components/problem-page/problem-page.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';

@NgModule({
    declarations: [
        SkeletonLoaderComponent,
        LoaderComponent,
        ProblemPageComponent,
        ThemeToggleComponent,
    ],
    imports: [
        CommonModule,
        RouterModule
    ],
    exports: [
        SkeletonLoaderComponent,
        LoaderComponent,
        ThemeToggleComponent
    ]
})
export class SharedModule { }
