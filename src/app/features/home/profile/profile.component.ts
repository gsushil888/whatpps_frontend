import { Component, OnInit } from '@angular/core';
import { UserProfile, UserService } from '../../chat/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  currentUser: UserProfile | null = null;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
}
