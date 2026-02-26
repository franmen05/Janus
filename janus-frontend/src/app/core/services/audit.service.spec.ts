import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuditService } from './audit.service';
import { environment } from '../../../environments/environment';
import { AuditLog, AuditAction } from '../models/audit.model';

describe('AuditService', () => {
  let service: AuditService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/audit`;

  const mockAuditLog: AuditLog = {
    id: 1,
    username: 'admin',
    ipAddress: '127.0.0.1',
    action: AuditAction.CREATE,
    entityName: 'Operation',
    entityId: 1,
    operationId: 1,
    previousData: null,
    newData: null,
    details: 'Created operation OP-2024-0001',
    createdAt: '2024-01-01T00:00:00'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    service = TestBed.inject(AuditService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should call GET /api/audit', () => {
      service.getAll().subscribe(logs => {
        expect(logs).toEqual([mockAuditLog]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([mockAuditLog]);
    });

    it('should pass username param when provided', () => {
      service.getAll('admin').subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('username')).toBe('admin');
      req.flush([mockAuditLog]);
    });
  });

  describe('getByOperation', () => {
    it('should call GET /api/audit/operations/{opId}', () => {
      service.getByOperation(1).subscribe(logs => {
        expect(logs).toEqual([mockAuditLog]);
      });

      const req = httpMock.expectOne(`${apiUrl}/operations/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockAuditLog]);
    });
  });
});
