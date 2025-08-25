// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { LoaderService } from './shared/services/loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

  constructor(private router: Router, private loader: LoaderService) { }
  // themeClass = 'bg-whatsapp-gradient text-white';
  // constructor(public themeService: ThemeService) { }

  // ngOnInit() {
  //   // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  //   // this.themeService.setTheme(prefersDark);
  // }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.loader.showProgress();
      }
      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.loader.hideProgress();
      }
    });
  }
}
