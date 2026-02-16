import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Declaration, CreateDeclarationRequest,
  TariffLine, CreateTariffLineRequest,
  CrossingResult, ResolveCrossingRequest
} from '../models/declaration.model';

@Injectable({ providedIn: 'root' })
export class DeclarationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDeclarations(operationId: number): Observable<Declaration[]> {
    return this.http.get<Declaration[]>(`${this.apiUrl}/api/operations/${operationId}/declarations`);
  }

  getDeclaration(operationId: number, id: number): Observable<Declaration> {
    return this.http.get<Declaration>(`${this.apiUrl}/api/operations/${operationId}/declarations/${id}`);
  }

  createPreliminary(operationId: number, request: CreateDeclarationRequest): Observable<Declaration> {
    return this.http.post<Declaration>(`${this.apiUrl}/api/operations/${operationId}/declarations/preliminary`, request);
  }

  createFinal(operationId: number, request: CreateDeclarationRequest): Observable<Declaration> {
    return this.http.post<Declaration>(`${this.apiUrl}/api/operations/${operationId}/declarations/final`, request);
  }

  getTariffLines(operationId: number, declarationId: number): Observable<TariffLine[]> {
    return this.http.get<TariffLine[]>(`${this.apiUrl}/api/operations/${operationId}/declarations/${declarationId}/tariff-lines`);
  }

  addTariffLine(operationId: number, declarationId: number, request: CreateTariffLineRequest): Observable<TariffLine> {
    return this.http.post<TariffLine>(`${this.apiUrl}/api/operations/${operationId}/declarations/${declarationId}/tariff-lines`, request);
  }

  executeCrossing(operationId: number): Observable<CrossingResult> {
    return this.http.post<CrossingResult>(`${this.apiUrl}/api/operations/${operationId}/declarations/crossing/execute`, {});
  }

  resolveCrossing(operationId: number, request: ResolveCrossingRequest): Observable<CrossingResult> {
    return this.http.post<CrossingResult>(`${this.apiUrl}/api/operations/${operationId}/declarations/crossing/resolve`, request);
  }

  getCrossing(operationId: number): Observable<CrossingResult | null> {
    return this.http.get<CrossingResult>(`${this.apiUrl}/api/operations/${operationId}/declarations/crossing`, {
      observe: 'response'
    }).pipe(
      map(response => response.status === 204 ? null : response.body),
      catchError(() => of(null))
    );
  }
}
