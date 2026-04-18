import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account, CreateAccountRequest, AccountContact, CreateAccountContactRequest } from '../models/account.model';
import { CsvImportResponse } from '../models/warehouse.model';
import { PageResponse } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/accounts`;

  getAll(page = 0, size = 10, search?: string): Observable<PageResponse<Account>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<Account>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Account> {
    return this.http.get<Account>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateAccountRequest): Observable<Account> {
    return this.http.post<Account>(this.apiUrl, request);
  }

  update(id: number, request: CreateAccountRequest): Observable<Account> {
    return this.http.put<Account>(`${this.apiUrl}/${id}`, request);
  }

  getContacts(accountId: number): Observable<AccountContact[]> {
    return this.http.get<AccountContact[]>(`${this.apiUrl}/${accountId}/contacts`);
  }

  createContact(accountId: number, request: CreateAccountContactRequest): Observable<AccountContact> {
    return this.http.post<AccountContact>(`${this.apiUrl}/${accountId}/contacts`, request);
  }

  updateContact(accountId: number, contactId: number, request: CreateAccountContactRequest): Observable<AccountContact> {
    return this.http.put<AccountContact>(`${this.apiUrl}/${accountId}/contacts/${contactId}`, request);
  }

  deleteContact(accountId: number, contactId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${accountId}/contacts/${contactId}`);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/api/accounts/export`,
      { responseType: 'blob' }
    );
  }

  importCsv(file: File): Observable<CsvImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CsvImportResponse>(
      `${environment.apiUrl}/api/accounts/import`,
      formData
    );
  }
}
