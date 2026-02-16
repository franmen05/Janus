import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { computed } from '@angular/core';
import { of } from 'rxjs';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  const mockAuthService = {
    isAuthenticated: computed(() => true),
    user: computed(() => ({ fullName: 'Admin User', role: 'ADMIN', username: 'admin' })),
    role: computed(() => 'ADMIN'),
    hasRole: jasmine.createSpy('hasRole').and.callFake((roles: string[]) => roles.includes('ADMIN'))
  };

  const mockAlertService = {
    getActiveAlerts: jasmine.createSpy('getActiveAlerts').and.returnValue(of([]))
  };

  beforeEach(async () => {
    mockAuthService.hasRole.calls.reset();

    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterModule.forRoot([]), TranslateModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AlertService, useValue: mockAlertService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show dashboard and operations links for all users', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    const hrefs = Array.from(links).map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/operations');
  });

  it('should show clients link for ADMIN role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    const hrefs = Array.from(links).map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/clients');
  });

  it('should show alerts link for ADMIN role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    const hrefs = Array.from(links).map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/alerts');
  });

  it('should show audit link for ADMIN role', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('.nav-link');
    const hrefs = Array.from(links).map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/audit');
  });
});
