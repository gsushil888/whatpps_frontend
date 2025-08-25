import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  avatars: string[] = [
    'assets/avatars/avatar1.png',
    'assets/avatars/avatar2.png',
    'assets/avatars/avatar3.png',
    'assets/avatars/avatar4.png'
  ];

  selectedAvatar: string | null = null;
  profilePicPreview: string | ArrayBuffer | null = null;

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      nickname: ['', Validators.required],
      profilePic: [null],
      avatar: [null, Validators.required],
    });
  }

  onAvatarSelect(avatar: string) {
    this.selectedAvatar = avatar;
    this.registerForm.patchValue({ avatar });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.registerForm.patchValue({ profilePic: file });
      const reader = new FileReader();
      reader.onload = () => (this.profilePicPreview = reader.result);
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
      // 👉 send to backend
    }
  }
}
