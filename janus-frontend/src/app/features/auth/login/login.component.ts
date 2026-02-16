import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="row justify-content-center mt-5">
        <div class="col-md-4">
          <div class="card shadow">
            <div class="card-body p-4">
              <h3 class="card-title text-center mb-4">Janus</h3>
              <p class="text-center text-muted mb-4">Customs Management System</p>
              <form (ngSubmit)="onLogin()">
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input type="text" class="form-control" id="username"
                         [(ngModel)]="username" name="username" required autofocus>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="password"
                         [(ngModel)]="password" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100" [disabled]="!username || !password">
                  Sign In
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  username = '';
  password = '';

  onLogin(): void {
    this.authService.login(this.username, this.password);
  }
}
