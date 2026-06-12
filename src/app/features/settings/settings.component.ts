import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserProfile, UserService } from '../chat/services/user.service';

interface SettingsItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  currentUser: UserProfile | null = null;
  selectedSetting: string = '';
  isMobile = window.innerWidth < 790;

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth < 790; }

  settingsItems: SettingsItem[] = [
    { id: 'account', label: 'Account', icon: 'fas fa-user' },
    { id: 'privacy', label: 'Privacy', icon: 'fas fa-lock' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'appearance', label: 'Appearance', icon: 'fas fa-palette' },
    { id: 'help', label: 'Help', icon: 'fas fa-question-circle' }
  ];

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  selectSetting(id: string) {
    this.selectedSetting = id;
  }

  clearSelection() {
    this.selectedSetting = '';
  }

  goHome() {
    this.router.navigate(['/home/chat']);
  }

  getSelectedSettingTitle(): string {
    const setting = this.settingsItems.find(item => item.id === this.selectedSetting);
    return setting ? setting.label : '';
  }
}