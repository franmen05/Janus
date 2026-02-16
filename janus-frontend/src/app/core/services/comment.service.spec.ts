import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CommentService } from './comment.service';
import { environment } from '../../../environments/environment';
import { Comment, CreateCommentRequest } from '../models/comment.model';

describe('CommentService', () => {
  let service: CommentService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/api/operations`;

  const mockComment: Comment = {
    id: 1,
    operationId: 1,
    authorUsername: 'admin',
    authorFullName: 'Admin User',
    content: 'Test comment',
    createdAt: '2024-01-01T00:00:00'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CommentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getComments', () => {
    it('should call GET /api/operations/{id}/comments', () => {
      service.getComments(1).subscribe(comments => {
        expect(comments).toEqual([mockComment]);
      });
      const req = httpMock.expectOne(`${apiUrl}/1/comments`);
      expect(req.request.method).toBe('GET');
      req.flush([mockComment]);
    });
  });

  describe('addComment', () => {
    it('should call POST /api/operations/{id}/comments', () => {
      const request: CreateCommentRequest = { content: 'New comment' };
      service.addComment(1, request).subscribe(comment => {
        expect(comment).toEqual(mockComment);
      });
      const req = httpMock.expectOne(`${apiUrl}/1/comments`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockComment);
    });
  });
});
