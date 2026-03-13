import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Port, CreatePortRequest } from '../models/port.model';

@Injectable({ providedIn: 'root' })
export class PortService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/ports`;

  getAll(): Observable<Port[]> {
    return this.http.get<Port[]>(this.apiUrl);
  }

  getById(id: number): Observable<Port> {
    return this.http.get<Port>(`${this.apiUrl}/${id}`);
  }

  create(request: CreatePortRequest): Observable<Port> {
    return this.http.post<Port>(this.apiUrl, request);
  }

  update(id: number, request: CreatePortRequest): Observable<Port> {
    return this.http.put<Port>(`${this.apiUrl}/${id}`, request);
  }
}
