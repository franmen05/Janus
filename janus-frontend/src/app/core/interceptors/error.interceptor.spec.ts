import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { environment } from '../../../environments/environment';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should redirect to /login on 401 error', () => {
    spyOn(router, 'navigate');

    httpClient.get(`${environment.apiUrl}/api/operations`).subscribe({
      error: () => {
        // Error expected
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/operations`);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not redirect on other errors (e.g. 500)', () => {
    spyOn(router, 'navigate');

    httpClient.get(`${environment.apiUrl}/api/operations`).subscribe({
      error: () => {
        // Error expected
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/operations`);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should pass through successful responses', () => {
    spyOn(router, 'navigate');
    const mockData = [{ id: 1 }];

    httpClient.get(`${environment.apiUrl}/api/operations`).subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/operations`);
    req.flush(mockData);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should re-throw the error', () => {
    let errorResponse: HttpErrorResponse | undefined;

    httpClient.get(`${environment.apiUrl}/api/operations`).subscribe({
      error: (err: HttpErrorResponse) => {
        errorResponse = err;
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/operations`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(errorResponse).toBeDefined();
    expect(errorResponse!.status).toBe(404);
  });
});
