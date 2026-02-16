import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['getAuthHeader']);

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add auth header to API requests when authenticated', () => {
    authServiceMock.getAuthHeader.and.returnValue('dXNlcjpwYXNz');

    httpClient.get(`${environment.apiUrl}/api/operations`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/operations`);
    expect(req.request.headers.get('Authorization')).toBe('Basic dXNlcjpwYXNz');
    req.flush([]);
  });

  it('should not add auth header when not authenticated', () => {
    authServiceMock.getAuthHeader.and.returnValue(null);

    httpClient.get(`${environment.apiUrl}/api/operations`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/operations`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('should not add auth header to non-API requests', () => {
    authServiceMock.getAuthHeader.and.returnValue('dXNlcjpwYXNz');

    httpClient.get('https://external-service.com/data').subscribe();

    const req = httpMock.expectOne('https://external-service.com/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
