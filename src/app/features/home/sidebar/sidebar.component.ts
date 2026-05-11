import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { UserProfile, UserService } from '../../chat/services/user.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  @Input() mobileBottom = false;
  sidebarItems: SidebarItem[] = [
    { label: 'Chats', icon: 'fas fa-comments', route: 'chat' },
    { label: 'Status', icon: 'fas fa-circle-notch', route: 'status' },
    { label: 'Calls', icon: 'fas fa-phone', route: 'call' },
  ];

  settingsItem: SidebarItem = { label: 'Settings', icon: 'fas fa-cog', route: 'settings' };
  activeRoute: string = '';
  currentUser: UserProfile | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.router.events.subscribe(() => {
      this.activeRoute = this.router.url.split('/')[2] || '';
    });
  }

  ngOnInit(): void {
    this.activeRoute = this.router.url.split('/')[2] || '';
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  navigate(item: SidebarItem) {
    console.log('🔄 Sidebar navigate clicked:', item);
    console.log('🔄 Current URL before navigation:', this.router.url);
    this.router.navigate(['/home', item.route]).then(success => {
      console.log('🔄 Navigation success:', success);
      console.log('🔄 New URL after navigation:', this.router.url);
    });
  }

  openProfile() {
    this.router.navigate(['/home', 'profile']);
  }

  logout() {
    this.authService.logout(false).subscribe({
      next: () => {
        this.clearUserData();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.clearUserData();
        this.router.navigate(['/auth/login']);
      }
    });
  }

  private clearUserData() {
    localStorage.clear();
    sessionStorage.clear();
  }
}
