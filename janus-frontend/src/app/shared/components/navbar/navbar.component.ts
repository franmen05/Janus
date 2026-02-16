import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/dashboard">
          <strong>Janus</strong>
          <small class="text-muted ms-2">Customs Management</small>
        </a>
        <div class="collapse navbar-collapse justify-content-end">
          @if (authService.isAuthenticated()) {
            <ul class="navbar-nav">
              <li class="nav-item">
                <span class="nav-link text-light">
                  {{ authService.user()?.fullName }} ({{ authService.user()?.role }})
                </span>
              </li>
              <li class="nav-item">
                <button class="btn btn-outline-light btn-sm ms-2" (click)="authService.logout()">Logout</button>
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
}
