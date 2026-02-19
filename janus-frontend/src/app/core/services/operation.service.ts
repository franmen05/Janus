import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Operation, CreateOperationRequest, ChangeStatusRequest, StatusHistory } from '../models/operation.model';
import { CompletenessResponse } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class OperationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/operations`;

  getAll(status?: string, clientId?: number): Observable<Operation[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (clientId) params = params.set('clientId', clientId.toString());
    return this.http.get<Operation[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Operation> {
    return this.http.get<Operation>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateOperationRequest): Observable<Operation> {
    return this.http.post<Operation>(this.apiUrl, request);
  }

  update(id: number, request: CreateOperationRequest): Observable<Operation> {
    return this.http.put<Operation>(`${this.apiUrl}/${id}`, request);
  }

  changeStatus(id: number, request: ChangeStatusRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/change-status`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getHistory(id: number): Observable<StatusHistory[]> {
    return this.http.get<StatusHistory[]>(`${this.apiUrl}/${id}/history`);
  }

  getCompleteness(id: number): Observable<CompletenessResponse> {
    return this.http.get<CompletenessResponse>(`${this.apiUrl}/${id}/documents/completeness`);
  }

  getAllowedTransitions(id: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${id}/allowed-transitions`);
  }
}
