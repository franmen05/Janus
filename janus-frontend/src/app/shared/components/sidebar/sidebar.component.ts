import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="sidebar p-3">
      <ul class="nav flex-column">
        <li class="nav-item">
          <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" routerLink="/operations" routerLinkActive="active">Operations</a>
        </li>
        @if (authService.hasRole(['ADMIN', 'AGENT'])) {
          <li class="nav-item">
            <a class="nav-link" routerLink="/clients" routerLinkActive="active">Clients</a>
          </li>
        }
        @if (authService.hasRole(['ADMIN'])) {
          <li class="nav-item">
            <a class="nav-link" routerLink="/audit" routerLinkActive="active">Audit Log</a>
          </li>
        }
      </ul>
    </nav>
  `
})
export class SidebarComponent {
  authService = inject(AuthService);
}
