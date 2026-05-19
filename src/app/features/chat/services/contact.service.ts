import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/core/services/token.service';

export interface Contact {
  id: number;
  contactUserId: number;
  customName: string | null;
  displayName: string;
  phoneNumber: string;
  profilePictureUrl: string;
  isOnline: boolean;
  isFavorite: boolean;
  isBlocked: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface ContactResponse {
  success: boolean;
  data: {
    contacts: Contact[];
    totalCount: number;
    pagination: {
      page: number;
      limit: number;
      hasNext: boolean;
    };
  };
}

export interface AddContactRequest {
  phoneNumber: string;
  displayName?: string;
}

export interface AddContactResponse {
  success: boolean;
  message: string;
  data: Contact;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly API_URL = environment.apiBaseUrl + 'contacts';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) { }

  getContacts(page: number = 1, limit: number = 50): Observable<ContactResponse> {
    const url = `${this.API_URL}?page=${page}&limit=${limit}`;
    return this.http.get<ContactResponse>(url, { headers: this.tokenService.getAuthHeaders() });
  }

  addContact(request: AddContactRequest): Observable<AddContactResponse> {
    return this.http.post<AddContactResponse>(this.API_URL, request, { headers: this.tokenService.getAuthHeaders() });
  }

  deleteContact(contactId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/${contactId}`, { headers: this.tokenService.getAuthHeaders() });
  }
}
