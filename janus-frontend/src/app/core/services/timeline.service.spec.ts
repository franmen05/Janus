import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TimelineService } from './timeline.service';
import { environment } from '../../../environments/environment';
import { TimelineEventResponse, TimelineEventType } from '../models/timeline.model';

describe('TimelineService', () => {
  let service: TimelineService;
  let httpMock: HttpTestingController;

  const mockEvent: TimelineEventResponse = {
    eventType: TimelineEventType.STATUS_CHANGE,
    description: 'Status changed to DRAFT',
    username: 'admin',
    timestamp: '2024-01-01T00:00:00',
    previousStatus: null,
    newStatus: 'DRAFT',
    metadata: {}
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TimelineService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTimeline', () => {
    it('should call GET /api/operations/{id}/timeline', () => {
      service.getTimeline(1).subscribe(events => {
        expect(events).toEqual([mockEvent]);
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/api/operations/1/timeline`);
      expect(req.request.method).toBe('GET');
      req.flush([mockEvent]);
    });

    it('should pass type param when provided', () => {
      service.getTimeline(1, TimelineEventType.COMMENT).subscribe();
      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/api/operations/1/timeline`);
      expect(req.request.params.get('type')).toBe('COMMENT');
      req.flush([]);
    });
  });
});
