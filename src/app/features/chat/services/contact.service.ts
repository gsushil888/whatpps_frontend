import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenService } from 'src/app/core/services/token.service';
import { environment } from 'src/environments/environment';
import { AddContactRequest, AddContactResponse, ContactResponse } from '../../../core/models/contact.model';


@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private readonly API_URL = environment.apiBaseUrl + 'contacts';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {
    console.log("Constructing Contact Service...");
  }

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
