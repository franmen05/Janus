import { Component, inject, OnInit, signal } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbCollapseModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { AlertBadgeComponent } from '../alert-badge/alert-badge.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, TranslateModule, NgbCollapseModule, NgbTooltipModule, AlertBadgeComponent],
  template: `
    <nav class="sidebar d-flex flex-column" [class.collapsed]="sidebarService.collapsed()">
      <div class="sidebar-nav flex-grow-1 pt-3" [class.px-2]="!sidebarService.collapsed()" [class.px-1]="sidebarService.collapsed()">
        @if (!sidebarService.collapsed()) {
          <div class="nav-section-label px-3">{{ 'NAV.SECTION_MAIN' | translate }}</div>
        }
        <ul class="nav flex-column">
          <li class="nav-item">
            <a class="nav-link" routerLink="/dashboard" routerLinkActive="active"
               [ngbTooltip]="sidebarService.collapsed() ? ('NAV.DASHBOARD' | translate) : null"
               placement="end" container="body">
              <i class="bi bi-speedometer2"></i>
              @if (!sidebarService.collapsed()) {
                <span>{{ 'NAV.DASHBOARD' | translate }}</span>
              }
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/operations" routerLinkActive="active"
               [ngbTooltip]="sidebarService.collapsed() ? ('NAV.OPERATIONS' | translate) : null"
               placement="end" container="body">
              <i class="bi bi-box-seam"></i>
              @if (!sidebarService.collapsed()) {
                <span>{{ 'NAV.OPERATIONS' | translate }}</span>
              }
            </a>
          </li>
          @if (authService.hasRole(['ADMIN', 'AGENT'])) {
            <li class="nav-item">
              <a class="nav-link" routerLink="/accounts" routerLinkActive="active"
                 [ngbTooltip]="sidebarService.collapsed() ? ('NAV.ACCOUNTS' | translate) : null"
                 placement="end" container="body">
                <i class="bi bi-people"></i>
                @if (!sidebarService.collapsed()) {
                  <span>{{ 'NAV.ACCOUNTS' | translate }}</span>
                }
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link d-flex align-items-center" routerLink="/alerts" routerLinkActive="active"
                 [ngbTooltip]="sidebarService.collapsed() ? ('NAV.ALERTS' | translate) : null"
                 placement="end" container="body">
                <i class="bi bi-bell"></i>
                @if (!sidebarService.collapsed()) {
                  <span class="flex-grow-1">{{ 'NAV.ALERTS' | translate }}</span>
                  <app-alert-badge />
                }
              </a>
            </li>
          }
        </ul>

        @if (authService.hasRole(['ADMIN', 'SUPERVISOR'])) {
          @if (!sidebarService.collapsed()) {
            <div class="nav-section-label px-3 mt-3">{{ 'NAV.SECTION_ADMIN' | translate }}</div>
          } @else {
            <hr class="border-secondary mx-2 my-2 opacity-25">
          }

          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link" routerLink="/audit" routerLinkActive="active"
                 [ngbTooltip]="sidebarService.collapsed() ? ('NAV.AUDIT_LOG' | translate) : null"
                 placement="end" container="body">
                <i class="bi bi-journal-text"></i>
                @if (!sidebarService.collapsed()) {
                  <span>{{ 'NAV.AUDIT_LOG' | translate }}</span>
                }
              </a>
            </li>
            @if (authService.hasRole(['ADMIN', 'SUPERVISOR'])) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/warehouses" routerLinkActive="active"
                   [ngbTooltip]="sidebarService.collapsed() ? ('NAV.WAREHOUSES' | translate) : null"
                   placement="end" container="body">
                  <i class="bi bi-building"></i>
                  @if (!sidebarService.collapsed()) {
                    <span>{{ 'NAV.WAREHOUSES' | translate }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        }

        @if (authService.hasRole(['ADMIN'])) {
          <div class="nav-group">
            @if (sidebarService.collapsed()) {
              <hr class="border-secondary mx-2 my-2 opacity-25">
            } @else {
              <button class="btn btn-link nav-group-toggle w-100 text-start d-flex align-items-center px-3 py-2"
                      (click)="configCollapsed.set(!configCollapsed())">
                <i class="bi me-2" [class.bi-chevron-down]="!configCollapsed()" [class.bi-chevron-right]="configCollapsed()"></i>
                <span>{{ 'NAV.SECTION_CONFIG' | translate }}</span>
              </button>
            }
            <div [ngbCollapse]="sidebarService.collapsed() ? false : configCollapsed()">
              <ul class="nav flex-column" [class.nav-group-children]="!sidebarService.collapsed()">
                <li class="nav-item">
                  <a class="nav-link" routerLink="/users" routerLinkActive="active"
                     [ngbTooltip]="sidebarService.collapsed() ? ('NAV.USERS' | translate) : null"
                     placement="end" container="body">
                    <i class="bi bi-person-gear"></i>
                    @if (!sidebarService.collapsed()) {
                      <span>{{ 'NAV.USERS' | translate }}</span>
                    }
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/ports" routerLinkActive="active"
                     [ngbTooltip]="sidebarService.collapsed() ? ('NAV.PORTS' | translate) : null"
                     placement="end" container="body">
                    <i class="bi bi-geo-alt"></i>
                    @if (!sidebarService.collapsed()) {
                      <span>{{ 'NAV.PORTS' | translate }}</span>
                    }
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/exchange-rates" routerLinkActive="active"
                     [ngbTooltip]="sidebarService.collapsed() ? ('NAV.EXCHANGE_RATES' | translate) : null"
                     placement="end" container="body">
                    <i class="bi bi-currency-exchange"></i>
                    @if (!sidebarService.collapsed()) {
                      <span>{{ 'NAV.EXCHANGE_RATES' | translate }}</span>
                    }
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/compliance-config" routerLinkActive="active"
                     [ngbTooltip]="sidebarService.collapsed() ? ('NAV.COMPLIANCE_CONFIG' | translate) : null"
                     placement="end" container="body">
                    <i class="bi bi-shield-check"></i>
                    @if (!sidebarService.collapsed()) {
                      <span>{{ 'NAV.COMPLIANCE_CONFIG' | translate }}</span>
                    }
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/document-types" routerLinkActive="active"
                     [ngbTooltip]="sidebarService.collapsed() ? ('NAV.DOCUMENT_TYPES_CONFIG' | translate) : null"
                     placement="end" container="body">
                    <i class="bi bi-file-earmark-ruled"></i>
                    @if (!sidebarService.collapsed()) {
                      <span>{{ 'NAV.DOCUMENT_TYPES_CONFIG' | translate }}</span>
                    }
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin/services" routerLinkActive="active"
                     [ngbTooltip]="sidebarService.collapsed() ? ('NAV.SERVICES' | translate) : null"
                     placement="end" container="body">
                    <i class="bi bi-tag"></i>
                    @if (!sidebarService.collapsed()) {
                      <span>{{ 'NAV.SERVICES' | translate }}</span>
                    }
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" routerLink="/api-keys" routerLinkActive="active"
                     [ngbTooltip]="sidebarService.collapsed() ? ('NAV.API_KEYS' | translate) : null"
                     placement="end" container="body">
                    <i class="bi bi-key"></i>
                    @if (!sidebarService.collapsed()) {
                      <span>{{ 'NAV.API_KEYS' | translate }}</span>
                    }
                  </a>
                </li>
              </ul>
            </div>
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="sidebar-footer py-3 border-top border-secondary"
           [class.px-3]="!sidebarService.collapsed()" [class.px-2]="sidebarService.collapsed()">
        @if (sidebarService.collapsed()) {
          <div class="text-center mb-2"
               [ngbTooltip]="authService.user()?.fullName ?? ''"
               placement="end" container="body">
            <i class="bi bi-person-circle" style="font-size: 1.5rem; color: rgba(255,255,255,0.4);"></i>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm w-100" (click)="onLogout()"
                  [ngbTooltip]="'NAV.LOGOUT' | translate" placement="end" container="body">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        } @else {
          <div class="d-flex align-items-center mb-2">
            <div class="user-avatar me-2">
              <i class="bi bi-person-circle"></i>
            </div>
            <div class="overflow-hidden">
              <div class="text-white text-truncate small fw-medium">{{ authService.user()?.fullName }}</div>
              @for (r of authService.user()?.roles ?? []; track r) { <span class="badge bg-primary bg-opacity-25 text-white small">{{ 'ROLES.' + r | translate }}</span> }
            </div>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm w-100" (click)="onLogout()">
            <i class="bi bi-box-arrow-right me-1"></i>{{ 'NAV.LOGOUT' | translate }}
          </button>
        }
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

    /* Collapsed sidebar: center icons */
    :host-context(.sidebar-collapsed) .nav-link {
      justify-content: center;
      padding: 0.6rem 0.5rem;
      border-left-color: transparent !important;
    }
    :host-context(.sidebar-collapsed) .nav-link.active {
      border-left-color: transparent;
      border-radius: 8px;
    }
    :host-context(.sidebar-collapsed) .nav-link i {
      margin: 0;
      font-size: 1.2rem;
    }

  `]
})
export class SidebarComponent implements OnInit {
  authService = inject(AuthService);
  sidebarService = inject(SidebarService);
  private router = inject(Router);

  configCollapsed = signal(true);

  ngOnInit(): void {
    const url = this.router.url;
    if (url.startsWith('/users') || url.startsWith('/ports') || url.startsWith('/exchange-rates') || url.startsWith('/compliance-config') || url.startsWith('/admin/document-types') || url.startsWith('/admin/services') || url.startsWith('/api-keys')) {
      this.configCollapsed.set(false);
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}
