import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExchangeRate, CreateExchangeRateRequest, AutoFetchStatus } from '../models/exchange-rate.model';

@Injectable({ providedIn: 'root' })
export class ExchangeRateService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/exchange-rates`;

  getAll(): Observable<ExchangeRate[]> {
    return this.http.get<ExchangeRate[]>(this.apiUrl);
  }

  getById(id: number): Observable<ExchangeRate> {
    return this.http.get<ExchangeRate>(`${this.apiUrl}/${id}`);
  }

  getCurrent(): Observable<ExchangeRate> {
    return this.http.get<ExchangeRate>(`${this.apiUrl}/current`);
  }

  getForDate(date: string): Observable<ExchangeRate> {
    return this.http.get<ExchangeRate>(`${this.apiUrl}/for-date`, { params: { date } });
  }

  create(request: CreateExchangeRateRequest): Observable<ExchangeRate> {
    return this.http.post<ExchangeRate>(this.apiUrl, request);
  }

  update(id: number, request: CreateExchangeRateRequest): Observable<ExchangeRate> {
    return this.http.put<ExchangeRate>(`${this.apiUrl}/${id}`, request);
  }

  fetchCurrentRate(): Observable<ExchangeRate> {
    return this.http.post<ExchangeRate>(`${this.apiUrl}/fetch`, null);
  }

  getAutoFetchStatus(): Observable<AutoFetchStatus> {
    return this.http.get<AutoFetchStatus>(`${this.apiUrl}/auto-fetch/status`);
  }

  toggleAutoFetch(enabled: boolean, hour?: number, minute?: number): Observable<AutoFetchStatus> {
    return this.http.put<AutoFetchStatus>(`${this.apiUrl}/auto-fetch/toggle`, { enabled, hour, minute });
  }
}
