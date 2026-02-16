import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { signal, computed } from '@angular/core';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  const mockUser = { fullName: 'Admin User', role: 'ADMIN', username: 'admin' };
  const isAuthenticatedSignal = signal(false);

  const mockAuthService = {
    isAuthenticated: computed(() => isAuthenticatedSignal()),
    user: computed(() => isAuthenticatedSignal() ? mockUser : null),
    role: computed(() => isAuthenticatedSignal() ? mockUser.role : null),
    logout: jasmine.createSpy('logout'),
    hasRole: jasmine.createSpy('hasRole').and.returnValue(true)
  };

  const mockLanguageService = {
    currentLanguage: signal('es'),
    availableLanguages: [
      { code: 'es', label: 'Espanol' },
      { code: 'en', label: 'English' }
    ],
    setLanguage: jasmine.createSpy('setLanguage')
  };

  beforeEach(async () => {
    isAuthenticatedSignal.set(false);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterModule.forRoot([]), TranslateModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show logout button when authenticated', () => {
    isAuthenticatedSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector('button.btn-outline-light');
    expect(logoutButton).toBeTruthy();
  });

  it('should show user name when authenticated', () => {
    isAuthenticatedSignal.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const userSpan = compiled.querySelector('.text-light');
    expect(userSpan?.textContent).toContain('Admin User');
  });

  it('should not show user info when not authenticated', () => {
    isAuthenticatedSignal.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const logoutButton = compiled.querySelector('button.btn-outline-light');
    expect(logoutButton).toBeNull();
  });
});
