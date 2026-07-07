import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserProfile, UserService } from '../../chat/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  currentUser: UserProfile | null = null;
  isMobile = window.innerWidth < 790;

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth < 790; }

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit() {
    console.log("Constructed Profile Component...");
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  goHome() {
    this.router.navigate(['/home/chat']);
  }
}
