import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { RouterModule } from '@angular/router';
import { LoaderComponent } from './components/loader/loader.component';
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';
import { ProblemPageComponent } from './components/problem-page/problem-page.component';

@NgModule({
    declarations: [
        SkeletonLoaderComponent,
        LoaderComponent,
        ProblemPageComponent,
    ],
    imports: [
        CommonModule,
        RouterModule
    ],
    exports: [
        SkeletonLoaderComponent,
        LoaderComponent
    ]
})
export class SharedModule { }
