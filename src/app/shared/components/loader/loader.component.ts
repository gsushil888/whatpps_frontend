// src/app/shared/components/loader/loader.component.ts
import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.css']
})
export class LoaderComponent implements OnInit {
  constructor(public loader: LoaderService) { }
  ngOnInit(): void {
    console.log("Constructed Loader Component...");
  }
}
