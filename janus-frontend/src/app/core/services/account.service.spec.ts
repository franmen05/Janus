import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AccountService } from './account.service';
import { environment } from '../../../environments/environment';
import { Account, AccountType, CreateAccountRequest } from '../models/account.model';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/accounts`;

  const mockAccount: Account = {
    id: 1,
    name: 'Test Account',
    taxId: 'TAX-001',
    email: 'account@test.com',
    phone: '+1234567890',
    address: '123 Main St',
    accountTypes: [AccountType.COMPANY],
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

    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should call GET /api/accounts', () => {
      service.getAll().subscribe(accounts => {
        expect(accounts).toEqual([mockAccount]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush([mockAccount]);
    });
  });

  describe('getById', () => {
    it('should call GET /api/accounts/{id}', () => {
      service.getById(1).subscribe(account => {
        expect(account).toEqual(mockAccount);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAccount);
    });
  });

  describe('create', () => {
    it('should call POST /api/accounts', () => {
      const request: CreateAccountRequest = {
        name: 'New Account',
        taxId: 'TAX-002',
        email: 'new@test.com',
        accountTypes: [AccountType.COMPANY],
        phone: '+9876543210',
        address: '456 Oak Ave'
      };

      service.create(request).subscribe(account => {
        expect(account).toEqual(mockAccount);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockAccount);
    });
  });

  describe('update', () => {
    it('should call PUT /api/accounts/{id}', () => {
      const request: CreateAccountRequest = {
        name: 'Updated Account',
        taxId: 'TAX-001',
        email: 'updated@test.com',
        accountTypes: [AccountType.CONSIGNEE]
      };

      service.update(1, request).subscribe(account => {
        expect(account).toEqual(mockAccount);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockAccount);
    });
  });
});
