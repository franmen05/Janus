import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Deposito, CreateDepositoRequest } from '../models/deposito.model';

@Injectable({ providedIn: 'root' })
export class DepositoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/depositos`;

  getAll(): Observable<Deposito[]> {
    return this.http.get<Deposito[]>(this.apiUrl);
  }

  getById(id: number): Observable<Deposito> {
    return this.http.get<Deposito>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateDepositoRequest): Observable<Deposito> {
    return this.http.post<Deposito>(this.apiUrl, request);
  }

  update(id: number, request: CreateDepositoRequest): Observable<Deposito> {
    return this.http.put<Deposito>(`${this.apiUrl}/${id}`, request);
  }
}
