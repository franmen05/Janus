import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DocumentService } from './document.service';
import { environment } from '../../../environments/environment';
import { Document, DocumentVersion, DocumentType, DocumentStatus } from '../models/document.model';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiUrl;
  const operationId = 1;
  const documentId = 10;

  const mockDocument: Document = {
    id: documentId,
    operationId: operationId,
    documentType: DocumentType.BL,
    status: DocumentStatus.PENDING,
    active: true,
    latestVersionName: 'bl.pdf',
    latestVersionSize: 1024,
    createdAt: '2024-01-01T00:00:00',
    updatedAt: '2024-01-01T00:00:00'
  };

  const mockVersion: DocumentVersion = {
    id: 1,
    versionNumber: 1,
    originalName: 'bl.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    uploadedByUsername: 'admin',
    uploadedAt: '2024-01-01T00:00:00'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getByOperation', () => {
    it('should call GET /api/operations/{opId}/documents', () => {
      service.getByOperation(operationId).subscribe(docs => {
        expect(docs).toEqual([mockDocument]);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/operations/${operationId}/documents`);
      expect(req.request.method).toBe('GET');
      req.flush([mockDocument]);
    });
  });

  describe('getById', () => {
    it('should call GET /api/operations/{opId}/documents/{id}', () => {
      service.getById(operationId, documentId).subscribe(doc => {
        expect(doc).toEqual(mockDocument);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/operations/${operationId}/documents/${documentId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDocument);
    });
  });

  describe('upload', () => {
    it('should call POST with FormData', () => {
      const file = new File(['content'], 'bl.pdf', { type: 'application/pdf' });

      service.upload(operationId, file, 'BL').subscribe(doc => {
        expect(doc).toEqual(mockDocument);
      });

      const req = httpMock.expectOne(`${baseUrl}/api/operations/${operationId}/documents`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      expect(req.request.body.get('file')).toBeTruthy();
      expect(req.request.body.get('documentType')).toBe('BL');
      req.flush(mockDocument);
    });
  });

  describe('download', () => {
    it('should call GET with responseType blob', () => {
      const blob = new Blob(['pdf-content'], { type: 'application/pdf' });

      service.download(operationId, documentId).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${baseUrl}/api/operations/${operationId}/documents/${documentId}/download`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(blob);
    });
  });

  describe('getVersions', () => {
    it('should call GET /api/operations/{opId}/documents/{docId}/versions', () => {
      service.getVersions(operationId, documentId).subscribe(versions => {
        expect(versions).toEqual([mockVersion]);
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/operations/${operationId}/documents/${documentId}/versions`
      );
      expect(req.request.method).toBe('GET');
      req.flush([mockVersion]);
    });
  });

  describe('downloadVersion', () => {
    it('should call GET with responseType blob for specific version', () => {
      const blob = new Blob(['pdf-content'], { type: 'application/pdf' });

      service.downloadVersion(operationId, documentId, 2).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/operations/${operationId}/documents/${documentId}/versions/2/download`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(blob);
    });
  });

  describe('delete', () => {
    it('should call DELETE /api/operations/{opId}/documents/{docId}', () => {
      service.delete(operationId, documentId).subscribe();

      const req = httpMock.expectOne(
        `${baseUrl}/api/operations/${operationId}/documents/${documentId}`
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
