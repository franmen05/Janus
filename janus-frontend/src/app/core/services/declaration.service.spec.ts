import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DeclarationService } from './declaration.service';
import { environment } from '../../../environments/environment';
import {
  Declaration, CreateDeclarationRequest, DeclarationType, CrossingStatus,
  TariffLine, CreateTariffLineRequest, CrossingResult, ResolveCrossingRequest
} from '../models/declaration.model';

describe('DeclarationService', () => {
  let service: DeclarationService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/operations`;

  const mockDeclaration: Declaration = {
    id: 1, operationId: 1, declarationType: DeclarationType.PRELIMINARY,
    declarationNumber: 'DECL-001', fobValue: 1000, cifValue: 1200,
    taxableBase: 1200, totalTaxes: 180, freightValue: 150, insuranceValue: 50,
    gattMethod: 'Method 1', gattCommercialLinks: null, gattCommissions: null, gattUnrecordedTransport: null,
    gattAdjustmentAmount: null, gattJustification: null, gattCompletedAt: null, gattCompletedBy: null,
    notes: null, submittedAt: null, createdAt: '2024-01-01T00:00:00',
    technicalApprovedBy: null, technicalApprovedAt: null, technicalApprovalComment: null,
    finalApprovedBy: null, finalApprovedAt: null, finalApprovalComment: null,
    rejectedBy: null, rejectedAt: null, rejectionComment: null
  };

  const mockTariffLine: TariffLine = {
    id: 1, declarationId: 1, lineNumber: 1, tariffCode: '8471.30',
    description: 'Laptops', quantity: 10, unitValue: 100, totalValue: 1000,
    taxRate: 15, taxAmount: 150
  };

  const mockCrossing: CrossingResult = {
    id: 1, operationId: 1, preliminaryDeclarationId: 1, finalDeclarationId: 2,
    status: CrossingStatus.MATCH, resolvedBy: null, resolutionComment: null,
    resolvedAt: null, discrepancies: [], createdAt: '2024-01-01T00:00:00'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DeclarationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDeclarations', () => {
    it('should call GET /api/operations/{id}/declarations', () => {
      service.getDeclarations(1).subscribe(decls => {
        expect(decls).toEqual([mockDeclaration]);
      });
      const req = httpMock.expectOne(`${apiUrl}/1/declarations`);
      expect(req.request.method).toBe('GET');
      req.flush([mockDeclaration]);
    });
  });

  describe('getDeclaration', () => {
    it('should call GET /api/operations/{id}/declarations/{declId}', () => {
      service.getDeclaration(1, 1).subscribe(decl => {
        expect(decl).toEqual(mockDeclaration);
      });
      const req = httpMock.expectOne(`${apiUrl}/1/declarations/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDeclaration);
    });
  });

  describe('createPreliminary', () => {
    it('should call POST /api/operations/{id}/declarations/preliminary', () => {
      const request: CreateDeclarationRequest = {
        declarationNumber: 'DECL-001', fobValue: 1000, cifValue: 1200,
        taxableBase: 1200, totalTaxes: 180, freightValue: 150, insuranceValue: 50,
        gattMethod: 'Method 1'
      };
      service.createPreliminary(1, request).subscribe(decl => {
        expect(decl).toEqual(mockDeclaration);
      });
      const req = httpMock.expectOne(`${apiUrl}/1/declarations/preliminary`);
      expect(req.request.method).toBe('POST');
      req.flush(mockDeclaration);
    });
  });

  describe('createFinal', () => {
    it('should call POST /api/operations/{id}/declarations/final', () => {
      const request: CreateDeclarationRequest = {
        declarationNumber: 'DECL-002', fobValue: 1000, cifValue: 1200,
        taxableBase: 1200, totalTaxes: 180, freightValue: 150, insuranceValue: 50,
        gattMethod: 'Method 1'
      };
      service.createFinal(1, request).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/1/declarations/final`);
      expect(req.request.method).toBe('POST');
      req.flush(mockDeclaration);
    });
  });

  describe('getTariffLines', () => {
    it('should call GET tariff-lines endpoint', () => {
      service.getTariffLines(1, 1).subscribe(lines => {
        expect(lines).toEqual([mockTariffLine]);
      });
      const req = httpMock.expectOne(`${apiUrl}/1/declarations/1/tariff-lines`);
      expect(req.request.method).toBe('GET');
      req.flush([mockTariffLine]);
    });
  });

  describe('addTariffLine', () => {
    it('should call POST tariff-lines endpoint', () => {
      const request: CreateTariffLineRequest = {
        lineNumber: 1, tariffCode: '8471.30', quantity: 10,
        unitValue: 100, totalValue: 1000, taxRate: 15, taxAmount: 150
      };
      service.addTariffLine(1, 1, request).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/1/declarations/1/tariff-lines`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockTariffLine);
    });
  });

  describe('executeCrossing', () => {
    it('should call POST crossing/execute', () => {
      service.executeCrossing(1).subscribe(result => {
        expect(result).toEqual(mockCrossing);
      });
      const req = httpMock.expectOne(`${apiUrl}/1/declarations/crossing/execute`);
      expect(req.request.method).toBe('POST');
      req.flush(mockCrossing);
    });
  });

  describe('resolveCrossing', () => {
    it('should call POST crossing/resolve', () => {
      const request: ResolveCrossingRequest = { comment: 'Resolved' };
      service.resolveCrossing(1, request).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/1/declarations/crossing/resolve`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockCrossing);
    });
  });

  describe('getCrossing', () => {
    it('should return null for 204 response', () => {
      service.getCrossing(1).subscribe(result => {
        expect(result).toBeNull();
      });
      const req = httpMock.expectOne(`${apiUrl}/1/declarations/crossing`);
      expect(req.request.method).toBe('GET');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
