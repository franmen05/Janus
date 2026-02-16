import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  let translateService: jasmine.SpyObj<TranslateService>;

  const mockUser: User = {
    id: 1,
    username: 'admin',
    fullName: 'Admin User',
    email: 'admin@test.com',
    role: 'ADMIN',
    active: true,
    clientId: null,
    createdAt: '2024-01-01T00:00:00'
  };

  beforeEach(async () => {
    translateService = jasmine.createSpyObj('TranslateService', ['instant']);
    translateService.instant.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: translateService }
      ]
    }).compileComponents();

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have isAuthenticated false initially', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should return null from getAuthHeader initially', () => {
    expect(service.getAuthHeader()).toBeNull();
  });

  describe('login', () => {
    it('should set user and navigate to /dashboard on success', () => {
      spyOn(router, 'navigate');

      service.login('admin', 'password');

      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Basic ${btoa('admin:password')}`);
      req.flush(mockUser);

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.user()).toEqual(mockUser);
      expect(service.role()).toBe('ADMIN');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should clear credentials and alert on error', () => {
      spyOn(window, 'alert');

      service.login('admin', 'wrongpassword');

      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/me`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getAuthHeader()).toBeNull();
      expect(window.alert).toHaveBeenCalledWith('AUTH.INVALID_CREDENTIALS');
    });
  });

  describe('logout', () => {
    it('should clear user and navigate to /login', () => {
      spyOn(router, 'navigate');

      // First login to set state
      service.login('admin', 'password');
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/me`);
      req.flush(mockUser);

      expect(service.isAuthenticated()).toBeTrue();

      // Now logout
      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.user()).toBeNull();
      expect(service.getAuthHeader()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isAuthenticated', () => {
    it('should be true after successful login', () => {
      service.login('admin', 'password');
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/me`);
      req.flush(mockUser);

      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      service.login('admin', 'password');
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/me`);
      req.flush(mockUser);

      expect(service.hasRole(['ADMIN'])).toBeTrue();
      expect(service.hasRole(['ADMIN', 'AGENT'])).toBeTrue();
    });

    it('should return false for non-matching role', () => {
      service.login('admin', 'password');
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/me`);
      req.flush(mockUser);

      expect(service.hasRole(['CLIENT'])).toBeFalse();
      expect(service.hasRole(['AGENT', 'CARRIER'])).toBeFalse();
    });

    it('should return false when no user is logged in', () => {
      expect(service.hasRole(['ADMIN'])).toBeFalse();
    });
  });
});
