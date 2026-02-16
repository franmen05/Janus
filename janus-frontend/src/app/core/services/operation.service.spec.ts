import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OperationService } from './operation.service';
import { environment } from '../../../environments/environment';
import {
  Operation, CreateOperationRequest, ChangeStatusRequest,
  OperationStatus, CargoType, InspectionType, StatusHistory
} from '../models/operation.model';
import { CompletenessResponse } from '../models/document.model';

describe('OperationService', () => {
  let service: OperationService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/operations`;

  const mockOperation: Operation = {
    id: 1,
    referenceNumber: 'OP-2024-0001',
    clientId: 1,
    clientName: 'Test Client',
    cargoType: CargoType.FCL,
    inspectionType: InspectionType.EXPRESS,
    status: OperationStatus.DRAFT,
    assignedAgentId: 1,
    assignedAgentName: 'Agent One',
    notes: null,
    deadline: null,
    closedAt: null,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    service = TestBed.inject(OperationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should call GET /api/operations', () => {
      service.getAll().subscribe(ops => {
        expect(ops).toEqual([mockOperation]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush([mockOperation]);
    });

    it('should pass status param when provided', () => {
      service.getAll('DRAFT').subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('status')).toBe('DRAFT');
      expect(req.request.params.has('clientId')).toBeFalse();
      req.flush([]);
    });

    it('should pass clientId param when provided', () => {
      service.getAll(undefined, 5).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('clientId')).toBe('5');
      expect(req.request.params.has('status')).toBeFalse();
      req.flush([]);
    });

    it('should pass both status and clientId params when provided', () => {
      service.getAll('CLOSED', 3).subscribe();

      const req = httpMock.expectOne(r => r.url === apiUrl);
      expect(req.request.params.get('status')).toBe('CLOSED');
      expect(req.request.params.get('clientId')).toBe('3');
      req.flush([]);
    });
  });

  describe('getById', () => {
    it('should call GET /api/operations/{id}', () => {
      service.getById(1).subscribe(op => {
        expect(op).toEqual(mockOperation);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOperation);
    });
  });

  describe('create', () => {
    it('should call POST /api/operations', () => {
      const request: CreateOperationRequest = {
        clientId: 1,
        cargoType: CargoType.FCL,
        inspectionType: InspectionType.EXPRESS
      };

      service.create(request).subscribe(op => {
        expect(op).toEqual(mockOperation);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockOperation);
    });
  });

  describe('update', () => {
    it('should call PUT /api/operations/{id}', () => {
      const request: CreateOperationRequest = {
        clientId: 1,
        cargoType: CargoType.LCL,
        inspectionType: InspectionType.VISUAL
      };

      service.update(1, request).subscribe(op => {
        expect(op).toEqual(mockOperation);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockOperation);
    });
  });

  describe('changeStatus', () => {
    it('should call POST /api/operations/{id}/change-status', () => {
      const request: ChangeStatusRequest = {
        newStatus: OperationStatus.DOCUMENTATION_COMPLETE,
        comment: 'All docs ready'
      };

      service.changeStatus(1, request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1/change-status`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(null);
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/operations/{id}', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('getHistory', () => {
    it('should call GET /api/operations/{id}/history', () => {
      const mockHistory: StatusHistory[] = [
        {
          id: 1,
          previousStatus: null,
          newStatus: OperationStatus.DRAFT,
          changedByUsername: 'admin',
          comment: null,
          changedAt: '2024-01-01T00:00:00',
          ipAddress: null
        }
      ];

      service.getHistory(1).subscribe(history => {
        expect(history).toEqual(mockHistory);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/history`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });
  });

  describe('getCompleteness', () => {
    it('should call GET /api/operations/{id}/documents/completeness', () => {
      const mockCompleteness: CompletenessResponse = {
        percentage: 60,
        missingDocuments: [],
        color: 'yellow'
      };

      service.getCompleteness(1).subscribe(c => {
        expect(c).toEqual(mockCompleteness);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/documents/completeness`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCompleteness);
    });
  });
});
