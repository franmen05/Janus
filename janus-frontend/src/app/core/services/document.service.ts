import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Document, DocumentVersion } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getByOperation(operationId: number, includeDeleted = false): Observable<Document[]> {
    let url = `${this.baseUrl}/api/operations/${operationId}/documents`;
    if (includeDeleted) {
      url += '?includeDeleted=true';
    }
    return this.http.get<Document[]>(url);
  }

  getById(operationId: number, id: number): Observable<Document> {
    return this.http.get<Document>(`${this.baseUrl}/api/operations/${operationId}/documents/${id}`);
  }

  upload(operationId: number, file: File, documentType: string, changeReason?: string): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (changeReason) {
      formData.append('changeReason', changeReason);
    }
    return this.http.post<Document>(
      `${this.baseUrl}/api/operations/${operationId}/documents`,
      formData
    );
  }

  download(operationId: number, documentId: number): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/api/operations/${operationId}/documents/${documentId}/download`,
      { responseType: 'blob' }
    );
  }

  getVersions(operationId: number, documentId: number): Observable<DocumentVersion[]> {
    return this.http.get<DocumentVersion[]>(
      `${this.baseUrl}/api/operations/${operationId}/documents/${documentId}/versions`
    );
  }

  downloadVersion(operationId: number, documentId: number, version: number): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/api/operations/${operationId}/documents/${documentId}/versions/${version}/download`,
      { responseType: 'blob' }
    );
  }

  delete(operationId: number, documentId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/api/operations/${operationId}/documents/${documentId}`
    );
  }
}
