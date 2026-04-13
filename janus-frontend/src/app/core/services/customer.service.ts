import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Customer, CreateCustomerRequest, CustomerContact, CreateCustomerContactRequest } from '../models/customer.model';
import { PageResponse } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/customers`;

  getAll(page = 0, size = 10, search?: string): Observable<PageResponse<Customer>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (search) params = params.set('search', search);
    return this.http.get<PageResponse<Customer>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, request);
  }

  update(id: number, request: CreateCustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, request);
  }

  getContacts(customerId: number): Observable<CustomerContact[]> {
    return this.http.get<CustomerContact[]>(`${this.apiUrl}/${customerId}/contacts`);
  }

  createContact(customerId: number, request: CreateCustomerContactRequest): Observable<CustomerContact> {
    return this.http.post<CustomerContact>(`${this.apiUrl}/${customerId}/contacts`, request);
  }

  updateContact(customerId: number, contactId: number, request: CreateCustomerContactRequest): Observable<CustomerContact> {
    return this.http.put<CustomerContact>(`${this.apiUrl}/${customerId}/contacts/${contactId}`, request);
  }

  deleteContact(customerId: number, contactId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${customerId}/contacts/${contactId}`);
  }
}
