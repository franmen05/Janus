import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NgbDropdownModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/dashboard">
          <strong>{{ 'APP.TITLE' | translate }}</strong>
          <small class="text-muted ms-2">{{ 'APP.SUBTITLE' | translate }}</small>
        </a>
        <div class="collapse navbar-collapse justify-content-end">
          @if (authService.isAuthenticated()) {
            <ul class="navbar-nav">
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
                  {{ authService.user()?.fullName }} ({{ authService.user()?.role }})
                </span>
              </li>
              <li class="nav-item">
                <button class="btn btn-outline-light btn-sm ms-2" (click)="authService.logout()">{{ 'NAV.LOGOUT' | translate }}</button>
              </li>
            </ul>
          }
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  langService = inject(LanguageService);
}
