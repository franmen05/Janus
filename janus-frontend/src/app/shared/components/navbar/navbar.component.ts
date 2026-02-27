import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbDropdownModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NgbDropdownModule, NgbCollapseModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark navbar-janus">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center" routerLink="/dashboard">
          <i class="bi bi-layers-half me-2" style="color: #6ea8fe; font-size: 1.5rem;"></i>
          <strong>JANUS</strong>
          <small class="text-muted ms-2 d-none d-sm-inline">{{ 'APP.SUBTITLE' | translate }}</small>
        </a>
        @if (authService.isAuthenticated()) {
          <button class="navbar-toggler" type="button" (click)="toggleMenu()">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" [ngbCollapse]="menuCollapsed()">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item d-lg-none">
                <a class="nav-link" routerLink="/dashboard" routerLinkActive="active" (click)="closeMenu()">
                  <i class="bi bi-speedometer2 me-2"></i>{{ 'NAV.DASHBOARD' | translate }}
                </a>
              </li>
              <li class="nav-item d-lg-none">
                <a class="nav-link" routerLink="/operations" routerLinkActive="active" (click)="closeMenu()">
                  <i class="bi bi-box-seam me-2"></i>{{ 'NAV.OPERATIONS' | translate }}
                </a>
              </li>
              @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                <li class="nav-item d-lg-none">
                  <a class="nav-link" routerLink="/clients" routerLinkActive="active" (click)="closeMenu()">
                    <i class="bi bi-people me-2"></i>{{ 'NAV.CLIENTS' | translate }}
                  </a>
                </li>
              }
              @if (authService.hasRole(['ADMIN'])) {
                <li class="nav-item d-lg-none">
                  <a class="nav-link" routerLink="/users" routerLinkActive="active" (click)="closeMenu()">
                    <i class="bi bi-person-gear me-2"></i>{{ 'NAV.USERS' | translate }}
                  </a>
                </li>
              }
              @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                <li class="nav-item d-lg-none">
                  <a class="nav-link" routerLink="/alerts" routerLinkActive="active" (click)="closeMenu()">
                    <i class="bi bi-bell me-2"></i>{{ 'NAV.ALERTS' | translate }}
                  </a>
                </li>
              }
              @if (authService.hasRole(['ADMIN'])) {
                <li class="nav-item d-lg-none">
                  <a class="nav-link" routerLink="/audit" routerLinkActive="active" (click)="closeMenu()">
                    <i class="bi bi-journal-text me-2"></i>{{ 'NAV.AUDIT_LOG' | translate }}
                  </a>
                </li>
              }
              <li class="d-lg-none"><hr class="dropdown-divider border-secondary"></li>
              <li class="d-lg-none nav-item">
                <span class="nav-link text-light">
                  <i class="bi bi-person-circle me-2"></i>
                  {{ authService.user()?.fullName }}
                  <span class="badge bg-primary bg-opacity-25 text-primary-emphasis ms-1">{{ authService.user()?.role }}</span>
                </span>
              </li>
              <li class="d-lg-none nav-item">
                <button class="btn btn-outline-secondary btn-sm ms-3 my-1" (click)="authService.logout()">
                  <i class="bi bi-box-arrow-right me-1"></i>{{ 'NAV.LOGOUT' | translate }}
                </button>
              </li>
              <li class="d-lg-none"><hr class="dropdown-divider border-secondary"></li>
              <li class="nav-item" ngbDropdown>
                <a class="nav-link" ngbDropdownToggle role="button">
                  {{ langService.currentLanguage().toUpperCase() }}
                </a>
                <div ngbDropdownMenu class="dropdown-menu-end">
                  @for (lang of langService.availableLanguages; track lang.code) {
                    <button ngbDropdownItem [class.active]="lang.code === langService.currentLanguage()" (click)="langService.setLanguage(lang.code)">{{ lang.label }}</button>
                  }
                </div>
              </li>
            </ul>
          </div>
        }
      </div>
    </nav>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  langService = inject(LanguageService);
  menuCollapsed = signal(true);

  toggleMenu(): void {
    this.menuCollapsed.update(v => !v);
  }

  closeMenu(): void {
    this.menuCollapsed.set(true);
  }
}
