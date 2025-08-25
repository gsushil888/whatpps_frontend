import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from 'src/app/shared/services/loader.service';


@Component({
  selector: 'app-otp-verification',
  templateUrl: './otp-verification.component.html'
})
export class OtpVerificationComponent {
  mobile: string | null = null;

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
    private loaderService: LoaderService
  ) {
    this.mobile = this.route.snapshot.queryParamMap.get('mobile');
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
    if (this.otpForm.valid) {
      const otp = Object.values(this.otpForm.value).join('');
      console.log('Verifying OTP:', otp, 'for mobile:', this.mobile);

      this.loaderService.showSpinner();

      setTimeout(() => {
        this.loaderService.hideSpinner();

        this.router.navigate(['/home']);
      }, 2000);
    }
  }
}
