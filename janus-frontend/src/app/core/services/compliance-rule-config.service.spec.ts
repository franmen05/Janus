import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ComplianceRuleConfigService } from './compliance-rule-config.service';
import { environment } from '../../../environments/environment';
import { ComplianceRuleConfig } from '../models/compliance-rule-config.model';

describe('ComplianceRuleConfigService', () => {
  let service: ComplianceRuleConfigService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/compliance/config`;

  const mockRules: ComplianceRuleConfig[] = [
    { id: 1, ruleCode: 'COMPLETENESS_REQUIRED', paramKey: 'threshold', paramValue: '100', enabled: true, description: 'All documents required' },
    { id: 2, ruleCode: 'HIGH_VALUE_ADDITIONAL_DOC', paramKey: 'minValue', paramValue: '50000', enabled: false, description: 'Extra docs for high value' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ComplianceRuleConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should make GET request to correct URL and return data', () => {
      service.getAll().subscribe(rules => {
        expect(rules).toEqual(mockRules);
        expect(rules.length).toBe(2);
      });
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockRules);
    });

    it('should return empty array when no rules exist', () => {
      service.getAll().subscribe(rules => {
        expect(rules).toEqual([]);
        expect(rules.length).toBe(0);
      });
      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });
  });

  describe('update', () => {
    it('should make PUT request with correct URL and body', () => {
      const updatePayload: Partial<ComplianceRuleConfig> = {
        paramValue: '200',
        enabled: true,
        description: 'Updated description'
      };
      const updatedRule: ComplianceRuleConfig = { ...mockRules[0], ...updatePayload };

      service.update(1, updatePayload).subscribe(result => {
        expect(result).toEqual(updatedRule);
      });
      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatePayload);
      req.flush(updatedRule);
    });
  });

  describe('create', () => {
    it('should make POST request with correct URL and body', () => {
      const newRule: Partial<ComplianceRuleConfig> = {
        ruleCode: 'RESTRICTED_COUNTRY',
        paramKey: 'countryCode',
        paramValue: 'NK',
        enabled: true,
        description: 'Restricted country check'
      };
      const createdRule: ComplianceRuleConfig = { id: 3, ...newRule } as ComplianceRuleConfig;

      service.create(newRule).subscribe(result => {
        expect(result).toEqual(createdRule);
      });
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newRule);
      req.flush(createdRule);
    });
  });

  describe('delete', () => {
    it('should make DELETE request with correct URL', () => {
      service.delete(1).subscribe(result => {
        expect(result).toBeNull();
      });
      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
