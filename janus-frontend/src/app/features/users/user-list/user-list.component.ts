import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
      <h2>{{ 'USERS.TITLE' | translate }}</h2>
      <a routerLink="/users/new" class="btn btn-primary">{{ 'USERS.NEW' | translate }}</a>
    </div>
    <div class="card">
      <div class="card-body p-0 table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>{{ 'USERS.USERNAME' | translate }}</th>
              <th>{{ 'USERS.FULL_NAME' | translate }}</th>
              <th class="d-none d-md-table-cell">{{ 'USERS.EMAIL' | translate }}</th>
              <th>{{ 'USERS.ROLE' | translate }}</th>
              <th>{{ 'COMMON.STATUS' | translate }}</th>
              <th>{{ 'COMMON.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr>
                <td class="fw-bold">{{ user.username }}</td>
                <td>{{ user.fullName }}</td>
                <td class="d-none d-md-table-cell">{{ user.email }}</td>
                <td><span class="badge bg-info text-dark">{{ 'ROLES.' + user.role | translate }}</span></td>
                <td>
                  <span class="badge" [class]="user.active ? 'bg-success' : 'bg-secondary'">
                    {{ (user.active ? 'USERS.ACTIVE' : 'USERS.INACTIVE') | translate }}
                  </span>
                </td>
                <td class="d-flex flex-wrap gap-1">
                  <a [routerLink]="['/users', user.id, 'edit']" class="btn btn-sm btn-outline-primary">{{ 'ACTIONS.EDIT' | translate }}</a>
                  <button class="btn btn-sm" [class]="user.active ? 'btn-outline-warning' : 'btn-outline-success'" (click)="toggleActive(user)">
                    {{ (user.active ? 'USERS.INACTIVE' : 'USERS.ACTIVE') | translate }}
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="text-center text-muted py-4">{{ 'USERS.NO_USERS' | translate }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  users = signal<User[]>([]);

  ngOnInit(): void {
    this.loadUsers();
  }

  toggleActive(user: User): void {
    this.userService.toggleActive(user.id).subscribe(() => this.loadUsers());
  }

  private loadUsers(): void {
    this.userService.getAll().subscribe(users => this.users.set(users));
  }
}
