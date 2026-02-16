import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private credentials = signal<string | null>(null);
  private translate = inject(TranslateService);

  isAuthenticated = computed(() => this.currentUser() !== null);
  user = computed(() => this.currentUser());
  role = computed(() => this.currentUser()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): void {
    const creds = btoa(`${username}:${password}`);
    this.credentials.set(creds);

    this.http.get<User>(`${environment.apiUrl}/api/users/me`, {
      headers: { 'Authorization': `Basic ${creds}` }
    }).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.credentials.set(null);
        alert(this.translate.instant('AUTH.INVALID_CREDENTIALS'));
      }
    });
  }

  logout(): void {
    this.currentUser.set(null);
    this.credentials.set(null);
    this.router.navigate(['/login']);
  }

  getAuthHeader(): string | null {
    return this.credentials();
  }

  hasRole(roles: string[]): boolean {
    const userRole = this.role();
    return userRole !== null && roles.includes(userRole);
  }
}
