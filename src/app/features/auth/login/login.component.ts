import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Client } from '@stomp/stompjs';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { TokenService } from 'src/app/core/services/token.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ToastService } from 'src/app/shared/services/toast.service';
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
    private loader: LoaderService,
    private authService: AuthService,
    private tokenService: TokenService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeForm();

    if (this.authService.isAuthenticated()) {
      this.loader.showSpinner();
      this.authService.validateSession().subscribe({
        next: (response) => {
          this.loader.hideSpinner();
          if (response.valid || response.success) {
            this.router.navigate(['/home']);
          } else {
            this.tokenService.clearTokens();
          }
        },
        error: () => {
          this.loader.hideSpinner();
          this.tokenService.clearTokens();
        }
      });
    }
  }

  private initializeForm(): void {
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
      const payload = {
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      };
      this.authService.login(payload).subscribe({
        next: (response) => {
          this.loader.hideSpinner();
          if (response.success) {
            if (response.data.requiresOtp) {
              this.authService.setTempSessionId(response.data.tempSessionId, response.data.expiresIn);
              this.toast.success(response.data.message || response.message);
              this.router.navigate(['/auth/otp']);
            } else {
              this.tokenService.setAccessToken(response.data.session.accessToken);
              this.tokenService.setRefreshToken(response.data.session.refreshToken);
              if (response.data.user?.id) {
                localStorage.setItem('userId', response.data.user.id.toString());
              }
              this.toast.success(response.message);
              this.router.navigate(['/home']);
            }
          }
        },
        error: (error) => {
          this.loader.hideSpinner();
          this.toast.error(error.error?.message || 'Login failed');
        }
      });
    } else if (this.isMobileFlow && this.loginForm.get('mobile')?.valid) {
      this.loader.showSpinner();
      const payload = {
        mobile: this.loginForm.value.mobile
      };
      this.authService.login(payload).subscribe({
        next: (response) => {
          this.loader.hideSpinner();
          if (response.success) {
            if (response.data.requiresOtp) {
              this.authService.setTempSessionId(response.data.tempSessionId, response.data.expiresIn);
              this.toast.success(response.data.message || response.message);
              this.router.navigate(['/auth/otp']);
            } else {
              this.tokenService.setAccessToken(response.data.session.accessToken);
              this.tokenService.setRefreshToken(response.data.session.refreshToken);
              if (response.data.user?.id) {
                localStorage.setItem('userId', response.data.user.id.toString());
              }
              this.toast.success(response.message);
              this.router.navigate(['/home']);
            }
          }
        },
        error: (error) => {
          this.loader.hideSpinner();
          this.toast.error(error.error?.message || 'Login failed');
        }
      });
    }
  }

  // =======


  private stompClient!: Client;

  loginWithGoogle() {
    this.router.navigate(['/home']);
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }



}
