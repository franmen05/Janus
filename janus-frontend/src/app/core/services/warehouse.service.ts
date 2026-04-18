import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Warehouse, CreateWarehouseRequest, CsvImportResponse } from '../models/warehouse.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/warehouses`;

  getAll(includeInactive = false): Observable<Warehouse[]> {
    const params: Record<string, string> = includeInactive ? { includeInactive: 'true' } : {};
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

  exportCsv(includeInactive: boolean): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/api/warehouses/export?includeInactive=${includeInactive}`,
      { responseType: 'blob' }
    );
  }

  importCsv(file: File): Observable<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CsvImportResponse>(
      `${environment.apiUrl}/api/warehouses/import`,
      formData
    );
  }
}
