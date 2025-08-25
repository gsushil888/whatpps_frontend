import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-problem-page',
  templateUrl: './problem-page.component.html',
  styleUrls: ['./problem-page.component.css']
})
export class ProblemPageComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'We are working on it. Please try again later.';
  @Input() showRetry = true;

  lastUrl: string | null = null;
  showConfirm = false;
  loading = false;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.lastUrl = nav?.previousNavigation?.finalUrl?.toString() || null;
  }

  // Step 1: Ask for confirmation
  retryConfirm() {
    this.showConfirm = true;
  }

  // Step 2: Proceed with retry
  proceedRetry() {
    this.showConfirm = false;
    this.loading = true;

    setTimeout(() => { // simulate loader delay
      if (this.lastUrl) {
        this.router.navigateByUrl(this.lastUrl, { replaceUrl: true });
      } else {
        window.location.reload();
      }
    }, 1200);
  }

  cancelRetry() {
    this.showConfirm = false;
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
