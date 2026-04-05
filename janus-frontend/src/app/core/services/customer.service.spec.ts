import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CustomerService } from './customer.service';
import { environment } from '../../../environments/environment';
import { Customer, CustomerType, CreateCustomerRequest } from '../models/customer.model';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/customers`;

  const mockCustomer: Customer = {
    id: 1,
    name: 'Test Customer',
    taxId: 'TAX-001',
    email: 'customer@test.com',
    phone: '+1234567890',
    address: '123 Main St',
    customerType: CustomerType.COMPANY,
    active: true,
    createdAt: '2024-01-01T00:00:00'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should call GET /api/customers', () => {
      service.getAll().subscribe(customers => {
        expect(customers).toEqual([mockCustomer]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush([mockCustomer]);
    });
  });

  describe('getById', () => {
    it('should call GET /api/customers/{id}', () => {
      service.getById(1).subscribe(customer => {
        expect(customer).toEqual(mockCustomer);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCustomer);
    });
  });

  describe('create', () => {
    it('should call POST /api/customers', () => {
      const request: CreateCustomerRequest = {
        name: 'New Customer',
        taxId: 'TAX-002',
        email: 'new@test.com',
        customerType: CustomerType.COMPANY,
        phone: '+9876543210',
        address: '456 Oak Ave'
      };

      service.create(request).subscribe(customer => {
        expect(customer).toEqual(mockCustomer);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockCustomer);
    });
  });

  describe('update', () => {
    it('should call PUT /api/customers/{id}', () => {
      const request: CreateCustomerRequest = {
        name: 'Updated Customer',
        taxId: 'TAX-001',
        email: 'updated@test.com',
        customerType: CustomerType.CONSIGNEE
      };

      service.update(1, request).subscribe(customer => {
        expect(customer).toEqual(mockCustomer);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockCustomer);
    });
  });
});
