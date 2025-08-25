import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
    // private baseUrl = 'http://localhost:8080/api/auth';

    // constructor(private http: HttpClient) { }

    // login(credentials: { username: string; password: string }): Observable<any> {
    //     return this.http.post(`${this.baseUrl}/login`, credentials);
    // }

    // register(data: any): Observable<any> {
    //     return this.http.post(`${this.baseUrl}/register`, data);
    // }

    // verifyOtp(data: { userId: string; otp: string }): Observable<any> {
    //     return this.http.post(`${this.baseUrl}/verify-otp`, data);
    // }

    // googleLogin(token: string): Observable<any> {
    //     return this.http.post(`${this.baseUrl}/google`, { token });
    // }
}
