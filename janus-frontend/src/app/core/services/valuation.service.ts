import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Operation } from '../models/operation.model';
import {
  ExternalPermit, ExternalPermitRequest,
  ValuationChecklist, GattFormResponse, UpdateGattFormRequest
} from '../models/valuation.model';

@Injectable({ providedIn: 'root' })
export class ValuationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getChecklist(operationId: number): Observable<ValuationChecklist> {
    return this.http.get<ValuationChecklist>(`${this.apiUrl}/api/operations/${operationId}/valuation/checklist`);
  }

  getPermits(operationId: number): Observable<ExternalPermit[]> {
    return this.http.get<ExternalPermit[]>(`${this.apiUrl}/api/operations/${operationId}/valuation/permits`);
  }

  createPermit(operationId: number, request: ExternalPermitRequest): Observable<ExternalPermit> {
    return this.http.post<ExternalPermit>(`${this.apiUrl}/api/operations/${operationId}/valuation/permits`, request);
  }

  updatePermit(operationId: number, permitId: number, request: ExternalPermitRequest): Observable<ExternalPermit> {
    return this.http.put<ExternalPermit>(`${this.apiUrl}/api/operations/${operationId}/valuation/permits/${permitId}`, request);
  }

  deletePermit(operationId: number, permitId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/operations/${operationId}/valuation/permits/${permitId}`);
  }

  getGattForm(operationId: number): Observable<GattFormResponse> {
    return this.http.get<GattFormResponse>(`${this.apiUrl}/api/operations/${operationId}/valuation/gatt-form`);
  }

  saveGattForm(operationId: number, request: UpdateGattFormRequest): Observable<GattFormResponse> {
    return this.http.put<GattFormResponse>(`${this.apiUrl}/api/operations/${operationId}/valuation/gatt-form`, request);
  }

  finalizeValuation(operationId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/operations/${operationId}/valuation/finalize`, {});
  }

  toggleLocalChargesValidated(operationId: number, value: boolean): Observable<Operation> {
    return this.http.patch<Operation>(`${this.apiUrl}/api/operations/${operationId}/valuation/local-charges-validated`, { validated: value });
  }
}
