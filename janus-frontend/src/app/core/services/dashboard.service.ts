import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardMetrics, DashboardFilter } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/dashboard`;

  getMetrics(filter?: DashboardFilter): Observable<DashboardMetrics> {
    let params = new HttpParams();
    if (filter) {
      if (filter.from) params = params.set('from', filter.from);
      if (filter.to) params = params.set('to', filter.to);
      if (filter.cargoType) params = params.set('cargoType', filter.cargoType);
      if (filter.inspectionType) params = params.set('inspectionType', filter.inspectionType);
      if (filter.agentUsername) params = params.set('agentUsername', filter.agentUsername);
    }
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/metrics`, { params });
  }
}
