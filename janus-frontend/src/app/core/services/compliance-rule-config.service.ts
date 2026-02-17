import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ComplianceRuleConfig } from '../models/compliance-rule-config.model';

@Injectable({ providedIn: 'root' })
export class ComplianceRuleConfigService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/compliance/config`;

  getAll(): Observable<ComplianceRuleConfig[]> {
    return this.http.get<ComplianceRuleConfig[]>(this.apiUrl);
  }

  update(id: number, config: Partial<ComplianceRuleConfig>): Observable<ComplianceRuleConfig> {
    return this.http.put<ComplianceRuleConfig>(`${this.apiUrl}/${id}`, config);
  }

  create(config: Partial<ComplianceRuleConfig>): Observable<ComplianceRuleConfig> {
    return this.http.post<ComplianceRuleConfig>(this.apiUrl, config);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
