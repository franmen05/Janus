import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/alerts`;

  getActiveAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.apiUrl);
  }

  getByOperation(operationId: number): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/operations/${operationId}`);
  }

  acknowledge(id: number): Observable<Alert> {
    return this.http.post<Alert>(`${this.apiUrl}/${id}/acknowledge`, {});
  }
}
