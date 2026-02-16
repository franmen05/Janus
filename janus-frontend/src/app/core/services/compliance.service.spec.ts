import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComplianceService } from './compliance.service';
import { environment } from '../../../environments/environment';
import { ValidationResult } from '../models/compliance.model';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let httpMock: HttpTestingController;

  const apiUrl = environment.apiUrl;

  const mockResult: ValidationResult = {
    passed: true,
    errors: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ComplianceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validate', () => {
    it('should call GET /api/operations/{id}/compliance/validate with targetStatus', () => {
      service.validate(1, 'DOCUMENTATION_COMPLETE').subscribe(result => {
        expect(result).toEqual(mockResult);
      });
      const req = httpMock.expectOne(r => r.url === `${apiUrl}/api/operations/1/compliance/validate`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('targetStatus')).toBe('DOCUMENTATION_COMPLETE');
      req.flush(mockResult);
    });

    it('should handle validation failure', () => {
      const failResult: ValidationResult = {
        passed: false,
        errors: [{ ruleCode: 'DOCS_INCOMPLETE', message: 'Documents not complete' }]
      };
      service.validate(1, 'DOCUMENTATION_COMPLETE').subscribe(result => {
        expect(result.passed).toBeFalse();
        expect(result.errors.length).toBe(1);
      });
      const req = httpMock.expectOne(r => r.url === `${apiUrl}/api/operations/1/compliance/validate`);
      req.flush(failResult);
    });
  });
});
