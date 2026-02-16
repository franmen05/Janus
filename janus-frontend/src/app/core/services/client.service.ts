import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client, CreateClientRequest } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/clients`;

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl);
  }

  getById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateClientRequest): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, request);
  }

  update(id: number, request: CreateClientRequest): Observable<Client> {
    return this.http.put<Client>(`${this.apiUrl}/${id}`, request);
  }
}
