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
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/dashboard">
          <strong>{{ 'APP.TITLE' | translate }}</strong>
          <small class="text-muted ms-2 d-none d-sm-inline">{{ 'APP.SUBTITLE' | translate }}</small>
        </a>
        @if (authService.isAuthenticated()) {
          <button class="navbar-toggler" type="button" (click)="toggleMenu()">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" [ngbCollapse]="menuCollapsed()">
            <ul class="navbar-nav ms-auto">
              <li class="nav-item d-lg-none">
                <a class="nav-link" routerLink="/dashboard" routerLinkActive="active" (click)="closeMenu()">{{ 'NAV.DASHBOARD' | translate }}</a>
              </li>
              <li class="nav-item d-lg-none">
                <a class="nav-link" routerLink="/operations" routerLinkActive="active" (click)="closeMenu()">{{ 'NAV.OPERATIONS' | translate }}</a>
              </li>
              @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                <li class="nav-item d-lg-none">
                  <a class="nav-link" routerLink="/clients" routerLinkActive="active" (click)="closeMenu()">{{ 'NAV.CLIENTS' | translate }}</a>
                </li>
              }
              @if (authService.hasRole(['ADMIN'])) {
                <li class="nav-item d-lg-none">
                  <a class="nav-link" routerLink="/users" routerLinkActive="active" (click)="closeMenu()">{{ 'NAV.USERS' | translate }}</a>
                </li>
              }
              @if (authService.hasRole(['ADMIN', 'AGENT'])) {
                <li class="nav-item d-lg-none">
                  <a class="nav-link" routerLink="/alerts" routerLinkActive="active" (click)="closeMenu()">{{ 'NAV.ALERTS' | translate }}</a>
                </li>
              }
              @if (authService.hasRole(['ADMIN'])) {
                <li class="nav-item d-lg-none">
                  <a class="nav-link" routerLink="/audit" routerLinkActive="active" (click)="closeMenu()">{{ 'NAV.AUDIT_LOG' | translate }}</a>
                </li>
              }
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
              <li class="nav-item">
                <span class="nav-link text-light">
                  {{ authService.user()?.fullName }}
                  <span class="badge bg-secondary ms-1">{{ authService.user()?.role }}</span>
                </span>
              </li>
              <li class="nav-item">
                <button class="btn btn-outline-light btn-sm ms-2 my-1" (click)="authService.logout()">{{ 'NAV.LOGOUT' | translate }}</button>
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
