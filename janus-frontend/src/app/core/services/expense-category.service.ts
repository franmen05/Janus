import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExpenseCategoryConfig, CreateExpenseCategoryRequest, UpdateExpenseCategoryRequest } from '../models/expense-category.model';

@Injectable({ providedIn: 'root' })
export class ExpenseCategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/expense-categories`;

  getAll(): Observable<ExpenseCategoryConfig[]> {
    return this.http.get<ExpenseCategoryConfig[]>(`${this.apiUrl}/all`);
  }

  getActive(): Observable<ExpenseCategoryConfig[]> {
    return this.http.get<ExpenseCategoryConfig[]>(this.apiUrl);
  }

  create(request: CreateExpenseCategoryRequest): Observable<ExpenseCategoryConfig> {
    return this.http.post<ExpenseCategoryConfig>(this.apiUrl, request);
  }

  update(id: number, request: UpdateExpenseCategoryRequest): Observable<ExpenseCategoryConfig> {
    return this.http.put<ExpenseCategoryConfig>(`${this.apiUrl}/${id}`, request);
  }

  toggle(id: number): Observable<ExpenseCategoryConfig> {
    return this.http.put<ExpenseCategoryConfig>(`${this.apiUrl}/${id}/toggle`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
