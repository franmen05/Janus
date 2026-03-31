import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Liquidation, Payment, RegisterPaymentRequest } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  generateLiquidation(operationId: number, agencyServiceFee?: number): Observable<Liquidation> {
    const body: { agencyServiceFee?: number } = {};
    if (agencyServiceFee != null) {
      body.agencyServiceFee = agencyServiceFee;
    }
    return this.http.post<Liquidation>(`${this.apiUrl}/api/operations/${operationId}/liquidation`, body);
  }

  getLiquidation(operationId: number): Observable<Liquidation | null> {
    return this.http.get<Liquidation>(`${this.apiUrl}/api/operations/${operationId}/liquidation`, { observe: 'response' }).pipe(
      map(response => response.status === 204 ? null : response.body),
      catchError(() => of(null))
    );
  }

  approveLiquidation(operationId: number, comment?: string): Observable<Liquidation> {
    const body: { comment?: string } = {};
    if (comment) {
      body.comment = comment;
    }
    return this.http.post<Liquidation>(`${this.apiUrl}/api/operations/${operationId}/liquidation/approve`, body);
  }

  makeLiquidationDefinitive(operationId: number): Observable<Liquidation> {
    return this.http.post<Liquidation>(`${this.apiUrl}/api/operations/${operationId}/liquidation/definitive`, {});
  }

  registerPayment(operationId: number, request: RegisterPaymentRequest): Observable<Payment> {
    return this.http.post<Payment>(`${this.apiUrl}/api/operations/${operationId}/liquidation/payment`, request);
  }

  getPayment(operationId: number): Observable<Payment | null> {
    return this.http.get<Payment>(`${this.apiUrl}/api/operations/${operationId}/liquidation/payment`, { observe: 'response' }).pipe(
      map(response => response.status === 204 ? null : response.body),
      catchError(() => of(null))
    );
  }

  getLiquidationConfig(operationId: number): Observable<{ approvalRequired: boolean }> {
    return this.http.get<{ approvalRequired: boolean }>(`${this.apiUrl}/api/operations/${operationId}/liquidation/config`);
  }
}
