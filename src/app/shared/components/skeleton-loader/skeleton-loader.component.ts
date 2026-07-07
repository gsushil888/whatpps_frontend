import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-skeleton-loader',
    templateUrl: './skeleton-loader.component.html',
    styleUrls: ['./skeleton-loader.component.css']
})
export class SkeletonLoaderComponent implements OnInit {
    @Input() width: string = '100%';
    @Input() height: string = '20px';
    @Input() borderRadius: string = '8px';
    @Input() circle: boolean = false;
    @Input() count: number = 1;
    @Input() animated: boolean = true;

    ngOnInit(): void {
        console.log("Constructed SkeletonLoader Component...");
    }
}
