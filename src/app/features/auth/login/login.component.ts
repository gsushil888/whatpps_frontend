import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ViewportService } from 'src/app/shared/services/viewport.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  isUsernameFlow = false;
  isMobileFlow = false;
  isMobileView = false;

  private sub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private viewport: ViewportService,
    private loader: LoaderService
  ) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: [''],
      password: [''],
      countryCode: ['+91'],
      mobile: ['', [Validators.pattern(/^\d{10}$/)]],
    });

    // subscribe to viewport service
    this.sub = this.viewport.isMobileView$.subscribe(
      (val) => (this.isMobileView = val)
    );
  }

  onUsernameChange() {
    const username = this.loginForm.get('username')?.value;

    if (username && this.loginForm.get('username')?.dirty) {
      this.isUsernameFlow = true;
      this.isMobileFlow = false;

      this.loginForm.get('mobile')?.reset();
      this.loginForm.get('password')?.setValidators([
        Validators.required,
        Validators.minLength(6),
      ]);
    } else {
      this.isUsernameFlow = false;
      this.loginForm.get('password')?.clearValidators();
    }

    this.loginForm.get('password')?.updateValueAndValidity();
  }

  onMobileChange() {
    const mobile = this.loginForm.get('mobile')?.value;

    if (mobile && this.loginForm.get('mobile')?.dirty) {
      this.isMobileFlow = true;
      this.isUsernameFlow = false;

      this.loginForm.get('username')?.reset();
      this.loginForm.get('password')?.reset();
    } else {
      this.isMobileFlow = false;
    }
  }

  onSubmit() {
    if (this.isUsernameFlow && this.loginForm.valid) {
      this.loader.showSpinner();
      setTimeout(() => {
        this.loader.hideSpinner();
        this.router.navigate(['/auth/otp']);
      }, 1500);
    } else if (this.isMobileFlow && this.loginForm.get('mobile')?.valid) {
      this.loader.showSpinner();
      setTimeout(() => {
        this.loader.hideSpinner();
        this.router.navigate(['/auth/otp']);
      }, 1500);
    }
  }

  loginWithGoogle() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }
}
