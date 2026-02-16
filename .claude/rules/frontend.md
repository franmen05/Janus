---
description: Frontend development rules for janus-frontend (Angular 20 + Bootstrap)
globs: janus-frontend/**
---

# Frontend: janus-frontend

## Stack
- Angular 20, TypeScript 5.5+, Bootstrap 5
- Package Manager: npm
- Build Tool: Angular CLI

## Conventions
- TypeScript strict mode enabled
- Component-based architecture (standalone components preferred)
- Use signals for reactive state management
- Bootstrap for styling (no custom CSS frameworks)
- Reactive forms over template-driven forms
- RxJS for async operations and state management
- Lazy loading for feature modules

## Project Structure
```
janus-frontend/src/
├── app/
│   ├── core/              # Singleton services, guards, interceptors
│   │   ├── services/      # Global services (auth, api, etc.)
│   │   ├── guards/        # Route guards
│   │   ├── interceptors/  # HTTP interceptors
│   │   └── models/        # Shared interfaces/types
│   ├── shared/            # Shared components, directives, pipes
│   │   ├── components/    # Reusable UI components
│   │   ├── directives/    # Custom directives
│   │   └── pipes/         # Custom pipes
│   ├── features/          # Feature modules
│   │   ├── auth/          # Authentication feature
│   │   ├── dashboard/     # Dashboard feature
│   │   └── ...            # Other features
│   ├── app.component.ts   # Root component
│   ├── app.config.ts      # App configuration
│   └── app.routes.ts      # Route definitions
├── assets/                # Static assets
├── environments/          # Environment configs
└── styles.scss            # Global styles (Bootstrap imports)
```

## Commands
```bash
cd janus-frontend

# Development
ng serve                   # Dev server → http://localhost:4200
ng serve --open            # Dev server + auto-open browser
ng serve --port 4300       # Custom port

# Building
ng build                   # Production build → dist/
ng build --configuration development  # Dev build

# Testing
ng test                    # Unit tests (Jasmine + Karma)
ng test --watch=false      # Run tests once
ng test --code-coverage    # With coverage report

# Linting
ng lint                    # ESLint
ng lint --fix              # Auto-fix issues

# Generate
ng generate component features/users/user-list
ng generate service core/services/user
ng generate guard core/guards/auth
ng generate interface core/models/user
```

## Angular 20 Features

### Standalone Components (Preferred)
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent {
  // Component logic
}
```

### Signals (Reactive State)
```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-body">
        <p>Count: {{ count() }}</p>
        <p>Double: {{ doubleCount() }}</p>
        <button class="btn btn-primary" (click)="increment()">+</button>
      </div>
    </div>
  `
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(value => value + 1);
  }
}
```

### Typed Forms
```typescript
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface LoginForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loginForm = new FormGroup<LoginForm>({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      // Handle login
    }
  }
}
```

## Bootstrap Integration

### Installation
```bash
npm install bootstrap @ng-bootstrap/ng-bootstrap
```

### styles.scss
```scss
// Import Bootstrap
@import 'bootstrap/scss/bootstrap';

// Custom theme variables (before Bootstrap import)
// $primary: #your-color;
// $secondary: #your-color;
```

### Using Bootstrap Components
```typescript
import { Component } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [NgbModule],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-md-6">
          <button class="btn btn-primary">Click me</button>
        </div>
      </div>
    </div>
  `
})
export class ExampleComponent {}
```

## HTTP Client & API Integration

### Service Example
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { User } from '@core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### Environment Configuration
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com'
};
```

## Routing

### Route Configuration
```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
```

## Testing

### Component Test Example
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  let component: UserListComponent;
  let fixture: ComponentFixture<UserListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Key Conventions
- Use `inject()` function for dependency injection in classes
- Prefer standalone components over NgModules
- Use signals for local state, RxJS for async operations
- Bootstrap utility classes for styling (avoid inline styles)
- TypeScript strict mode (no `any` types)
- Lazy load feature modules for better performance
- Use path aliases: `@core`, `@shared`, `@features`, `@environments`

## Common Issues
- **CORS errors**: Configure backend CORS to allow `http://localhost:4200`
- **Bootstrap not working**: Check `styles.scss` imports and `angular.json` configuration
- **Port already in use**: Use `ng serve --port 4300` or kill process on port 4200
- **Module not found**: Run `npm install` to ensure dependencies are installed
