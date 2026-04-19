import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BondedWarehouse, CreateBondedWarehouseRequest, CsvImportResponse } from '../models/bonded-warehouse.model';

@Injectable({ providedIn: 'root' })
export class BondedWarehouseService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/warehouses/bonded`;

  getAll(includeInactive = false): Observable<BondedWarehouse[]> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<BondedWarehouse[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<BondedWarehouse> {
    return this.http.get<BondedWarehouse>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateBondedWarehouseRequest): Observable<BondedWarehouse> {
    return this.http.post<BondedWarehouse>(this.apiUrl, request);
  }

  update(id: number, request: CreateBondedWarehouseRequest): Observable<BondedWarehouse> {
    return this.http.put<BondedWarehouse>(`${this.apiUrl}/${id}`, request);
  }

  toggleActive(id: number): Observable<BondedWarehouse> {
    return this.http.patch<BondedWarehouse>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportCsv(includeInactive: boolean): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/api/warehouses/bonded/export?includeInactive=${includeInactive}`,
      { responseType: 'blob' }
    );
  }

  importCsv(file: File): Observable<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CsvImportResponse>(
      `${environment.apiUrl}/api/warehouses/bonded/import`,
      formData
    );
  }
}
