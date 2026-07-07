import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { TokenService } from 'src/app/core/services/token.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { ViewportService } from 'src/app/shared/services/viewport.service';
import { environment } from 'src/environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
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

    this.waitForGoogle().then(() => {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response: any) => {
          this.handleGoogleToken(response.credential);
        }
      });
    });
  }

  ngAfterViewInit(): void {
    this.waitForGoogle().then(() => {
      google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' }
      );
    });
  }

  private waitForGoogle(): Promise<void> {
    return new Promise(resolve => {
      if (typeof (window as any).google !== 'undefined') {
        resolve();
        return;
      }
      const script = document.querySelector('script[src*="accounts.google.com"]');
      if (script) {
        script.addEventListener('load', () => resolve());
      } else {
        const interval = setInterval(() => {
          if (typeof (window as any).google !== 'undefined') {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      }
    });
  }

  private handleGoogleToken(idToken: string): void {
    this.loader.showSpinner();
    this.authService.googleLogin(idToken).subscribe({
      next: (res) => {
        this.loader.hideSpinner();
        if (res.success) {
          this.tokenService.setAccessToken(res.data.session.accessToken);
          this.tokenService.setRefreshToken(res.data.session.refreshToken);
          if (res.data.user?.id) {
            localStorage.setItem('userId', res.data.user.id.toString());
          }
          this.toast.success(res.message || 'Google login successful');
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.loader.hideSpinner();
        this.toast.error(err.error?.message || 'Google login failed');
      }
    });
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      username: [''],
      password: [''],
      countryCode: ['+91'],
      mobile: ['', [Validators.pattern(/^\d{10}$/)]],
    });

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
      const payload = { mobile: this.loginForm.value.mobile };
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

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }
}
