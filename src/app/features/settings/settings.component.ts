import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  template: `
    <div class="flex flex-col h-full bg-white dark:bg-gray-900">
      <!-- Header -->
      <div class="h-16 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center px-6">
        <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Settings</h1>
      </div>
      
      <!-- Content -->
      <div class="flex-1 p-6">
        <div class="max-w-2xl mx-auto space-y-6">
          <!-- Profile Section -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Profile</h2>
            <div class="flex items-center gap-4">
              <img src="assets/google.svg" class="w-16 h-16 rounded-full" alt="profile" />
              <div>
                <h3 class="font-medium text-gray-900 dark:text-gray-100">Your Name</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">+1 234 567 8900</p>
              </div>
            </div>
          </div>
          
          <!-- Theme Section -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-gray-100">Theme</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
              </div>
              <app-theme-toggle></app-theme-toggle>
            </div>
          </div>
          
          <!-- Notifications Section -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notifications</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-900 dark:text-gray-100">Message notifications</span>
                <input type="checkbox" checked class="rounded" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-900 dark:text-gray-100">Call notifications</span>
                <input type="checkbox" checked class="rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent { }