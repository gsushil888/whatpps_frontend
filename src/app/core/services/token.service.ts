import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CryptoService } from './crypto.service';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private accessToken: string | null = null;

  constructor(private crypto: CryptoService) {}

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    if (this.crypto.isEnabled()) {
      this.crypto.encryptToken(token).then(enc => localStorage.setItem(this.ACCESS_TOKEN_KEY, enc));
    } else {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    }
  }

  async loadFromStorage(): Promise<void> {
    const stored = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (!stored) return;
    if (this.crypto.isEnabled()) {
      try {
        this.accessToken = await this.crypto.decryptToken(stored);
      } catch {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      }
    } else {
      this.accessToken = stored;
    }
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setRefreshToken(token: string): void {
    if (this.crypto.isEnabled()) {
      this.crypto.encryptToken(token).then(enc => localStorage.setItem(this.REFRESH_TOKEN_KEY, enc));
    } else {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
  }

  async getRefreshTokenAsync(): Promise<string | null> {
    const stored = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!stored) return null;
    if (this.crypto.isEnabled()) {
      try {
        return await this.crypto.decryptToken(stored);
      } catch {
        return null;
      }
    }
    return stored;
  }

  getUserId(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      return this.decodeToken(token)?.sub || null;
    } catch {
      return null;
    }
  }

  private decodeToken(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  }

  clearTokens(): void {
    this.accessToken = null;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getAccessToken()}` });
  }

  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    try {
      const exp = this.decodeToken(token)?.exp;
      return !exp || Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  }
}
