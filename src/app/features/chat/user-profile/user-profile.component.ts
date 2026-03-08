import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UserProfile, UserService } from '../services/user.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  currentUser: UserProfile | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onClose() {
    this.close.emit();
  }
}
