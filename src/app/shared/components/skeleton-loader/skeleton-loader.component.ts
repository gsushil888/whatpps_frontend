import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-skeleton-loader',
    templateUrl: './skeleton-loader.component.html',
    styleUrls: ['./skeleton-loader.component.css']
})
export class SkeletonLoaderComponent {
    @Input() width: string = '100%';
    @Input() height: string = '20px';
    @Input() borderRadius: string = '8px';
    @Input() circle: boolean = false;
    @Input() count: number = 1;
    @Input() animated: boolean = true;
}
