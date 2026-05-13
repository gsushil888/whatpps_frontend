import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, take } from 'rxjs';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { UserService } from '../../chat/services/user.service';
import { TokenService } from 'src/app/core/services/token.service';


@Component({
  selector: 'app-otp-verification',
  templateUrl: './otp-verification.component.html'
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  mobile: string | null = null;
  tempSessionId: string | null = null;
  resendTimer = 60;
  canResend = false;
  private timerSub?: Subscription;

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  otpForm = this.fb.group({
    otp0: ['', [Validators.required, Validators.pattern('[0-9]')]],
    otp1: ['', [Validators.required, Validators.pattern('[0-9]')]],
    otp2: ['', [Validators.required, Validators.pattern('[0-9]')]],
    otp3: ['', [Validators.required, Validators.pattern('[0-9]')]],
    otp4: ['', [Validators.required, Validators.pattern('[0-9]')]],
    otp5: ['', [Validators.required, Validators.pattern('[0-9]')]],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private loaderService: LoaderService,
    private authService: AuthService,
    private toast: ToastService,
    private userService: UserService,
    private tokenService: TokenService
  ) { }

  ngOnInit() {
    this.authService.loadTempSessionId();
    this.authService.getTempSessionId().subscribe(id => this.tempSessionId = id);
    
    const expiresIn = this.authService.getOtpExpiresIn();
    const timestamp = this.authService.getOtpTimestamp();
    if (timestamp) {
      const elapsed = Math.floor((Date.now() - timestamp) / 1000);
      this.resendTimer = Math.max(0, expiresIn - elapsed);
      if (this.resendTimer > 0) {
        this.startResendTimer();
      } else {
        this.canResend = true;
      }
    } else {
      this.resendTimer = expiresIn;
      this.startResendTimer();
    }
  }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
    this.otpForm.get('otp' + index)?.setValue(input.value);

    if (input.value && index < 5) {
      this.otpInputs.toArray()[index + 1].nativeElement.focus();
    }
  }


  onKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && index > 0) {
      this.otpInputs.toArray()[index - 1].nativeElement.focus();
    }
  }

  onVerify() {
    if (this.otpForm.valid && this.tempSessionId) {
      const otp = Object.values(this.otpForm.value).join('');
      this.loaderService.showSpinner();

      this.authService.verifyOtp(this.tempSessionId, otp).subscribe({
        next: (response) => {
          this.loaderService.hideSpinner();
          if (response.success) {
            this.tokenService.setAccessToken(response.data.session.accessToken);
            this.tokenService.setRefreshToken(response.data.session.refreshToken);
            if (response.data.user) {
              this.userService.setUserFromLogin(response.data.user);
            }
            sessionStorage.removeItem('tempSessionId');
            sessionStorage.removeItem('otpTimestamp');
            this.toast.success(response.message || 'Login successful');
            this.router.navigate(['/home']);
          }
        },
        error: (error) => {
          this.loaderService.hideSpinner();
          const message = error.error?.message || 'Invalid OTP';
          if (message.toLowerCase().includes('expired')) {
            this.toast.error(message);
            this.timerSub?.unsubscribe();
            this.resendTimer = 0;
            this.canResend = true;
          } else {
            this.toast.error(message);
          }
        }
      });
    }
  }

  startResendTimer() {
    this.canResend = false;
    if (this.resendTimer <= 0) {
      this.canResend = true;
      return;
    }
    this.timerSub = interval(1000).pipe(take(this.resendTimer)).subscribe(() => {
      this.resendTimer--;
      if (this.resendTimer === 0) this.canResend = true;
    });
  }

  resendOtp() {
    if (this.canResend && this.tempSessionId) {
      this.loaderService.showSpinner();
      this.authService.resendOtp(this.tempSessionId).subscribe({
        next: (response) => {
          this.loaderService.hideSpinner();
          if (response.success) {
            this.toast.success(response.message);
            const expiresIn = response.data.resendAvailableIn || response.data.expiresIn;
            if (expiresIn) {
              this.resendTimer = expiresIn;
              sessionStorage.setItem('otpTimestamp', Date.now().toString());
              sessionStorage.setItem('otpExpiresIn', expiresIn.toString());
              this.startResendTimer();
            }
          }
        },
        error: (error) => {
          this.loaderService.hideSpinner();
          if (error.status === 401 || error.status === 403) {
            sessionStorage.clear();
            this.toast.error('Session expired');
            this.router.navigate(['/auth/login']);
          } else {
            this.toast.error(error.error?.message || 'Failed to resend OTP');
          }
        }
      });
    }
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
  }
}
