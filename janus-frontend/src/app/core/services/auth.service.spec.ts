import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

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

function createTranslateSpy(): jasmine.SpyObj<TranslateService> {
  const spy = jasmine.createSpyObj('TranslateService', ['instant']);
  spy.instant.and.callFake((key: string) => key);
  return spy;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.removeItem('janus_credentials');
    localStorage.removeItem('janus_user');

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: createTranslateSpy() }
      ]
    }).compileComponents();

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.removeItem('janus_credentials');
    localStorage.removeItem('janus_user');
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
      expect(localStorage.getItem('janus_credentials')).toBe(btoa('admin:password'));
      expect(localStorage.getItem('janus_user')).toBe(JSON.stringify(mockUser));
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

      service.login('admin', 'password');
      const req = httpMock.expectOne(`${environment.apiUrl}/api/users/me`);
      req.flush(mockUser);

      expect(service.isAuthenticated()).toBeTrue();

      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.user()).toBeNull();
      expect(service.getAuthHeader()).toBeNull();
      expect(localStorage.getItem('janus_credentials')).toBeNull();
      expect(localStorage.getItem('janus_user')).toBeNull();
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

describe('AuthService session restore', () => {
  afterEach(() => {
    localStorage.removeItem('janus_credentials');
    localStorage.removeItem('janus_user');
  });

  it('should restore session from localStorage on init without HTTP validation', async () => {
    const creds = btoa('admin:password');
    localStorage.setItem('janus_credentials', creds);
    localStorage.setItem('janus_user', JSON.stringify(mockUser));

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: createTranslateSpy() }
      ]
    }).compileComponents();

    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.user()).toEqual(mockUser);
    expect(service.getAuthHeader()).toBe(creds);

    httpMock.expectNone(`${environment.apiUrl}/api/users/me`);
  });

  it('should not be authenticated if localStorage is empty', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: createTranslateSpy() }
      ]
    }).compileComponents();

    const service = TestBed.inject(AuthService);
    const httpMock = TestBed.inject(HttpTestingController);

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getAuthHeader()).toBeNull();

    httpMock.expectNone(`${environment.apiUrl}/api/users/me`);
  });
});
