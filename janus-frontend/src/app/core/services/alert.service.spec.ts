import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AlertService } from './alert.service';
import { environment } from '../../../environments/environment';
import { Alert, AlertType, AlertStatus } from '../models/alert.model';

describe('AlertService', () => {
  let service: AlertService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/alerts`;

  const mockAlert: Alert = {
    id: 1, operationId: 1, operationRef: 'OP-2024-0001',
    alertType: AlertType.INACTIVITY_48H, status: AlertStatus.ACTIVE,
    message: 'No activity for 48h', acknowledgedBy: null,
    acknowledgedAt: null, createdAt: '2024-01-01T00:00:00'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AlertService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getActiveAlerts', () => {
    it('should call GET /api/alerts', () => {
      service.getActiveAlerts().subscribe(alerts => {
        expect(alerts).toEqual([mockAlert]);
      });
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush([mockAlert]);
    });
  });

  describe('getByOperation', () => {
    it('should call GET /api/alerts/operations/{id}', () => {
      service.getByOperation(1).subscribe(alerts => {
        expect(alerts).toEqual([mockAlert]);
      });
      const req = httpMock.expectOne(`${apiUrl}/operations/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockAlert]);
    });
  });

  describe('acknowledge', () => {
    it('should call POST /api/alerts/{id}/acknowledge', () => {
      service.acknowledge(1).subscribe(alert => {
        expect(alert).toEqual(mockAlert);
      });
      const req = httpMock.expectOne(`${apiUrl}/1/acknowledge`);
      expect(req.request.method).toBe('POST');
      req.flush(mockAlert);
    });
  });
});
