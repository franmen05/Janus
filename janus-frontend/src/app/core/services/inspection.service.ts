import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Operation } from '../models/operation.model';
import { InspectionPhoto, SetInspectionTypeRequest, InspectionExpense, ExpenseSummary, CreateExpenseRequest } from '../models/inspection.model';

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  setInspectionType(operationId: number, request: SetInspectionTypeRequest): Observable<Operation> {
    return this.http.post<Operation>(`${this.apiUrl}/api/operations/${operationId}/inspection/type`, request);
  }

  getPhotos(operationId: number): Observable<InspectionPhoto[]> {
    return this.http.get<InspectionPhoto[]>(`${this.apiUrl}/api/operations/${operationId}/inspection/photos`);
  }

  uploadPhoto(operationId: number, file: File, caption?: string): Observable<InspectionPhoto> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }
    return this.http.post<InspectionPhoto>(`${this.apiUrl}/api/operations/${operationId}/inspection/photos`, formData);
  }

  getPhotoDownloadUrl(operationId: number, photoId: number): string {
    return `${this.apiUrl}/api/operations/${operationId}/inspection/photos/${photoId}/download`;
  }

  getExpenses(operationId: number): Observable<ExpenseSummary> {
    return this.http.get<ExpenseSummary>(`${this.apiUrl}/api/operations/${operationId}/inspection/expenses`);
  }

  addExpense(operationId: number, request: CreateExpenseRequest): Observable<InspectionExpense> {
    return this.http.post<InspectionExpense>(`${this.apiUrl}/api/operations/${operationId}/inspection/expenses`, request);
  }

  updateExpense(operationId: number, expenseId: number, request: CreateExpenseRequest): Observable<InspectionExpense> {
    return this.http.put<InspectionExpense>(`${this.apiUrl}/api/operations/${operationId}/inspection/expenses/${expenseId}`, request);
  }

  deleteExpense(operationId: number, expenseId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/operations/${operationId}/inspection/expenses/${expenseId}`);
  }
}
