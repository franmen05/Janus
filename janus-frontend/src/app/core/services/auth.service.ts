import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { ToastService } from './toast.service';

const STORAGE_KEY_CREDENTIALS = 'janus_credentials';
const STORAGE_KEY_USER = 'janus_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private credentials = signal<string | null>(null);
  private translate = inject(TranslateService);
  private toastService = inject(ToastService);

  isAuthenticated = computed(() => this.currentUser() !== null);
  user = computed(() => this.currentUser());
  role = computed(() => this.currentUser()?.role ?? null);

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  login(username: string, password: string): void {
    const creds = btoa(`${username}:${password}`);
    this.credentials.set(creds);

    this.http.get<User>(`${environment.apiUrl}/api/users/me`, {
      headers: { 'Authorization': `Basic ${creds}` }
    }).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        localStorage.setItem(STORAGE_KEY_CREDENTIALS, creds);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.credentials.set(null);
        this.toastService.error(this.translate.instant('AUTH.INVALID_CREDENTIALS'));
      }
    });
  }

  logout(): void {
    this.currentUser.set(null);
    this.credentials.set(null);
    localStorage.removeItem(STORAGE_KEY_CREDENTIALS);
    localStorage.removeItem(STORAGE_KEY_USER);
    this.router.navigate(['/login']);
  }

  getAuthHeader(): string | null {
    return this.credentials();
  }

  hasRole(roles: string[]): boolean {
    const userRole = this.role();
    return userRole !== null && roles.includes(userRole);
  }

  private restoreSession(): void {
    const storedCreds = localStorage.getItem(STORAGE_KEY_CREDENTIALS);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);

    if (storedCreds && storedUser) {
      this.credentials.set(storedCreds);
      this.currentUser.set(JSON.parse(storedUser));
    }
  }
}
