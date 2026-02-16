import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLog } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/audit`;

  getAll(username?: string): Observable<AuditLog[]> {
    let params = new HttpParams();
    if (username) params = params.set('username', username);
    return this.http.get<AuditLog[]>(this.apiUrl, { params });
  }

  getByOperation(operationId: number): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/operations/${operationId}`);
  }
}
