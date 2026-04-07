import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiKey, ApiKeyCreated, CreateApiKeyRequest } from '../models/api-key.model';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/api-keys`;

  getAll(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(this.apiUrl);
  }

  create(request: CreateApiKeyRequest): Observable<ApiKeyCreated> {
    return this.http.post<ApiKeyCreated>(this.apiUrl, request);
  }

  revoke(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
