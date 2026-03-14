import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth.service';
import { AlertBadgeComponent } from '../alert-badge/alert-badge.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NgbCollapseModule, AlertBadgeComponent],
  template: `
    <nav class="sidebar d-flex flex-column">
      <div class="sidebar-nav flex-grow-1 px-2 pt-3">
        <div class="nav-section-label px-3">{{ 'NAV.SECTION_MAIN' | translate }}</div>
        <ul class="nav flex-column">
          <li class="nav-item">
            <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
              <i class="bi bi-speedometer2"></i>
              <span>{{ 'NAV.DASHBOARD' | translate }}</span>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/operations" routerLinkActive="active">
              <i class="bi bi-box-seam"></i>
              <span>{{ 'NAV.OPERATIONS' | translate }}</span>
            </a>
          </li>
          @if (authService.hasRole(['ADMIN', 'AGENT'])) {
            <li class="nav-item">
              <a class="nav-link" routerLink="/clients" routerLinkActive="active">
                <i class="bi bi-people"></i>
                <span>{{ 'NAV.CLIENTS' | translate }}</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center" routerLink="/alerts" routerLinkActive="active">
                <i class="bi bi-bell"></i>
                <span class="flex-grow-1">{{ 'NAV.ALERTS' | translate }}</span>
                <app-alert-badge />
              </a>
            </li>
          }
        </ul>

        @if (authService.hasRole(['ADMIN'])) {
          <div class="nav-section-label px-3 mt-3">{{ 'NAV.SECTION_ADMIN' | translate }}</div>

          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link" routerLink="/audit" routerLinkActive="active">
                <i class="bi bi-journal-text"></i>
                <span>{{ 'NAV.AUDIT_LOG' | translate }}</span>
              </a>
            </li>
          </ul>

          <!-- Configuration Section -->
          <div class="nav-group">
            <button class="btn btn-link nav-group-toggle w-100 text-start d-flex align-items-center px-3 py-2"
                    (click)="configCollapsed.set(!configCollapsed())">
              <i class="bi me-2" [class.bi-chevron-down]="!configCollapsed()" [class.bi-chevron-right]="configCollapsed()"></i>
              <span>{{ 'NAV.SECTION_CONFIG' | translate }}</span>
            </button>
            <div [ngbCollapse]="configCollapsed()">
              <ul class="nav flex-column nav-group-children">
                <li class="nav-item">
                  <a class="nav-link" routerLink="/users" routerLinkActive="active">
                    <i class="bi bi-person-gear"></i>
                    <span>{{ 'NAV.USERS' | translate }}</span>
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/ports" routerLinkActive="active">
                    <i class="bi bi-geo-alt"></i>
                    <span>{{ 'NAV.PORTS' | translate }}</span>
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/exchange-rates" routerLinkActive="active">
                    <i class="bi bi-currency-exchange"></i>
                    <span>{{ 'NAV.EXCHANGE_RATES' | translate }}</span>
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance-config" routerLinkActive="active">
                    <i class="bi bi-shield-check"></i>
                    <span>{{ 'NAV.COMPLIANCE_CONFIG' | translate }}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        }
      </div>

      <div class="sidebar-footer px-3 py-3 border-top border-secondary">
        <div class="d-flex align-items-center mb-2">
          <div class="user-avatar me-2">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="overflow-hidden">
            <div class="text-white text-truncate small fw-medium">{{ authService.user()?.fullName }}</div>
            <span class="badge bg-primary bg-opacity-25 text-white small">{{ authService.user()?.role }}</span>
          </div>
        </div>
        <button type="button" class="btn btn-outline-secondary btn-sm w-100" (click)="onLogout()">
          <i class="bi bi-box-arrow-right me-1"></i>{{ 'NAV.LOGOUT' | translate }}
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .nav-group-toggle {
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      letter-spacing: 0.03em;
      border: none;
      background: none;
    }
    .nav-group-toggle:hover {
      color: rgba(255, 255, 255, 0.85);
    }
    .nav-group-children .nav-link {
      padding-left: 2.2rem;
    }
  `]
})
export class SidebarComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  configCollapsed = signal(true);

  ngOnInit(): void {
    const url = this.router.url;
    if (url.startsWith('/users') || url.startsWith('/ports') || url.startsWith('/exchange-rates') || url.startsWith('/compliance-config')) {
      this.configCollapsed.set(false);
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
