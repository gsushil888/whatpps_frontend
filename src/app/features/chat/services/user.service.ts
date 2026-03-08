import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/core/services/token.service';

export interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  phoneNumber: string;
  email: string;
  about: string;
  profilePictureUrl: string;
  isOnline: boolean;
  lastActiveAt: string;
  accountType: string;
  privacySettings: {
    lastSeenVisibility: string;
    profilePhotoVisibility: string;
    statusVisibility: string;
    readReceiptsEnabled: boolean;
    groupsVisibility: string;
  };
  createdAt: string;
}

export interface UserProfileResponse {
  success: boolean;
  data: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = environment.apiBaseUrl + 'users/me';
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  loadCurrentUser(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(this.API_URL, { headers: this.tokenService.getAuthHeaders() }).pipe(
      tap(response => {
        if (response.success) {
          this.currentUserSubject.next(response.data);
        }
      })
    );
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  setUserFromLogin(userData: any) {
    const user: UserProfile = {
      id: userData.id,
      username: userData.username,
      displayName: userData.displayName,
      phoneNumber: userData.phoneNumber,
      email: userData.email,
      about: userData.aboutText || '',
      profilePictureUrl: userData.profilePictureUrl,
      isOnline: userData.isOnline,
      lastActiveAt: userData.lastSeenAt,
      accountType: userData.accountType,
      privacySettings: {
        lastSeenVisibility: 'CONTACTS',
        profilePhotoVisibility: 'EVERYONE',
        statusVisibility: 'CONTACTS',
        readReceiptsEnabled: true,
        groupsVisibility: 'CONTACTS'
      },
      createdAt: ''
    };
    this.currentUserSubject.next(user);
  }

  clearUser() {
    this.currentUserSubject.next(null);
    this.tokenService.clearTokens();
  }
}
