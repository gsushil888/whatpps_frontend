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
    { label: 'Calls', icon: 'fas fa-phone', route: 'call' },
    { label: 'Status', icon: 'fas fa-circle-notch', route: 'status' },
  ];

  constructor(private router: Router) { }
  ngOnInit(): void {
    console.log('🔧 Sidebar loaded');
    console.log('🔧 Current route on sidebar init:', this.router.url);
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


