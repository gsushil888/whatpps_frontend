import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Attachment } from '../models/chat.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UploadService {
    constructor(private api: ApiService) { }

    // single canonical upload() method that returns the Observable from ApiService
    upload(file: File): Observable<Attachment> {
        return this.api.upload(file);
    }

    // (Optional) alias if you prefer a different name
    // uploadFile(file: File): Observable<Attachment> { return this.upload(file); }
}
