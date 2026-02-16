import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ClientService } from './client.service';
import { environment } from '../../../environments/environment';
import { Client, CreateClientRequest } from '../models/client.model';

describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/clients`;

  const mockClient: Client = {
    id: 1,
    name: 'Test Client',
    taxId: 'TAX-001',
    email: 'client@test.com',
    phone: '+1234567890',
    address: '123 Main St',
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

    service = TestBed.inject(ClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should call GET /api/clients', () => {
      service.getAll().subscribe(clients => {
        expect(clients).toEqual([mockClient]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush([mockClient]);
    });
  });

  describe('getById', () => {
    it('should call GET /api/clients/{id}', () => {
      service.getById(1).subscribe(client => {
        expect(client).toEqual(mockClient);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockClient);
    });
  });

  describe('create', () => {
    it('should call POST /api/clients', () => {
      const request: CreateClientRequest = {
        name: 'New Client',
        taxId: 'TAX-002',
        email: 'new@test.com',
        phone: '+9876543210',
        address: '456 Oak Ave'
      };

      service.create(request).subscribe(client => {
        expect(client).toEqual(mockClient);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockClient);
    });
  });

  describe('update', () => {
    it('should call PUT /api/clients/{id}', () => {
      const request: CreateClientRequest = {
        name: 'Updated Client',
        taxId: 'TAX-001',
        email: 'updated@test.com'
      };

      service.update(1, request).subscribe(client => {
        expect(client).toEqual(mockClient);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockClient);
    });
  });
});
