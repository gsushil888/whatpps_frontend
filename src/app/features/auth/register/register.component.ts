import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  profilePicFile: File | null = null;
  profilePicPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private loader: LoaderService,
    private toast: ToastService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      displayName: ['', Validators.maxLength(100)],
      firstName: [''],
      lastName: [''],
      aboutText: ['', Validators.maxLength(500)],
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.profilePicFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.profilePicPreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    const formData = new FormData();
    const v = this.registerForm.value;
    formData.append('email', v.email);
    formData.append('phoneNumber', v.phoneNumber);
    formData.append('password', v.password);
    if (v.displayName) formData.append('displayName', v.displayName);
    if (v.firstName) formData.append('firstName', v.firstName);
    if (v.lastName) formData.append('lastName', v.lastName);
    if (v.aboutText) formData.append('aboutText', v.aboutText);
    if (this.profilePicFile) formData.append('profilePicture', this.profilePicFile);

    this.loader.showSpinner();
    this.authService.register(formData).subscribe({
      next: (response) => {
        this.loader.hideSpinner();
        if (response.success) {
          this.authService.setTempSessionId(response.data.tempSessionId, response.data.expiresIn);
          this.toast.success(response.message || 'OTP sent. Please verify.');
          this.router.navigate(['/auth/otp']);
        }
      },
      error: (err) => {
        this.loader.hideSpinner();
        this.toast.error(err.error?.message || 'Registration failed');
      }
    });
  }
}
