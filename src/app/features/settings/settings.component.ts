import { Component, OnInit } from '@angular/core';
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
  selectedSetting: string = 'account';

  settingsItems: SettingsItem[] = [
    { id: 'account', label: 'Account', icon: 'fas fa-user' },
    { id: 'privacy', label: 'Privacy', icon: 'fas fa-lock' },
    { id: 'notifications', label: 'Notifications', icon: 'fas fa-bell' },
    { id: 'appearance', label: 'Appearance', icon: 'fas fa-palette' },
    { id: 'help', label: 'Help', icon: 'fas fa-question-circle' }
  ];

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  selectSetting(id: string) {
    this.selectedSetting = id;
  }
}