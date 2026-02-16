import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockState = { url: '/operations' } as RouterStateSnapshot;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj('AuthService', ['hasRole']);

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should allow access when user has required role', () => {
    authServiceMock.hasRole.and.returnValue(true);
    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, mockState));

    expect(result).toBeTrue();
    expect(authServiceMock.hasRole).toHaveBeenCalledWith(['ADMIN']);
  });

  it('should redirect to /dashboard when user lacks required role', () => {
    authServiceMock.hasRole.and.returnValue(false);
    const route = { data: { roles: ['ADMIN'] } } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, mockState));

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });

  it('should redirect to /dashboard when no roles are defined in route data', () => {
    const route = { data: {} } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() => roleGuard(route, mockState));

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
