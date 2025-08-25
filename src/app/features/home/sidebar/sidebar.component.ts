import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
  sidebarItems: SidebarItem[] = [
    { label: 'Chats', icon: 'fas fa-comments', route: 'chat' },
    { label: 'Status', icon: 'fas fa-circle-notch', route: 'status' },
    { label: 'Calls', icon: 'fas fa-phone', route: 'call' },
  ];

  settingsItem: SidebarItem = { label: 'Settings', icon: 'fas fa-cog', route: 'settings' };

  activeRoute: string = '';

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.activeRoute = this.router.url.split('/')[2] || '';
    });
  }

  ngOnInit(): void {
    this.activeRoute = this.router.url.split('/')[2] || '';
  }

  navigate(item: SidebarItem) {
    console.log('🔄 Sidebar navigate clicked:', item);
    console.log('🔄 Current URL before navigation:', this.router.url);
    this.router.navigate(['/home', item.route]).then(success => {
      console.log('🔄 Navigation success:', success);
      console.log('🔄 New URL after navigation:', this.router.url);
    });
  }
}


