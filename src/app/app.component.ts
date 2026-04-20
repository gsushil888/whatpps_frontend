import { Component, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { LoaderService } from './shared/services/loader.service';
import { TokenService } from './core/services/token.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

  constructor(private router: Router, private loader: LoaderService, private tokenService: TokenService) { }

  ngOnInit() {
    this.tokenService.loadFromStorage();
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
