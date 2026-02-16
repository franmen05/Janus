import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { environment } from '../../../environments/environment';
import { DashboardMetrics } from '../models/dashboard.model';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/dashboard`;

  const mockMetrics: DashboardMetrics = {
    operationsByStatus: { DRAFT: 5, CLOSED: 3 },
    overdueCount: 2,
    averageTimePerStage: { DRAFT: 24.5, DECLARATION_IN_PROGRESS: 48.0 },
    rejectionRate: 0.15,
    productivityByAgent: [
      { agentUsername: 'agent1', agentFullName: 'Agent One', operationsHandled: 10, operationsClosed: 7 }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMetrics', () => {
    it('should call GET /api/dashboard/metrics', () => {
      service.getMetrics().subscribe(metrics => {
        expect(metrics).toEqual(mockMetrics);
      });
      const req = httpMock.expectOne(`${apiUrl}/metrics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMetrics);
    });

    it('should pass filter params when provided', () => {
      service.getMetrics({ from: '2024-01-01', to: '2024-12-31', cargoType: 'FCL' }).subscribe();
      const req = httpMock.expectOne(r => r.url === `${apiUrl}/metrics`);
      expect(req.request.params.get('from')).toBe('2024-01-01');
      expect(req.request.params.get('to')).toBe('2024-12-31');
      expect(req.request.params.get('cargoType')).toBe('FCL');
      req.flush(mockMetrics);
    });
  });
});
