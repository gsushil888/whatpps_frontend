import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private accessToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  loadFromStorage(): void {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (token) this.accessToken = token;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getUserId(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      return payload?.sub || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  clearTokens(): void {
    this.accessToken = null;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = this.decodeToken(token);
      const exp = payload?.exp;
      if (!exp) return true;

      return Date.now() >= exp * 1000;
    } catch (error) {
      return true;
    }
  }
}
