import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Warehouse, CreateWarehouseRequest } from '../models/warehouse.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/warehouses`;

  getAll(includeInactive = false): Observable<Warehouse[]> {
    const params = includeInactive ? { includeInactive: 'true' } : {};
    return this.http.get<Warehouse[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateWarehouseRequest): Observable<Warehouse> {
    return this.http.post<Warehouse>(this.apiUrl, request);
  }

  update(id: number, request: CreateWarehouseRequest): Observable<Warehouse> {
    return this.http.put<Warehouse>(`${this.apiUrl}/${id}`, request);
  }

  toggleActive(id: number): Observable<Warehouse> {
    return this.http.patch<Warehouse>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
