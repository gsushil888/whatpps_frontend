import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiBaseUrl + 'auth';
  private tempSessionId$ = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  login(payload: { username?: string; password?: string; mobile?: string; email?: string }): Observable<any> {
    const token = this.tokenService.getAccessToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Device-Type': this.getDeviceType(),
      'X-Device-OS': this.getOS(),
      'X-Device-Fingerprint': this.getDeviceFingerprint(),
      ...(token && { 'Authorization': `Bearer ${token}` })
    });

    return this.http.post(`${this.API_URL}/login`, payload, { headers });
  }

  verifyOtp(tempSessionId: string, otpCode: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Device-Type': this.getDeviceType(),
      'X-Device-OS': this.getOS(),
      'X-Device-Fingerprint': this.getDeviceFingerprint()
    });
    return this.http.post(`${this.API_URL}/verify-otp`, { tempSessionId, otpCode }, { headers });
  }

  resendOtp(tempSessionId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Device-Type': this.getDeviceType(),
      'X-Device-OS': this.getOS(),
      'X-Device-Fingerprint': this.getDeviceFingerprint()
    });
    return this.http.post(`${this.API_URL}/resend-otp`, { tempSessionId }, { headers });
  }

  setTempSessionId(id: string, expiresIn?: number) {
    this.tempSessionId$.next(id);
    sessionStorage.setItem('tempSessionId', id);
    sessionStorage.setItem('otpTimestamp', Date.now().toString());
    if (expiresIn) {
      sessionStorage.setItem('otpExpiresIn', expiresIn.toString());
    }
  }

  getTempSessionId(): Observable<string | null> {
    return this.tempSessionId$.asObservable();
  }

  loadTempSessionId() {
    const id = sessionStorage.getItem('tempSessionId');
    if (id) this.tempSessionId$.next(id);
  }

  getOtpTimestamp(): number | null {
    const timestamp = sessionStorage.getItem('otpTimestamp');
    return timestamp ? parseInt(timestamp) : null;
  }

  getOtpExpiresIn(): number {
    const expiresIn = sessionStorage.getItem('otpExpiresIn');
    return expiresIn ? parseInt(expiresIn) : 60;
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getAccessToken() && !this.tokenService.isTokenExpired();
  }

  validateSession(): Observable<any> {
    return this.http.get(`${this.API_URL}/validate-session`, { headers: this.tokenService.getAuthHeaders() });
  }

  logout(logoutAllDevices: boolean = false): Observable<any> {
    return this.http.post(`${this.API_URL}/logout`, { logoutAllDevices }, { headers: this.tokenService.getAuthHeaders() });
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.tokenService.getRefreshToken();
    return this.http.post(`${this.API_URL}/refresh`, { refreshToken });
  }

  private getDeviceFingerprint(): string {
    return sessionStorage.getItem('deviceFingerprint') || this.generateFingerprint();
  }

  private generateFingerprint(): string {
    const nav = window.navigator;
    const screen = window.screen;
    const data = `${nav.userAgent}${nav.language}${screen.colorDepth}${screen.width}x${screen.height}${new Date().getTimezoneOffset()}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }
    const fingerprint = Math.abs(hash).toString(36);
    sessionStorage.setItem('deviceFingerprint', fingerprint);
    return fingerprint;
  }

  private getOS(): string {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    return 'unknown';
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) return 'mobile';
    return 'web';
  }
}
