import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServiceConfig, CreateServiceRequest, UpdateServiceRequest } from '../models/service.model';

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/services`;

  getAll(): Observable<ServiceConfig[]> {
    return this.http.get<ServiceConfig[]>(`${this.apiUrl}/all`);
  }

  getActive(): Observable<ServiceConfig[]> {
    return this.http.get<ServiceConfig[]>(this.apiUrl);
  }

  create(request: CreateServiceRequest): Observable<ServiceConfig> {
    return this.http.post<ServiceConfig>(this.apiUrl, request);
  }

  update(id: number, request: UpdateServiceRequest): Observable<ServiceConfig> {
    return this.http.put<ServiceConfig>(`${this.apiUrl}/${id}`, request);
  }

  toggle(id: number): Observable<ServiceConfig> {
    return this.http.put<ServiceConfig>(`${this.apiUrl}/${id}/toggle`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
