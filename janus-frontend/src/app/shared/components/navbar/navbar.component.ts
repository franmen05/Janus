import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
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
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown">
                  {{ langService.currentLanguage().toUpperCase() }}
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                  @for (lang of langService.availableLanguages; track lang.code) {
                    <li><button class="dropdown-item" [class.active]="lang.code === langService.currentLanguage()" (click)="langService.setLanguage(lang.code)">{{ lang.label }}</button></li>
                  }
                </ul>
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
