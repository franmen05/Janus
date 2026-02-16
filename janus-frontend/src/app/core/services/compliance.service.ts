import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ValidationResult } from '../models/compliance.model';

@Injectable({ providedIn: 'root' })
export class ComplianceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  validate(operationId: number, targetStatus: string): Observable<ValidationResult> {
    const params = new HttpParams().set('targetStatus', targetStatus);
    return this.http.get<ValidationResult>(`${this.apiUrl}/api/operations/${operationId}/compliance/validate`, { params });
  }
}
